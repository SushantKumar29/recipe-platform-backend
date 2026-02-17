import pool from "./db.js";

class DatabaseInitializer {
	private static instance: DatabaseInitializer;
	private initialized = false;

	private constructor() {}

	static getInstance(): DatabaseInitializer {
		if (!DatabaseInitializer.instance) {
			DatabaseInitializer.instance = new DatabaseInitializer();
		}
		return DatabaseInitializer.instance;
	}

	async initializeAllTables(): Promise<void> {
		if (this.initialized) {
			console.log("Database already initialized");
			return;
		}

		try {
			await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
			await pool.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm";`);

			await pool.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);

			await this.initializeUsersTable();

			await this.initializeRecipesTable();

			await this.initializeRatingsTable();

			await this.initializeCommentsTable();

			this.initialized = true;
			console.log("✅ All database tables initialized successfully");
		} catch (error) {
			console.error("❌ Failed to initialize database tables:", error);
			throw error;
		}
	}

	private async initializeUsersTable(): Promise<void> {
		await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

		await pool.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

		console.log("  ✓ Users table ready");
	}

	private async initializeRecipesTable(): Promise<void> {
		await pool.query(`
      CREATE TABLE IF NOT EXISTS recipes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(100) NOT NULL CHECK (LENGTH(title) >= 3),
        ingredients TEXT[] NOT NULL,
        steps TEXT[] NOT NULL,
        preparation_time INTEGER NOT NULL CHECK (preparation_time >= 1 AND preparation_time <= 1440),
        image_url TEXT,
        image_public_id TEXT,
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        is_published BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

		await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_recipes_preparation_time ON recipes(preparation_time);
      CREATE INDEX IF NOT EXISTS idx_recipes_author_id ON recipes(author_id);
      CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_recipes_is_published ON recipes(is_published);
      CREATE INDEX IF NOT EXISTS idx_recipes_title_trgm ON recipes USING gin (title gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_recipes_ingredients ON recipes USING gin (ingredients);
    `);

		await pool.query(`
      DROP TRIGGER IF EXISTS update_recipes_updated_at ON recipes;
      CREATE TRIGGER update_recipes_updated_at
        BEFORE UPDATE ON recipes
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

		console.log("  ✓ Recipes table ready");
	}

	private async initializeRatingsTable(): Promise<void> {
		await pool.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        value INTEGER NOT NULL CHECK (value >= 1 AND value <= 5),
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(author_id, recipe_id)
      );
    `);

		await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ratings_recipe_id ON ratings(recipe_id);
      CREATE INDEX IF NOT EXISTS idx_ratings_author_id ON ratings(author_id);
    `);

		await pool.query(`
      DROP TRIGGER IF EXISTS update_ratings_updated_at ON ratings;
      CREATE TRIGGER update_ratings_updated_at
        BEFORE UPDATE ON ratings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

		console.log("  ✓ Ratings table ready");
	}

	private async initializeCommentsTable(): Promise<void> {
		await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT NOT NULL,
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

		await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_comments_recipe_id ON comments(recipe_id);
      CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
      CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
    `);

		await pool.query(`
      DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
      CREATE TRIGGER update_comments_updated_at
        BEFORE UPDATE ON comments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

		console.log("  ✓ Comments table ready");
	}

	async isInitialized(): Promise<boolean> {
		return this.initialized;
	}

	async resetInitialization(): Promise<void> {
		this.initialized = false;
	}
}

export const dbInitializer = DatabaseInitializer.getInstance();
