import pool from "../config/db.js";

// Type definitions
export interface RecipeData {
	title: string;
	ingredients: string[];
	steps: string[];
	preparationTime: number;
	image?: {
		url: string;
		publicId: string;
	};
	authorId: string;
	isPublished?: boolean;
}

export interface RecipeRow {
	id: string;
	title: string;
	ingredients: string[];
	steps: string[];
	preparation_time: number;
	image_url: string | null;
	image_public_id: string | null;
	author_id: string;
	is_published: boolean;
	created_at: Date;
	updated_at: Date;
}

export interface RecipeWithAuthor extends RecipeRow {
	author_name: string;
	author_email: string;
}

export interface RecipeWithStats extends RecipeWithAuthor {
	rating_count: number;
	average_rating: number;
}

// Recipe model class
class Recipe {
	public id: string;
	public title: string;
	public ingredients: string[];
	public steps: string[];
	public preparationTime: number;
	public image: { url: string | null; publicId: string | null };
	public authorId: string;
	public isPublished: boolean;
	public createdAt: Date;
	public updatedAt: Date;

	constructor(data: RecipeRow) {
		this.id = data.id;
		this.title = data.title;
		this.ingredients = data.ingredients;
		this.steps = data.steps;
		this.preparationTime = data.preparation_time;
		this.image = {
			url: data.image_url,
			publicId: data.image_public_id,
		};
		this.authorId = data.author_id;
		this.isPublished = data.is_published;
		this.createdAt = data.created_at;
		this.updatedAt = data.updated_at;
	}

