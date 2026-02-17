import express from "express";
import {
	deleteComment,
	updateComment,
} from "../controllers/commentsController.js";
import { requireAuth } from "../middleware/auth.js";
import { checkOwnership } from "../middleware/ownership.ts";

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
 *     Comment:
 *       type: object
 *       required:
 *         - content
 *         - author
 *         - recipe
 *       properties:
 *         content:
 *           type: string
 *           description: Comment contents
 *         authorId:
 *           type: string
 *           description: Author of the comment
 *         recipeId:
 *           type: string
 *           description: Recipe associated with the comment
 */

/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the comment
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

router.put(
	"/:id",
	requireAuth,
	checkOwnership("comment", "authorId"),
	updateComment,
);

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the comment
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment removed successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Comment not found
 */

router.delete(
	"/:id",
	requireAuth,
	checkOwnership("comment", "authorId"),
	deleteComment,
);

export default router;
