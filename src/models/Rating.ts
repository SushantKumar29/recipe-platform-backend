import pool from "../config/db.js";

export interface RatingData {
	value: number;
	authorId: string;
	recipeId: string;
}

export interface RatingRow {
	id: string;
	value: number;
	author_id: string;
	recipe_id: string;
	created_at: Date;
	updated_at: Date;
}

class Rating {
	public id: string;
	public value: number;
	public authorId: string;
	public recipeId: string;
	public createdAt: Date;
	public updatedAt: Date;

	constructor(data: RatingRow) {
		this.id = data.id;
		this.value = data.value;
		this.authorId = data.author_id;
		this.recipeId = data.recipe_id;
		this.createdAt = data.created_at;
		this.updatedAt = data.updated_at;
	}

	static async create(ratingData: RatingData): Promise<Rating> {
		const { value, authorId, recipeId } = ratingData;

		// Validate rating value
		if (value < 1 || value > 5) {
			throw new Error("Rating value must be between 1 and 5");
		}

		// Check if recipe exists
		const recipeCheck = await pool.query(
			"SELECT id FROM recipes WHERE id = $1",
			[recipeId],
		);
		if (recipeCheck.rows.length === 0) {
			throw new Error("Recipe not found");
		}

		// Check if user exists
		const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [
			authorId,
		]);
		if (userCheck.rows.length === 0) {
			throw new Error("User not found");
		}

		// Check if already rated (unique constraint will also catch this, but we want a nice error message)
		const existing = await this.findByUserAndRecipe(authorId, recipeId);
		if (existing) {
			throw new Error("User has already rated this recipe");
		}

		try {
			const result = await pool.query<RatingRow>(
				`INSERT INTO ratings (value, author_id, recipe_id) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
				[value, authorId, recipeId],
			);

			return new Rating(result.rows[0] as RatingRow);
		} catch (error: any) {
			// Handle unique constraint violation
			if (error.code === "23505") {
				// PostgreSQL unique violation code
				throw new Error("User has already rated this recipe");
			}
			throw error;
		}
	}

	static async findByUserAndRecipe(
		authorId: string,
		recipeId: string,
	): Promise<Rating | null> {
		const result = await pool.query<RatingRow>(
			"SELECT * FROM ratings WHERE author_id = $1 AND recipe_id = $2",
			[authorId, recipeId],
		);
		return result.rows[0] ? new Rating(result.rows[0]) : null;
	}

	static async findByRecipe(recipeId: string): Promise<Rating[]> {
		const result = await pool.query<RatingRow>(
			"SELECT * FROM ratings WHERE recipe_id = $1 ORDER BY created_at DESC",
			[recipeId],
		);
		return result.rows.map((row) => new Rating(row));
	}

	static async getAverageForRecipe(
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

	static async update(
		id: string,
		userId: string,
		value: number,
	): Promise<Rating | null> {
		// Validate rating value
		if (value < 1 || value > 5) {
			throw new Error("Rating value must be between 1 and 5");
		}

		// Check ownership
		const rating = await this.findById(id);
		if (!rating) return null;
		if (rating.authorId !== userId) {
			throw new Error("Unauthorized to update this rating");
		}

		const result = await pool.query<RatingRow>(
			`UPDATE ratings 
       SET value = $1 
       WHERE id = $2 
       RETURNING *`,
			[value, id],
		);

		return result.rows[0] ? new Rating(result.rows[0]) : null;
	}

	static async findById(id: string): Promise<Rating | null> {
		const result = await pool.query<RatingRow>(
			"SELECT * FROM ratings WHERE id = $1",
			[id],
		);
		return result.rows[0] ? new Rating(result.rows[0]) : null;
	}

	static async delete(id: string, userId: string): Promise<boolean> {
		// Check ownership
		const rating = await this.findById(id);
		if (!rating) return false;
		if (rating.authorId !== userId) {
			throw new Error("Unauthorized to delete this rating");
		}

		const result = await pool.query(
			"DELETE FROM ratings WHERE id = $1 RETURNING id",
			[id],
		);
		return (result.rowCount ?? 0) > 0;
	}

	async delete(): Promise<boolean> {
		const result = await pool.query(
			"DELETE FROM ratings WHERE id = $1 RETURNING id",
			[this.id],
		);
		return (result.rowCount ?? 0) > 0;
	}

	toJSON() {
		return {
			id: this.id,
			value: this.value,
			authorId: this.authorId,
			recipeId: this.recipeId,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}
}

export default Rating;