	static async create(recipeData: RecipeData): Promise<Recipe> {
		const {
			title,
			ingredients,
			steps,
			preparationTime,
			image = { url: "", publicId: "" },
			authorId,
			isPublished = true,
		} = recipeData;

		// Validate
		if (title.length < 3 || title.length > 100) {
			throw new Error("Title must be between 3 and 100 characters");
		}
		if (preparationTime < 1 || preparationTime > 1440) {
			throw new Error("Preparation time must be between 1 and 1440 minutes");
		}

		// Check if author exists
		const authorCheck = await pool.query("SELECT id FROM users WHERE id = $1", [
			authorId,
		]);
		if (authorCheck.rows.length === 0) {
			throw new Error("Author not found");
		}

		const result = await pool.query<RecipeRow>(
			`INSERT INTO recipes (
        title, ingredients, steps, preparation_time, 
        image_url, image_public_id, author_id, is_published
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
			[
				title,
				ingredients,
				steps,
				preparationTime,
				image.url || null,
				image.publicId || null,
				authorId,
				isPublished,
			],
		);

		return new Recipe(result.rows[0] as RecipeRow);
	}

	static async findById(
		id: string,
	): Promise<(Recipe & { authorName?: string; authorEmail?: string }) | null> {
		const result = await pool.query<RecipeWithAuthor>(
			`SELECT r.*, u.name as author_name, u.email as author_email 
       FROM recipes r
       JOIN users u ON r.author_id = u.id
       WHERE r.id = $1`,
			[id],
		);

		if (!result.rows[0]) return null;

		const recipe = new Recipe(result.rows[0]);
		return Object.assign(recipe, {
			authorName: result.rows[0].author_name,
			authorEmail: result.rows[0].author_email,
		});
	}

	static async findAll(
		options: {
			page?: number;
			limit?: number;
			sortBy?: string;
			sortOrder?: "asc" | "desc";
			authorId?: number;
			isPublished?: boolean;
			minRating?: number;
			maxPrepTime?: number;
			search?: string;
		} = {},
	): Promise<{ recipes: RecipeWithStats[]; total: number }> {
		const {
			page = 1,
			limit = 10,
			sortBy = "created_at",
			sortOrder = "desc",
			authorId,
			isPublished = true,
			minRating,
			maxPrepTime,
			search,
		} = options;

		const offset = (page - 1) * limit;
		const params: any[] = [];
		let paramIndex = 1;

		// Build WHERE clause
		const conditions: string[] = [`r.is_published = $${paramIndex++}`];
		params.push(isPublished);

		if (authorId) {
			conditions.push(`r.author_id = $${paramIndex++}`);
			params.push(authorId);
		}

		if (maxPrepTime) {
			conditions.push(`r.preparation_time <= $${paramIndex++}`);
			params.push(maxPrepTime);
		}

		if (search) {
			conditions.push(`(
      r.title ILIKE $${paramIndex} OR 
      $${paramIndex} = ANY(r.ingredients) OR
      EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = r.author_id AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})
      )
    )`);
			params.push(`%${search}%`);
			paramIndex++;
		}

		const whereClause =
			conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

		// Validate sort column
		const validSortColumns = [
			"created_at",
			"updated_at",
			"title",
			"preparation_time",
			"average_rating",
			"rating_count",
		];

		// Handle sorting by rating fields
		let orderByClause: string;
		if (sortBy === "average_rating" || sortBy === "rating_count") {
			// These are aliases from the subquery, need to order by the actual column
			orderByClause = `ORDER BY ${sortBy} ${sortOrder === "asc" ? "ASC" : "DESC"}`;
		} else {
			const sortColumn = validSortColumns.includes(sortBy)
				? sortBy
				: "created_at";
			orderByClause = `ORDER BY ${sortColumn} ${sortOrder === "asc" ? "ASC" : "DESC"}`;
		}

		let query: string;
		let countQuery: string;
		let countParams: any[] = [];

		if (minRating) {
			// With rating filter
			query = `
      SELECT 
        r.*,
        u.name as author_name,
        u.email as author_email,
        COALESCE(ROUND(rs.avg_rating::numeric, 1), 0)::float as average_rating,
        COALESCE(rs.rating_count, 0)::integer as rating_count
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      LEFT JOIN (
        SELECT 
          recipe_id, 
          AVG(value)::float as avg_rating, 
          COUNT(*)::integer as rating_count
        FROM ratings
        GROUP BY recipe_id
      ) rs ON r.id = rs.recipe_id
      ${whereClause}
      AND (rs.avg_rating >= $${paramIndex} OR rs.avg_rating IS NULL AND 0 >= $${paramIndex})
      ${orderByClause}
      LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
    `;

			countQuery = `
      SELECT COUNT(*)::integer as total
      FROM recipes r
      LEFT JOIN (
        SELECT 
          recipe_id, 
          AVG(value)::float as avg_rating
        FROM ratings
        GROUP BY recipe_id
      ) rs ON r.id = rs.recipe_id
      ${whereClause}
      AND (rs.avg_rating >= $1 OR rs.avg_rating IS NULL AND 0 >= $1)
    `;

			params.push(minRating, limit, offset);

			// Build count params
			countParams = [minRating];
			if (authorId) countParams.push(authorId);
			if (maxPrepTime) countParams.push(maxPrepTime);
			if (search) countParams.push(`%${search}%`);

			paramIndex += 3;
		} else {
			// Without rating filter
			query = `
      SELECT 
        r.*,
        u.name as author_name,
        u.email as author_email,
        COALESCE(ROUND(rs.avg_rating::numeric, 1), 0)::float as average_rating,
        COALESCE(rs.rating_count, 0)::integer as rating_count
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      LEFT JOIN (
        SELECT 
          recipe_id, 
          AVG(value)::float as avg_rating, 
          COUNT(*)::integer as rating_count
        FROM ratings
        GROUP BY recipe_id
      ) rs ON r.id = rs.recipe_id
      ${whereClause}
      ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

			countQuery = `
      SELECT COUNT(*)::integer as total
      FROM recipes r
      ${whereClause}
    `;

			params.push(limit, offset);

			// Build count params (all params except limit and offset)
			countParams = params.slice(0, -2);
			paramIndex += 2;
		}

		const result = await pool.query<RecipeWithStats>(query, params);

		// Ensure all numeric fields are proper numbers
		const recipes = result.rows.map((recipe) => {
			// Create a properly typed recipe object
			const typedRecipe = {
				...recipe,
				id: recipe.id,
				preparation_time: Number(recipe.preparation_time),
				author_id: recipe.author_id,
				average_rating: recipe.average_rating
					? Number(recipe.average_rating)
					: 0,
				rating_count: recipe.rating_count ? Number(recipe.rating_count) : 0,
				created_at: new Date(recipe.created_at),
				updated_at: new Date(recipe.updated_at),
			};

			// Remove any potential string values
			return typedRecipe as unknown as RecipeWithStats;
		});

		// Get total count for pagination - ensure it's a number
		const countResult = await pool.query(countQuery, countParams);
		const total = Number(countResult.rows[0]?.total) || 0;

		return {
			recipes,
			total,
		};
	}

	static async update(
		id: string,
		userId: string,
		updates: Partial<Omit<RecipeData, "authorId">>,
	): Promise<Recipe | null> {
		// Check ownership
		const recipe = await this.findById(id);
		if (!recipe) return null;
		if (recipe.authorId !== userId) {
			throw new Error("Unauthorized to update this recipe");
		}

		const fields: string[] = [];
		const values: any[] = [];
		let paramIndex = 1;

		if (updates.title !== undefined) {
			if (updates.title.length < 3 || updates.title.length > 100) {
				throw new Error("Title must be between 3 and 100 characters");
			}
			fields.push(`title = $${paramIndex++}`);
			values.push(updates.title);
		}

		if (updates.ingredients !== undefined) {
			fields.push(`ingredients = $${paramIndex++}`);
			values.push(updates.ingredients);
		}

		if (updates.steps !== undefined) {
			fields.push(`steps = $${paramIndex++}`);
			values.push(updates.steps);
		}

		if (updates.preparationTime !== undefined) {
			if (updates.preparationTime < 1 || updates.preparationTime > 1440) {
				throw new Error("Preparation time must be between 1 and 1440 minutes");
			}
			fields.push(`preparation_time = $${paramIndex++}`);
			values.push(updates.preparationTime);
		}

		if (updates.image !== undefined) {
			fields.push(
				`image_url = $${paramIndex++}, image_public_id = $${paramIndex++}`,
			);
			values.push(updates.image?.url || null, updates.image?.publicId || null);
		}

		if (updates.isPublished !== undefined) {
			fields.push(`is_published = $${paramIndex++}`);
			values.push(updates.isPublished);
		}

		if (fields.length === 0) {
			return recipe;
		}

		values.push(id);
		const result = await pool.query<RecipeRow>(
			`UPDATE recipes SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
			values,
		);

		return result.rows[0] ? new Recipe(result.rows[0]) : null;
	}

	static async delete(id: string, userId: string): Promise<boolean> {
		// Check ownership
		const recipe = await this.findById(id);
		if (!recipe) return false;
		if (recipe.authorId !== userId) {
			throw new Error("Unauthorized to delete this recipe");
		}

		// Delete recipe (cascade will handle comments and ratings)
		const result = await pool.query(
			"DELETE FROM recipes WHERE id = $1 RETURNING id",
			[id],
		);

		return (result.rowCount ?? 0) > 0;
	}

	static async getRecipesByUser(userId: string): Promise<Recipe[]> {
		const result = await pool.query<RecipeRow>(
			"SELECT * FROM recipes WHERE author_id = $1 ORDER BY created_at DESC",
			[userId],
		);
		return result.rows.map((row) => new Recipe(row));
	}

	static async getAverageRating(
		recipeId: string,
	): Promise<{ average: number; count: number }> {
		const result = await pool.query(
			`SELECT 
        COALESCE(AVG(value), 0) as average,
        COUNT(*) as count
       FROM ratings 
       WHERE recipe_id = $1`,
			[recipeId],
		);

		return {
			average: parseFloat(result.rows[0].average) || 0,
			count: parseInt(result.rows[0].count) || 0,
		};
	}

	toJSON() {
		return {
			id: this.id,
			title: this.title,
			ingredients: this.ingredients,
			steps: this.steps,
			preparationTime: this.preparationTime,
			image: this.image,
			authorId: this.authorId,
			isPublished: this.isPublished,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}
}

export default Recipe;
