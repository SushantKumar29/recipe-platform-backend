import type { Request, Response, NextFunction } from "express";
import Recipe from "../models/Recipe.js";
import Rating from "../models/Rating.js";
import Comment from "../models/Comment.js";
import {
	buildFilteredQuery,
	getPaginatedRecipes,
} from "../utils/recipes/recipeUtils.ts";
import cloudinary from "../config/cloudinary.ts";
import { normalizeTextList } from "../lib/formatter.ts";
import type { IRating, IRecipe } from "../utils/recipes/types.ts";
import type { UploadApiResponse } from "cloudinary";

export const fetchRecipes = async (
	req: Request,
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

		const query = await buildFilteredQuery({
			search: search as string,
			authorId: authorId as string,
			preparationTime: preparationTime as string,
			minRating: minRating as string,
		});

		const { recipes, total } = await getPaginatedRecipes(
			query,
			pageNum,
			limitNum,
			sortBy as string,
			sortOrder as string,
		);

		res.status(200).json({
			data: recipes,
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
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id } = req.params;

		const recipe = await Recipe.findById(id)
			.populate("author", "name email")
			.populate({
				path: "ratings",
				options: { sort: { createdAt: -1 } },
				populate: { path: "author", select: "name email" },
			});

		if (!recipe) {
			return res.status(404).json({ message: "Recipe not found" });
		}

		const recipeObj = recipe.toObject() as IRecipe;
		const ratings = (recipeObj.ratings || []) as IRating[];
		const ratingCount = ratings.length;

		const averageRating =
			ratingCount > 0
				? parseFloat(
						(
							ratings.reduce((sum, r) => sum + r.value, 0) / ratingCount
						).toFixed(1),
					)
				: 0;

		res.status(200).json({
			...recipeObj,
			ratingCount,
			averageRating,
		});
	} catch (error) {
		next(error);
	}
};

export const createRecipe = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { title, ingredients, steps, preparationTime } = req.body;
		const userId = res.locals.user.id;

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

						uploadStream.end(req?.file?.buffer);
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

		const newRecipe = new Recipe({
			title,
			ingredients: normalizedIngredients,
			steps: normalizedSteps,
			preparationTime: Number(preparationTime),
			image: imageData,
			author: userId,
		});

		const savedRecipe = await newRecipe.save();

		res.status(201).json({
			message: "Recipe created successfully",
			recipe: savedRecipe,
		});
	} catch (error) {
		next(error);
	}
};

export const updateRecipe = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id } = req.params;
		const { title, ingredients, steps, preparationTime } = req.body;
		const userId = res.locals.user.id;

		const existingRecipe = res.locals.recipe || (await Recipe.findById(id));
		if (!existingRecipe) {
			return res.status(404).json({ message: "Recipe not found" });
		}

		if (existingRecipe.author.toString() !== userId) {
			return res.status(403).json({
				message: "You are not authorized to update this recipe",
			});
		}

		let imageData: { url: string; publicId: string } | null =
			existingRecipe.image ?? null;

		if (req.file) {
			if (imageData?.publicId) {
				try {
					await cloudinary.uploader.destroy(imageData.publicId);
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

						uploadStream.end(req?.file?.buffer);
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

		const updateData = {
			title: title || existingRecipe.title,
			ingredients: normalizeTextList(ingredients ?? existingRecipe.ingredients),
			steps: normalizeTextList(steps ?? existingRecipe.steps),
			preparationTime: preparationTime
				? parseInt(preparationTime)
				: existingRecipe.preparationTime,
			image: imageData,
		};

		const updatedRecipe = await Recipe.findByIdAndUpdate(id, updateData, {
			new: true,
			runValidators: true,
		}).populate("author", "name email");

		res.status(200).json({
			message: "Recipe updated successfully",
			recipe: updatedRecipe,
		});
	} catch (error) {
		next(error);
	}
};

export const deleteRecipe = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id } = req.params;
		const userId = res.locals.user.id;
		const recipeId = id as string;

		const recipe = res.locals.recipe || (await Recipe.findById(id));
		if (!recipe) {
			return res.status(404).json({ message: "Recipe not found" });
		}

		if (recipe.author.toString() !== userId) {
			return res.status(403).json({
				message: "You are not authorized to delete this recipe",
			});
		}

		if (recipe?.image?.publicId) {
			try {
				await cloudinary.uploader.destroy(recipe.image.publicId);
			} catch (deleteError) {
				console.error("Error deleting image from Cloudinary:", deleteError);
			}
		}

		const [deletedRecipe] = await Promise.all([
			Recipe.findByIdAndDelete(id),
			Comment.deleteMany({ recipe: recipeId }),
			Rating.deleteMany({ recipe: recipeId }),
		]);

		if (!deletedRecipe) {
			return res.status(404).json({ message: "Recipe not found" });
		}

		res.status(200).json({
			message: "Recipe deleted successfully",
		});
	} catch (error) {
		next(error);
	}
};

