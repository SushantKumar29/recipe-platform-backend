import type { Request, Response, NextFunction } from "express";
import * as Recipe from "../models/Recipe.js";
import * as Rating from "../models/Rating.js";
import * as Comment from "../models/Comment.js";
import cloudinary from "../config/cloudinary.js";
import { normalizeTextList } from "../lib/formatter.js";
import type { UploadApiResponse } from "cloudinary";

interface AuthRequest extends Request {
	user?: { id: string };
}

export const fetchRecipes = async (
	req: AuthRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const {
			search,
			authorId,
			preparationTime,
			minRating,
			page = "1",
			limit = "10",
			sortBy = "createdAt",
			sortOrder = "desc",
		} = req.query;

		const pageNum = parseInt(page as string) || 1;
		const limitNum = parseInt(limit as string) || 10;

		let maxPrepTime: number | undefined;
		if (preparationTime) {
			switch (preparationTime) {
				case "0-30":
					maxPrepTime = 30;
					break;
				case "30-60":
					maxPrepTime = 60;
					break;
				case "60-120":
					maxPrepTime = 120;
					break;
				case "120+":
					maxPrepTime = 1440;
					break;
			}
		}

		const result = await Recipe.getRecipes({
			page: pageNum,
			limit: limitNum,
			authorId: authorId as string,
			search: search as string,
			isPublished: true,
		});

		res.status(200).json({
			data: result.recipes,
			pagination: {
				page: pageNum,
				limit: limitNum,
				total: result.total,
				pages: Math.ceil(result.total / limitNum),
			},
		});
	} catch (error) {
		next(error);
	}
};

export const fetchRecipe = async (
	req: AuthRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id } = req.params;

		const recipe = await Recipe.getRecipeById(id as string);
		if (!recipe) {
			return res.status(404).json({ message: "Recipe not found" });
		}

		const ratingStats = await Rating.getRecipeAverageRating(id as string);

		const { comments } = await Comment.getRecipeComments(id as string, {
			limit: 5,
		});

		res.status(200).json({
			...recipe,
			ratingCount: ratingStats.count,
			averageRating: ratingStats.average,
			recentComments: comments,
		});
	} catch (error) {
		next(error);
	}
};

export const createRecipe = async (
	req: AuthRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { title, ingredients, steps, preparationTime } = req.body;
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		if (!title || !ingredients || !steps || !preparationTime) {
			return res.status(400).json({ message: "All fields are required" });
		}

		const normalizedIngredients = normalizeTextList(ingredients);
		const normalizedSteps = normalizeTextList(steps);

		let imageData: { url: string; publicId: string } = {
			url: "",
			publicId: "",
		};

		if (req.file) {
			try {
				const uploadResult = await new Promise<UploadApiResponse>(
					(resolve, reject) => {
						const uploadStream = cloudinary.uploader.upload_stream(
							{
								folder: "recipes",
								resource_type: "image",
								transformation: [
									{ width: 1200, height: 800, crop: "limit" },
									{ quality: "auto:good" },
								],
							},
							(error, result) => {
								if (error) return reject(error);
								if (!result)
									return reject(new Error("No result from Cloudinary"));
								resolve(result);
							},
						);

						uploadStream.end(req.file?.buffer);
					},
				);

				imageData = {
					url: uploadResult.secure_url,
					publicId: uploadResult.public_id,
				};
			} catch {
				return res.status(500).json({
					message: "Failed to upload image to Cloudinary",
				});
			}
		}

		const newRecipe = await Recipe.createRecipe({
			title,
			ingredients: normalizedIngredients,
			steps: normalizedSteps,
			preparationTime: Number(preparationTime),
			image: imageData,
			authorId: userId,
		});

		res.status(201).json({
			message: "Recipe created successfully",
			recipe: newRecipe,
		});
	} catch (error) {
		if (error instanceof Error) {
			if (error.message.includes("Title must be")) {
				return res.status(400).json({ message: error.message });
			}
			if (error.message.includes("Preparation time")) {
				return res.status(400).json({ message: error.message });
			}
		}
		next(error);
	}
};

