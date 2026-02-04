## Recipe Platform – Backend

This repository contains the backend service for the Recipe Sharing Platform. It is built using Node.js, Express, and TypeScript and provides RESTful APIs for authentication, recipe management, and comments. Data is persisted using MongoDB, and the application uses JWT-based authentication with secure password handling.

This is the backend for the recipe platform application. It is built using Node.js and Express.js. The backend handles all the API requests and stores data in a MongoDB database.

## Tech Stack

- Node.js – JavaScript runtime
- Express.js – Web framework
- TypeScript – Static typing for better maintainability
- MongoDB – NoSQL database
- Mongoose – MongoDB object modeling
- JWT (JSON Web Tokens) – Authentication & authorization
- bcrypt – Secure password hashing
- Upstash Redis – Rate limiting and API protection

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

Comments

- POST /api/v1/comments – Add a comment to a recipe (authenticated)
- PATCH /api/v1/comments/:id – Update a comment (authenticated, owner only)
- DELETE /api/v1/comments/:id – Delete a comment (authenticated, owner only)

## Access Control

Users must be logged in to:

- Create recipes
- Rate recipes
- Comment on recipes

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
```

# Variable Description

MONGO_URI – MongoDB connection string
ACCESS_TOKEN – Secret key for signing JWTs
PORT – Server port (default: 3000)
NODE_ENV – Application environment
UPSTASH_REDIS_REST_URL / TOKEN – Used for rate limiting

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

## Server URL

The backend server will be available at:

```
http://localhost:3000
```

## Project Structure (Overview)

- src/ – Application source code
  - controllers/ – Request handlers
  - routes/ – API route definitions
  - models/ – Mongoose schemas
  - middlewares/ – Auth, error handling, rate limiting
  - utils/ – Helpers and utilities
  - config/ – Environment and database configuration

## Notes

Ensure MongoDB and Upstash credentials are correctly configured.
This backend is designed to work with the Recipe Platform Frontend.
Node.js v18+ is recommended for best compatibility.
