import pool from "../config/db.js";

export interface CommentData {
	content: string;
	authorId: string;
	recipeId: string;
}

export interface CommentRow {
	id: string;
	content: string;
	author_id: string;
	recipe_id: string;
	created_at: Date;
	updated_at: Date;
}

export interface CommentWithAuthor extends CommentRow {
	author_name: string;
	author_email: string;
}

class Comment {
	public id: string;
	public content: string;
	public authorId: string;
	public recipeId: string;
	public createdAt: Date;
	public updatedAt: Date;

	constructor(data: CommentRow) {
		this.id = data.id;
		this.content = data.content;
		this.authorId = data.author_id;
		this.recipeId = data.recipe_id;
		this.createdAt = data.created_at;
		this.updatedAt = data.updated_at;
	}

	static async create(commentData: CommentData): Promise<CommentWithAuthor> {
		const { content, authorId, recipeId } = commentData;

		// Validate content
		if (!content || content.trim().length === 0) {
			throw new Error("Comment content cannot be empty");
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

		const result = await pool.query<CommentWithAuthor>(
			`INSERT INTO comments (content, author_id, recipe_id) 
       VALUES ($1, $2, $3) 
       RETURNING comments.*, 
         (SELECT name FROM users WHERE id = $2) as author_name,
         (SELECT email FROM users WHERE id = $2) as author_email`,
			[content.trim(), authorId, recipeId],
		);

		return result.rows[0] as CommentWithAuthor;
	}

	static async findByRecipe(
		recipeId: string,
		options: {
			page?: number;
			limit?: number;
			sortBy?: string;
			sortOrder?: "asc" | "desc";
		} = {},
	): Promise<{ comments: CommentWithAuthor[]; total: number }> {
		const {
			page = 1,
			limit = 10,
			sortBy = "created_at",
			sortOrder = "desc",
		} = options;

		// Validate recipe exists
		const recipeCheck = await pool.query(
			"SELECT id FROM recipes WHERE id = $1",
			[recipeId],
		);
		if (recipeCheck.rows.length === 0) {
			throw new Error("Recipe not found");
		}

		const offset = (page - 1) * limit;
		const validSortColumns = ["created_at", "updated_at"];
		const sortColumn = validSortColumns.includes(sortBy)
			? sortBy
			: "created_at";
		const order = sortOrder === "asc" ? "ASC" : "DESC";

		const [commentsResult, countResult] = await Promise.all([
			pool.query<CommentWithAuthor>(
				`SELECT c.*, u.name as author_name, u.email as author_email 
         FROM comments c
         JOIN users u ON c.author_id = u.id
         WHERE c.recipe_id = $1
         ORDER BY c.${sortColumn} ${order}
         LIMIT $2 OFFSET $3`,
				[recipeId, limit, offset],
			),
			pool.query(
				"SELECT COUNT(*) as total FROM comments WHERE recipe_id = $1",
				[recipeId],
			),
		]);

		return {
			comments: commentsResult.rows,
			total: parseInt(countResult.rows[0].total),
		};
	}

	static async findById(id: string): Promise<CommentWithAuthor | null> {
		const result = await pool.query<CommentWithAuthor>(
			`SELECT c.*, u.name as author_name, u.email as author_email 
       FROM comments c
       JOIN users u ON c.author_id = u.id
       WHERE c.id = $1`,
			[id],
		);
		return result.rows[0] || null;
	}

	static async findByUser(
		userId: string,
		options: {
			page?: number;
			limit?: number;
			sortBy?: string;
			sortOrder?: "asc" | "desc";
		} = {},
	): Promise<{ comments: CommentWithAuthor[]; total: number }> {
		const {
			page = 1,
			limit = 10,
			sortBy = "created_at",
			sortOrder = "desc",
		} = options;

		const offset = (page - 1) * limit;
		const validSortColumns = ["created_at", "updated_at"];
		const sortColumn = validSortColumns.includes(sortBy)
			? sortBy
			: "created_at";
		const order = sortOrder === "asc" ? "ASC" : "DESC";

		const [commentsResult, countResult] = await Promise.all([
			pool.query<CommentWithAuthor>(
				`SELECT c.*, u.name as author_name, u.email as author_email,
                r.title as recipe_title
         FROM comments c
         JOIN users u ON c.author_id = u.id
         JOIN recipes r ON c.recipe_id = r.id
         WHERE c.author_id = $1
         ORDER BY c.${sortColumn} ${order}
         LIMIT $2 OFFSET $3`,
				[userId, limit, offset],
			),
			pool.query(
				"SELECT COUNT(*) as total FROM comments WHERE author_id = $1",
				[userId],
			),
		]);

		return {
			comments: commentsResult.rows,
			total: parseInt(countResult.rows[0].total),
		};
	}

	static async update(
		id: string,
		userId: string,
		content: string,
	): Promise<CommentWithAuthor | null> {
		// Validate content
		if (!content || content.trim().length === 0) {
			throw new Error("Comment content cannot be empty");
		}

		// Check ownership
		const comment = await this.findById(id);
		if (!comment) return null;
		if (comment.author_id !== userId) {
			throw new Error("Unauthorized to update this comment");
		}

		const result = await pool.query<CommentWithAuthor>(
			`UPDATE comments SET content = $1 
       WHERE id = $2 
       RETURNING comments.*, 
         (SELECT name FROM users WHERE id = $3) as author_name,
         (SELECT email FROM users WHERE id = $3) as author_email`,
			[content.trim(), id, userId],
		);

		return result.rows[0] || null;
	}

	static async delete(id: string, userId: string): Promise<boolean> {
		// Check if comment exists and user owns it
		const comment = await this.findById(id);
		if (!comment) return false;
		if (comment.author_id !== userId) {
			throw new Error("Unauthorized to delete this comment");
		}

		const result = await pool.query(
			"DELETE FROM comments WHERE id = $1 AND author_id = $2 RETURNING id",
			[id, userId],
		);
		return (result.rowCount ?? 0) > 0;
	}

	static async deleteByRecipe(recipeId: string): Promise<boolean> {
		// Admin function or cascade delete - use with caution
		const result = await pool.query(
			"DELETE FROM comments WHERE recipe_id = $1 RETURNING id",
			[recipeId],
		);
		return (result.rowCount ?? 0) > 0;
	}

	static async getRecentComments(
		limit: number = 10,
	): Promise<CommentWithAuthor[]> {
		const result = await pool.query<CommentWithAuthor>(
			`SELECT c.*, u.name as author_name, u.email as author_email,
              r.title as recipe_title, r.id as recipe_id
       FROM comments c
       JOIN users u ON c.author_id = u.id
       JOIN recipes r ON c.recipe_id = r.id
       ORDER BY c.created_at DESC
       LIMIT $1`,
			[limit],
		);
		return result.rows;
	}

	toJSON() {
		return {
			id: this.id,
			content: this.content,
			authorId: this.authorId,
			recipeId: this.recipeId,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}
}

export default Comment;
