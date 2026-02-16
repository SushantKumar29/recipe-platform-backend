import bcrypt from "bcrypt";
import pool from "../config/db.js";

// Type definitions
export interface UserData {
	name: string;
	email: string;
	password: string;
	image?: string;
}

export interface UserRow {
	id: string;
	name: string;
	email: string;
	password: string;
	image: string | null;
	created_at: Date;
	updated_at: Date;
}

// User model class
class User {
	public id: string;
	public name: string;
	public email: string;
	public password: string;
	public image: string | null;
	public createdAt: Date;
	public updatedAt: Date;

	constructor(data: UserRow) {
		this.id = data.id;
		this.name = data.name;
		this.email = data.email;
		this.password = data.password;
		this.image = data.image;
		this.createdAt = data.created_at;
		this.updatedAt = data.updated_at;
	}

	static async findAll(): Promise<User[]> {
		const result = await pool.query<UserRow>(
			"SELECT * FROM users ORDER BY created_at DESC",
		);
		return result.rows.map((row) => new User(row));
	}

	static async create(userData: UserData): Promise<User> {
		const { name, email, password, image } = userData;

		// Validate password length
		if (!password || password.length < 8) {
			throw new Error("Password must be at least 8 characters long");
		}

		// Check if user already exists
		const existingUser = await this.findByEmail(email);
		if (existingUser) {
			throw new Error("User with this email already exists");
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 12);

		const result = await pool.query<UserRow>(
			`INSERT INTO users (name, email, password, image) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
			[name, email, hashedPassword, image || null],
		);

		return new User(result.rows[0] as UserRow);
	}

	static async findByEmail(email: string): Promise<User | null> {
		const result = await pool.query<UserRow>(
			"SELECT * FROM users WHERE email = $1",
			[email],
		);
		return result.rows[0] ? new User(result.rows[0]) : null;
	}

	static async findById(id: string): Promise<User | null> {
		const result = await pool.query<UserRow>(
			"SELECT * FROM users WHERE id = $1",
			[id],
		);
		return result.rows[0] ? new User(result.rows[0]) : null;
	}

	static async update(
		id: string,
		updates: Partial<Omit<UserData, "password">>,
	): Promise<User | null> {
		// Check if user exists
		const existingUser = await this.findById(id);
		if (!existingUser) {
			return null;
		}

		// If email is being updated, check if it's already taken
		if (updates.email && updates.email !== existingUser.email) {
			const userWithEmail = await this.findByEmail(updates.email);
			if (userWithEmail) {
				throw new Error("Email is already in use");
			}
		}

		const fields: string[] = [];
		const values: any[] = [];
		let paramIndex = 1;

		// Build dynamic update query
		const entries = Object.entries(updates);
		for (const [key, value] of entries) {
			// Convert camelCase to snake_case for database columns
			const dbKey =
				key === "createdAt"
					? "created_at"
					: key === "updatedAt"
						? "updated_at"
						: key;
			fields.push(`${dbKey} = $${paramIndex++}`);
			values.push(value);
		}

		if (fields.length === 0) {
			return existingUser;
		}

		values.push(id);
		const result = await pool.query<UserRow>(
			`UPDATE users SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
			values,
		);

		return result.rows[0] ? new User(result.rows[0]) : null;
	}

	static async delete(id: string): Promise<boolean> {
		const result = await pool.query(
			"DELETE FROM users WHERE id = $1 RETURNING id",
			[id],
		);
		return (result.rowCount ?? 0) > 0;
	}

	async comparePassword(candidatePassword: string): Promise<boolean> {
		return bcrypt.compare(candidatePassword, this.password);
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			email: this.email,
			image: this.image,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}
}

export default User;
