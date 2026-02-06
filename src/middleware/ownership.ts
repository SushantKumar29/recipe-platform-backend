import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

export const checkOwnership = (
	model: mongoose.Model<any>,
	fieldName = "author",
) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = req.params;
			const userId = res.locals.user?.id || req.params.userId;

			if (!userId) {
				return res.status(401).json({ message: "Unauthorized" });
			}

			const document = await model.findById(id);

			if (!document) {
				return res
					.status(404)
					.json({ message: `${model.modelName} not found` });
			}

			const ownerId = document[fieldName];
			const ownerIdString = ownerId.toString
				? ownerId.toString()
				: String(ownerId);

			if (ownerIdString !== userId) {
				return res.status(403).json({
					message: `Not allowed to modify this ${model.modelName.toLowerCase()}`,
				});
			}

			res.locals[model.modelName.toLowerCase()] = document;
			next();
		} catch (error) {
			next(error);
		}
	};
};
