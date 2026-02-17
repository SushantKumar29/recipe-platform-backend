import express from "express";
import {
	fetchRecipes,
	fetchRecipe,
	createRecipe,
	updateRecipe,
	deleteRecipe,
	rateRecipe,
	addCommentToRecipe,
	fetchRecipeComments,
} from "../controllers/recipesController.js";
import { requireAuth } from "../middleware/auth.js";
import { checkOwnership } from "../middleware/ownership.ts";
import { uploadSingleImage } from "../middleware/upload.ts";

const router = express.Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Recipe:
 *       type: object
 *       required:
 *         - title
 *         - ingredients
 *         - steps
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the recipe
 *         ingredients:
 *           type: string
 *           description: Ingredients of the recipe
 *         steps:
 *           type: string
 *           description: Steps to prepare the recipe
 *         image:
 *           type: string
 *           format: binary
 *           description: URL of the image for the recipe
 */

/**
 * @swagger
 * /recipes:
 *   get:
 *     summary: Fetch recipes with filtering, pagination, and sorting
 *     tags: [Recipes]
 *     parameters:
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Search term to filter recipes by title or description
 *       - name: authorId
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter recipes by author ID
 *       - name: preparationTime
 *         in: query
 *         description: Filter by preparation time range
 *         schema:
 *           type: string
 *           enum: [0-30, 30-60, 60-120, 120+]
 *           example: "0-30"
 *       - name: minRating
 *         in: query
 *         description: Minimum average rating (1-5)
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *           example: 4
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - name: sortBy
 *         in: query
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, title, rating]
 *           default: createdAt
 *         description: Field to sort recipes by
 *       - name: sortOrder
 *         in: query
 *         schema:
 *           type: string
 *           default: desc
 *         description: Sort order (ascending or descending)
 *     responses:
 *       200:
 *         description: List of recipes with ratings
 *       500:
 *         description: Internal server error
 */
router.get("/", fetchRecipes);

/**
 * @swagger
 * /recipes/{id}:
 *   get:
 *     summary: Fetch a single recipe
 *     tags: [Recipes]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the recipe
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A single recipe
 *       404:
 *         description: Recipe not found
 */
router.get("/:id", fetchRecipe);

/**
 * @swagger
 * /recipes/{id}/comments:
 *   get:
 *     summary: Get paginated comments for a recipe
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *       - name: page
 *         in: query
 *         default: 1
 *       - name: limit
 *         in: query
 *         default: 10
 *       - name: sortBy
 *         in: query
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt]
 *           default: createdAt
 *       - name: sortOrder
 *         in: query
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *       404:
 *         description: Recipe not found
 */
router.get("/:id/comments", fetchRecipeComments);

/**
 * @swagger
 * /recipes:
 *   post:
 *     summary: Create a new recipe
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - ingredients
 *               - steps
 *               - preparationTime
 *             properties:
 *               title:
 *                 type: string
 *               ingredients:
 *                 type: string
 *               steps:
 *                 type: string
 *               preparationTime:
 *                 type: integer
 *                 description: (in minutes)
 *                 minimum: 1
 *                 maximum: 1440
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Recipe created successfully
 */
router.post("/", requireAuth, uploadSingleImage, createRecipe);

/**
 * @swagger
 * /recipes/{id}:
 *   put:
 *     summary: Update a recipe
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the recipe
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               ingredients:
 *                 type: string
 *               steps:
 *                 type: string
 *               preparationTime:
 *                 type: integer
 *                 description: (in minutes)
 *                 minimum: 1
 *                 maximum: 1440
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Recipe updated successfully
 */

router.put(
	"/:id",
	requireAuth,
	checkOwnership("recipe", "authorId"),
	uploadSingleImage,
	updateRecipe,
);

/**
 * @swagger
 * /recipes/{id}:
 *   delete:
 *     summary: Delete a recipe
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the recipe
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recipe removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recipe not found
 */

router.delete(
	"/:id",
	requireAuth,
	checkOwnership("recipe", "authorId"),
	deleteRecipe,
);

/**
 * @swagger
 * /recipes/{id}/rate:
 *   post:
 *     summary: Rate a recipe
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the recipe
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: number
 *                 minimum: 0.5
 *                 maximum: 5
 *     responses:
 *       200:
 *         description: Rating added successfully
 *       400:
 *         description: Bad request or already rated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recipe not found
 */

router.post("/:id/rate", requireAuth, rateRecipe);

/**
 * @swagger
 * /recipes/{id}/comments:
 *   post:
 *     summary: Add comment to recipe
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment added successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recipe not found
 */

router.post("/:id/comments", requireAuth, addCommentToRecipe);

export default router;