export const updateRecipe = async (
	req: AuthRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id } = req.params;
		const { title, ingredients, steps, preparationTime, isPublished } =
			req.body;
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ message: "Unauthorized" });
		}
		let imageData: { url: string; publicId: string } | undefined;
		if (req.file && req.file.buffer) {
			try {
				const existingRecipe = await Recipe.getRecipeById(id as string);

				if (existingRecipe) {
					const oldPublicId = existingRecipe.imagePublicId;

					if (oldPublicId) {
						try {
							await cloudinary.uploader.destroy(oldPublicId);
							console.log("Old image deleted:", oldPublicId);
						} catch (err) {
							console.error("Error deleting old image:", err);
						}
					}
				}

				const uploadResult = await new Promise<UploadApiResponse>(
					(resolve, reject) => {
						const uploadStream = cloudinary.uploader.upload_stream(
							{
								folder: "recipes",
								resource_type: "image",
								transformation: [
									{ width: 1200, height: 800, crop: "limit" },
									{ quality: "auto:good" },
								],
							},
							(error, result) => {
								if (error) return reject(error);
								if (!result)
									return reject(new Error("No result from Cloudinary"));
								resolve(result);
							},
						);
						uploadStream.end(req.file!.buffer);
					},
				);

				imageData = {
					url: uploadResult.secure_url,
					publicId: uploadResult.public_id,
				};
			} catch (error) {
				console.error("Cloudinary upload error:", error);
				return res.status(500).json({
					message: "Failed to upload image to Cloudinary",
				});
			}
		}
		const updates: any = {};
		if (title) updates.title = title;
		if (ingredients) updates.ingredients = normalizeTextList(ingredients);
		if (steps) updates.steps = normalizeTextList(steps);
		if (preparationTime) updates.preparationTime = Number(preparationTime);
		if (imageData) updates.image = imageData;
		if (isPublished !== undefined) updates.isPublished = isPublished;
		try {
			const updatedRecipe = await Recipe.updateRecipe(
				id as string,
				userId,
				updates,
			);
			res.status(200).json({
				message: "Recipe updated successfully",
				recipe: updatedRecipe,
			});
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === "Unauthorized") {
					return res.status(403).json({ message: error.message });
				}
				if (error.message === "Recipe not found") {
					return res.status(404).json({ message: error.message });
				}
			}
			throw error;
		}
	} catch (error) {
		if (error instanceof Error) {
			if (
				error.message.includes("Title must be") ||
				error.message.includes("Preparation time")
			) {
				return res.status(400).json({ message: error.message });
			}
		}
		next(error);
	}
};

export const deleteRecipe = async (
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

		const recipe = await Recipe.getRecipeById(id as string);
		if (!recipe) {
			return res.status(404).json({ message: "Recipe not found" });
		}

		if (recipe.imagePublicId) {
			try {
				await cloudinary.uploader.destroy(recipe.imagePublicId);
			} catch (deleteError) {
				console.error("Error deleting image from Cloudinary:", deleteError);
			}
		}

		try {
			await Recipe.deleteRecipe(id as string, userId);
			res.status(200).json({
				message: "Recipe deleted successfully",
			});
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === "Unauthorized") {
					return res.status(403).json({ message: error.message });
				}
				if (error.message === "Recipe not found") {
					return res.status(404).json({ message: error.message });
				}
			}
			throw error;
		}
	} catch (error) {
		next(error);
	}
};

export const rateRecipe = async (
	req: AuthRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id } = req.params;
		const { value } = req.body;
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		if (!value || value < 1 || value > 5) {
			return res
				.status(400)
				.json({ message: "Rating value must be between 1 and 5" });
		}

		const recipe = await Recipe.getRecipeById(id as string);
		if (!recipe) {
			return res.status(404).json({ message: "Recipe not found" });
		}

		try {
			const rating = await Rating.createRating({
				value,
				authorId: userId,
				recipeId: id as string,
			});

			res.status(201).json({
				message: "Recipe rated successfully",
				rating,
			});
		} catch (error) {
			if (
				error instanceof Error &&
				error.message === "User has already rated this recipe"
			) {
				return res.status(400).json({ message: error.message });
			}
			throw error;
		}
	} catch (error) {
		next(error);
	}
};

export const fetchRecipeComments = async (
	req: AuthRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id } = req.params;
		const { page = "1", limit = "10" } = req.query;

		const pageNum = Math.max(1, parseInt(page as string));
		const limitNum = Math.max(1, parseInt(limit as string));

		const { comments, total } = await Comment.getRecipeComments(id as string, {
			page: pageNum,
			limit: limitNum,
		});

		const totalPages = Math.ceil(total / limitNum);

		res.status(200).json({
			comments,
			pagination: {
				page: pageNum,
				totalPages,
				totalComments: total,
				hasNext: pageNum < totalPages,
				hasPrev: pageNum > 1,
				limit: limitNum,
			},
		});
	} catch (error) {
		next(error);
	}
};

export const addCommentToRecipe = async (
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

		const recipe = await Recipe.getRecipeById(id as string);
		if (!recipe) {
			return res.status(404).json({ message: "Recipe not found" });
		}

		const existingComments = await Comment.getRecipeComments(id as string, {
			limit: 100,
		});
		const hasCommented = existingComments.comments.some(
			(c: any) => c.authorId === userId,
		);

		if (hasCommented) {
			return res
				.status(400)
				.json({ message: "You have already commented on this recipe" });
		}

		const comment = await Comment.createComment({
			content,
			authorId: userId,
			recipeId: id as string,
		});

		res.status(201).json({
			message: "Comment added successfully",
			comment,
		});
	} catch (error) {
		next(error);
	}
};
