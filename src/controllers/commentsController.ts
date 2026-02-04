import type { Request, Response, NextFunction } from "express";
import Comment from "../models/Comment.js";

export const createComment = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { recipeId, content, authorId } = req.body;

		if (!content) {
			return res.status(400).json({ message: "Content is required" });
		}

		const newComment = new Comment({
			recipe: recipeId,
			content,
			author: authorId,
		});

		const savedComment = await newComment.save();
		res
			.status(201)
			.json({ message: "Comment sdded successfully", comment: savedComment });
	} catch (error) {
		next(error);
	}
};

export const updateComment = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id } = req.params;
		const { content } = req.body;

		if (!content) {
			return res.status(400).json({ message: "Content is required" });
		}

		const comment = await Comment.findById(id);

		if (!comment) {
			return res.status(404).json({ message: "Comment not found" });
		}

		comment.content = content;
		await comment.save();

		return res.status(200).json(comment);
	} catch (error) {
		next(error);
	}
};

export const deleteComment = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id } = req.params;

		const deletedComment = await Comment.findByIdAndDelete(id);

		if (!deletedComment) {
			return res.status(404).json({ message: "Comment not found" });
		}

		res.status(200).json({
			message: "Comment removed successfully",
		});
	} catch (error) {
		next(error);
	}
};
