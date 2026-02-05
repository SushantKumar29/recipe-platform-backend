import express from "express";
import {
	fetchRecipes,
	fetchRecipe,
	createRecipe,
	updateRecipe,
	deleteRecipe,
	rateRecipe,
} from "../controllers/recipesController.js";
import { requireAuth } from "../middleware/auth.js";

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
 *         - isPublished
 *         - author
 *         - image
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
 *         isPublished:
 *           type: boolean
 *           description: Whether the recipe is published or not
 *         author:
 *           type: string
 *           description: ID of the user who created the recipe
 *         image:
 *           type: string
 *           description: URL of the image for the recipe
 */

/**
 * @swagger
 * /recipes:
 *   get:
 *     summary: Fetch recipes with filtering, pagination, and sorting
 *     tags: [Recipes]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter recipes by title or description
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *         description: Filter recipes by author ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, title, rating]
 *           default: createdAt
 *         description: Field to sort recipes by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order (ascending or descending)
 *     responses:
 *       200:
 *         description: A paginated list of recipes with ratings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recipe'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       description: Current page number
 *                     limit:
 *                       type: integer
 *                       description: Number of items per page
 *                     total:
 *                       type: integer
 *                       description: Total number of items
 *                     pages:
 *                       type: integer
 *                       description: Total number of pages
 *       401:
 *         description: Unauthorized
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *       404:
 *         description: Recipe not found
 *       401:
 *         description: Unauthorized
 */

router.get("/:id", fetchRecipe);

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
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Recipe'
 *     responses:
 *       201:
 *         description: Recipe created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

router.post("/", requireAuth, createRecipe);

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
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Recipe'
 *     responses:
 *       200:
 *         description: Recipe updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

router.put("/:id", requireAuth, updateRecipe);

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
 *         description: Not authenticated
 *       404:
 *         description: Recipe not found
 */

router.delete("/:id", requireAuth, deleteRecipe);

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
 *               - authorId
 *             properties:
 *               value:
 *                 type: number
 *                 minimum: 0.5
 *                 maximum: 5
 *               authorId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rating added successfully
 *       400:
 *         description: Bad request or already rated
 *       404:
 *         description: Recipe not found
 */

router.post("/:id/rate", requireAuth, rateRecipe);

export default router;
