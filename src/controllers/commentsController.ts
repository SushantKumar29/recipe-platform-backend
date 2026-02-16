import type { Request, Response, NextFunction } from "express";
import Comment from "../models/Comment.js";
import { formatId } from "../lib/formatter.js";

interface AuthRequest extends Request {
	user?: { id: string };
}

export const updateComment = async (
	req: AuthRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id } = req.params;
		const { content } = req.body;
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		if (!content || content.trim().length === 0) {
			return res.status(400).json({ message: "Content is required" });
		}

		const commentId = id as string;
		if (!commentId) {
			return res.status(400).json({ message: "Invalid comment ID" });
		}

		try {
			const updatedComment = await Comment.update(commentId, userId, content);

			if (!updatedComment) {
				return res.status(404).json({ message: "Comment not found" });
			}

			// Format comment to convert id to _id
			const formattedComment = formatId(updatedComment);

			res.status(200).json({
				message: "Comment updated successfully",
				comment: formattedComment,
			});
		} catch (error) {
			if (
				error instanceof Error &&
				error.message === "Unauthorized to update this comment"
			) {
				return res.status(403).json({ message: error.message });
			}
			throw error;
		}
	} catch (error) {
		next(error);
	}
};

export const deleteComment = async (
	req: AuthRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id } = req.params;
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const commentId = id as string;
		if (!commentId) {
			return res.status(400).json({ message: "Invalid comment ID" });
		}

		try {
			const deleted = await Comment.delete(commentId, userId);

			if (!deleted) {
				return res.status(404).json({ message: "Comment not found" });
			}

			res.status(200).json({ message: "Comment deleted successfully" });
		} catch (error) {
			if (
				error instanceof Error &&
				error.message === "Unauthorized to delete this comment"
			) {
				return res.status(403).json({ message: error.message });
			}
			throw error;
		}
	} catch (error) {
		next(error);
	}
};
