import type { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type PrismaModel = keyof typeof prisma;

export const checkOwnership = (
	modelName: PrismaModel,
	fieldName = "authorId",
) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = req.params;
			const userId = res.locals.user?.id || req.params.userId;

			if (!userId) {
				return res.status(401).json({ message: "Unauthorized" });
			}

			// Get the model from Prisma
			const model = (prisma as any)[modelName as string];

			if (!model) {
				return res
					.status(500)
					.json({ message: `Model ${String(modelName)} not found` });
			}

			// Find the document
			const document = await model.findUnique({
				where: { id },
			});

			if (!document) {
				return res.status(404).json({
					message: `${String(modelName)} not found`,
				});
			}

			// Check ownership
			const ownerId = document[fieldName];

			if (!ownerId || ownerId !== userId) {
				return res.status(403).json({
					message: `Not allowed to modify this ${String(modelName).toLowerCase()}`,
				});
			}

			// Store in res.locals for later use
			res.locals[String(modelName).toLowerCase()] = document;
			next();
		} catch (error) {
			next(error);
		}
	};
};