export const rateRecipe = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id } = req.params;
		const { value } = req.body;

		const authorId = res.locals.user.id;
		const recipeId = id as string;

		if (!value) {
			return res.status(400).json({ message: "Value is required" });
		}

		const recipe = await Recipe.findById(recipeId);
		if (!recipe) {
			return res.status(404).json({ message: "Recipe not found" });
		}

		const existingRating = await Rating.findOne({
			recipe: recipeId,
			author: authorId,
		});

		if (existingRating) {
			return res
				.status(400)
				.json({ message: "You have already rated this recipe" });
		}

		const rating = new Rating({
			value,
			author: authorId,
			recipe: recipeId,
		});

		await rating.save();

		res.status(201).json({
			message: "Recipe rated successfully",
			rating,
		});
	} catch (error) {
		next(error);
	}
};

export const fetchRecipeComments = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id } = req.params;
		const recipeId = id as string;
		const {
			page = "1",
			limit = "10",
			sortBy = "createdAt",
			sortOrder = "desc",
		} = req.query;

		const pageNum = Math.max(1, parseInt(page as string));
		const limitNum = Math.max(1, parseInt(limit as string));
		const offset = (pageNum - 1) * limitNum;

		const sortField = ["createdAt", "updatedAt", "rating"].includes(
			sortBy as string,
		)
			? (sortBy as string)
			: "createdAt";
		const sortDir = sortOrder === "asc" ? 1 : -1;

		const [comments, totalComments] = await Promise.all([
			Comment.find({ recipe: recipeId })
				.sort({ [sortField]: sortDir })
				.skip(offset)
				.limit(limitNum)
				.populate("author", "name email"),
			Comment.countDocuments({ recipe: recipeId }),
		]);

		const totalPages = Math.ceil(totalComments / limitNum);

		res.status(200).json({
			comments,
			pagination: {
				page: pageNum,
				totalPages,
				totalComments,
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
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id } = req.params;
		const { content } = req.body;
		const userId = res.locals.user.id;
		const recipeId = id as string;

		if (!content) {
			return res.status(400).json({ message: "Content is required" });
		}

		const recipe = await Recipe.findById(id);
		if (!recipe) {
			return res.status(404).json({ message: "Recipe not found" });
		}

		const existingComment = await Comment.findOne({
			recipe: recipeId,
			author: userId,
		});

		if (existingComment) {
			return res
				.status(400)
				.json({ message: "You have already commented on this recipe" });
		}

		const comment = await Comment.create({
			recipe: id as string,
			content,
			author: userId,
		});

		const populatedComment = await Comment.findById(comment._id).populate(
			"author",
			"name email",
		);

		res.status(201).json({
			message: "Comment added successfully",
			comment: populatedComment,
		});
	} catch (error) {
		next(error);
	}
};
