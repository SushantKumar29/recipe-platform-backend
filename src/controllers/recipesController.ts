import type { Request, Response, NextFunction } from "express";
import Recipe, { type RecipeWithStats } from "../models/Recipe.js";
import Rating from "../models/Rating.js";
import Comment from "../models/Comment.js";
import cloudinary from "../config/cloudinary.js";
import { normalizeTextList, formatId } from "../lib/formatter.js";
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
			sortBy = "created_at",
			sortOrder = "desc",
		} = req.query;

		const pageNum = parseInt(page as string) || 1;
		const limitNum = parseInt(limit as string) || 10;

		// Parse preparation time filter
		let maxPrepTime: number = 0;
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

		const { recipes, total } = await Recipe.findAll({
			page: pageNum,
			limit: limitNum,
			sortBy: sortBy as string,
			sortOrder: sortOrder as "asc" | "desc",
			authorId: parseInt(authorId as string),
			isPublished: true,
			minRating: parseFloat(minRating as string),
			maxPrepTime,
			search: search as string,
		});

		// Format recipes to convert id to _id
		const formattedRecipes = formatId(recipes);

		res.status(200).json({
			data: formattedRecipes,
			pagination: {
				page: pageNum,
				limit: limitNum,
				total,
				pages: Math.ceil(total / limitNum),
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
		const recipeId = id as string;

		const recipe = await Recipe.findById(recipeId);
		if (!recipe) {
			return res.status(404).json({ message: "Recipe not found" });
		}

		// Get rating stats
		const ratingStats = await Rating.getAverageForRecipe(recipeId);

		// Get comments
		const { comments } = await Comment.findByRecipe(recipeId, { limit: 5 });

		// Format comments to convert id to _id
		const formattedComments = formatId(comments);

		// Format the recipe data
		const recipeData = {
			...recipe.toJSON(),
			authorName: (recipe as any).authorName,
			authorEmail: (recipe as any).authorEmail,
			ratingCount: ratingStats.count,
			averageRating: ratingStats.average,
			recentComments: formattedComments,
		};

		// Format the entire recipe object
		const formattedRecipe = formatId(recipeData);

		res.status(200).json(formattedRecipe);
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

		const newRecipe = await Recipe.create({
			title,
			ingredients: normalizedIngredients,
			steps: normalizedSteps,
			preparationTime: Number(preparationTime),
			image: imageData,
			authorId: userId,
		});

		// Format the recipe to convert id to _id
		const formattedRecipe = formatId(newRecipe.toJSON());

		res.status(201).json({
			message: "Recipe created successfully",
			recipe: formattedRecipe,
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

		const recipeId = id as string;
		let imageData: { url: string; publicId: string } | undefined;

		if (req.file) {
			// Get existing recipe to delete old image
			const existingRecipe = await Recipe.findById(recipeId);

			if (existingRecipe?.image?.publicId) {
				try {
					await cloudinary.uploader.destroy(existingRecipe.image.publicId);
				} catch (err) {
					console.error("Error deleting old image:", err);
				}
			}

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

		const updates: any = {};
		if (title) updates.title = title;
		if (ingredients) updates.ingredients = normalizeTextList(ingredients);
		if (steps) updates.steps = normalizeTextList(steps);
		if (preparationTime) updates.preparationTime = Number(preparationTime);
		if (imageData) updates.image = imageData;
		if (isPublished !== undefined) updates.isPublished = isPublished;

		try {
			const updatedRecipe = await Recipe.update(recipeId, userId, updates);

			if (!updatedRecipe) {
				return res.status(404).json({ message: "Recipe not found" });
			}

			// Format the recipe to convert id to _id
			const formattedRecipe = formatId(updatedRecipe.toJSON());

			res.status(200).json({
				message: "Recipe updated successfully",
				recipe: formattedRecipe,
			});
		} catch (error) {
			if (
				error instanceof Error &&
				error.message === "Unauthorized to update this recipe"
			) {
				return res.status(403).json({ message: error.message });
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

		const recipeId = id as string;

		// Get recipe to delete image from cloudinary
		const recipe = await Recipe.findById(recipeId);
		if (!recipe) {
			return res.status(404).json({ message: "Recipe not found" });
		}

		if (recipe.authorId !== userId) {
			return res
				.status(403)
				.json({ message: "Unauthorized to delete this recipe" });
		}

		if (recipe.image?.publicId) {
			try {
				await cloudinary.uploader.destroy(recipe.image.publicId);
			} catch (deleteError) {
				console.error("Error deleting image from Cloudinary:", deleteError);
			}
		}

		try {
			const deleted = await Recipe.delete(recipeId, userId);

			if (!deleted) {
				return res.status(404).json({ message: "Recipe not found" });
			}

			res.status(200).json({
				message: "Recipe deleted successfully",
			});
		} catch (error) {
			if (
				error instanceof Error &&
				error.message === "Unauthorized to delete this recipe"
			) {
				return res.status(403).json({ message: error.message });
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

		const recipeId = id as string;

		if (!value || value < 1 || value > 5) {
			return res
				.status(400)
				.json({ message: "Rating value must be between 1 and 5" });
		}

		const recipe = await Recipe.findById(recipeId);
		if (!recipe) {
			return res.status(404).json({ message: "Recipe not found" });
		}

		try {
			const rating = await Rating.create({
				value,
				authorId: userId,
				recipeId,
			});

			// Format the rating to convert id to _id
			const formattedRating = formatId({
				id: rating.id,
				value: rating.value,
				authorId: rating.authorId,
				recipeId: rating.recipeId,
				createdAt: rating.createdAt,
			});

			res.status(201).json({
				message: "Recipe rated successfully",
				rating: formattedRating,
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
		const {
			page = "1",
			limit = "10",
			sortBy = "created_at",
			sortOrder = "desc",
		} = req.query;

		const recipeId = id as string;
		const pageNum = Math.max(1, parseInt(page as string));
		const limitNum = Math.max(1, parseInt(limit as string));

		const { comments, total } = await Comment.findByRecipe(recipeId, {
			page: pageNum,
			limit: limitNum,
			sortBy: sortBy as string,
			sortOrder: sortOrder as "asc" | "desc",
		});

		// Format comments to convert id to _id
		const formattedComments = formatId(comments);

		const totalPages = Math.ceil(total / limitNum);

		res.status(200).json({
			comments: formattedComments,
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

		const recipeId = id as string;

		if (!content || content.trim().length === 0) {
			return res.status(400).json({ message: "Content is required" });
		}

		const recipe = await Recipe.findById(recipeId);
		if (!recipe) {
			return res.status(404).json({ message: "Recipe not found" });
		}

		// Check if user already commented (optional - you can remove this if you want multiple comments)
		const existingComments = await Comment.findByRecipe(recipeId, {
			limit: 100,
		});
		const hasCommented = existingComments.comments.some(
			(c) => c.author_id === userId,
		);

		if (hasCommented) {
			return res
				.status(400)
				.json({ message: "You have already commented on this recipe" });
		}

		const comment = await Comment.create({
			content,
			authorId: userId,
			recipeId,
		});

		// Format the comment to convert id to _id
		const formattedComment = formatId(comment);

		res.status(201).json({
			message: "Comment added successfully",
			comment: formattedComment,
		});
	} catch (error) {
		next(error);
	}
};
