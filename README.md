## Recipe Platform – Backend

This repository contains the backend service for the Recipe Sharing Platform. It is built using Node.js, Express, and TypeScript and provides RESTful APIs for authentication, recipe management, and comments. Data is persisted using MongoDB, and the application uses JWT-based authentication with secure password handling.

This is the backend for the recipe platform application. It is built using Node.js and Express.js. The backend handles all the API requests and stores data in a MongoDB database.

## Tech Stack

- Node.js – JavaScript runtime
- Express.js – Web framework
- TypeScript – Static typing for better maintainability
- MongoDB – NoSQL database
- Mongoose – MongoDB object modeling
- Cloudinary – Image hosting
- JWT (JSON Web Tokens) – Authentication & authorization
- bcrypt – Secure password hashing
- Upstash Redis – Rate limiting and API protection
- Swagger – API documentation

## Responsibilities

- User authentication and authorization
- Recipe CRUD operations
- Comment management
- Secure API access using JWT
- Rate limiting for API protection
- Centralized error handling

## API Endpoints

Authentication

- POST /api/v1/auth/signup – Register a new user
- POST /api/v1/auth/login – Login using email and password
- POST /api/v1/auth/logout – Logout the current user

Recipes

- POST /api/v1/recipes – Create a new recipe (authenticated)
- GET /api/v1/recipes – Fetch all recipes
- GET /api/v1/recipes/:id – Fetch a recipe by ID
- PATCH /api/v1/recipes/:id – Update a recipe (authenticated, owner only)
- DELETE /api/v1/recipes/:id – Delete a recipe (authenticated, owner only)
- GET api/v1/recipes/{id}/comments – Get paginated comments for a recipe
- POST api/v1/recipes/{id}/comments – Add comment to recipe (authenticated)
- POST api/v1/recipes/{id}/rate – Rate a recipe (authenticated)

Comments

- PATCH /api/v1/comments/:id – Update a comment (authenticated, owner only)
- DELETE /api/v1/comments/:id – Delete a comment (authenticated, owner only)

## Access Control

Users must be logged in to:

- Create recipes
- Update recipe (owner only)
- Delete recipe (owner only)
- Rate recipes
- Comment on recipes
- Update comments (owner only)
- Delete comments (owner only)

Guests can view recipes only

## Environment Variables

Create a .env file in the root directory and configure the following:

```
PORT=3000
NODE_ENV=development

MONGO_URI=your_mongodb_connection_string
ACCESS_TOKEN=your_jwt_secret

UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

# Variable Description

MONGO_URI – MongoDB connection string
ACCESS_TOKEN – Secret key for signing JWTs
PORT – Server port (default: 3000)
NODE_ENV – Application environment
UPSTASH_REDIS_REST_URL / TOKEN – Used for rate limiting
CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET – Cloudinary credentials (for image upload)

## Getting Started

1. Clone the Repository

```
git clone https://github.com/SushantKumar29/recipe-platform-backend.git
cd recipe-platform-backend
```

2. Install Dependencies

```
npm install
```

3. Run the Development Server

```
npm run dev
```

4. Test the API

```
npm run test
```

## Server URL

The backend server will be available at:

```
http://localhost:3000
```

The Swagger Documentation will vi accessible at:

```
http://localhost:3000/api-docs/
```

## Project Structure (Overview)

- src/ – Application source code
  - config/ – Environment and database configuration
  - controllers/ – Request handlers
  - lib/ – Utility functions (like formatters and token creation)
  - middlewares/ – Auth, error handling, rate limiting
  - models/ – Mongoose schemas
  - routes/ – API route definitions
  - utils/ – Helpers and utilities
- tests/ – Integration tests

## Notes

Ensure MongoDB, Upstash and Cloudinary credentials are correctly configured.
This backend is designed to work with the Recipe Platform Frontend.
Node.js v18+ is recommended for best compatibility.
