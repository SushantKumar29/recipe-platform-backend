import type { Request, Response, NextFunction } from "express";
import Comment from "../models/Comment.js";

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

		const comment = res.locals.comment || (await Comment.findById(id));

		if (!comment) {
			return res.status(404).json({ message: "Comment not found" });
		}

		comment.content = content;
		await comment.save();

		res.status(200).json({ message: "Comment updated successfully", comment });
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

		res.status(200).json({ message: "Comment removed successfully" });
	} catch (error) {
		next(error);
	}
};
