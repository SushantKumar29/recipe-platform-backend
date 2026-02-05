import type { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import Recipe from "../models/Recipe.js";
import Rating from "../models/Rating.js";
import Comment from "../models/Comment.js";

import {
	getFilteredQuery,
	getPaginatedRecipes,
	addRatingsToRecipes,
} from "../utils/recipes/recipeUtils.ts";

export const fetchRecipes = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const {
			search,
			authorId,
			page = "1",
			limit = "10",
			sortBy = "createdAt",
			sortOrder = "desc",
		} = req.query;

		const pageNum = parseInt(page as string) || 1;
		const limitNum = parseInt(limit as string) || 10;

		const query = await getFilteredQuery({
			search: search as string,
			authorId: authorId as string,
		});

		const { recipes, total } = await getPaginatedRecipes(
			query,
			pageNum,
			limitNum,
			sortBy as string,
			sortOrder as string,
		);

		const recipesWithRatings = await addRatingsToRecipes(recipes);

		res.status(200).json({
			data: recipesWithRatings,
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
			.populate({
				path: "author",
				select: "name email",
			})
			.populate({
				path: "comments",
				options: { sort: { createdAt: -1 } },
				populate: {
					path: "author",
					select: "name email",
				},
			})
			.populate({
				path: "ratings",
				options: { sort: { createdAt: -1 } },
				populate: {
					path: "author",
					select: "name email",
				},
			});

		if (!recipe) {
			return res.status(404).json({ message: "Recipe not found" });
		}

		const recipeObj = recipe.toObject() as any;

		const ratings = (recipeObj.ratings as any[]) || [];
		const ratingCount = ratings.length;

		let averageRating = 0;
		if (ratingCount > 0) {
			const sum = ratings.reduce(
				(total: number, rating: any) => total + rating.value,
				0,
			);
			averageRating = parseFloat((sum / ratingCount).toFixed(1));
		}

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
		const { title, ingredients, steps, image, author } = req.body;

		if (!title || !ingredients || !steps || !author) {
			return res.status(400).json({
				message: "All fields are required",
			});
		}

		const newRecipe = new Recipe({
			title,
			ingredients,
			steps,
			image,
			author,
		});

		const savedRecipe = await newRecipe.save();

		res
			.status(201)
			.json({ message: "Recipe created successfully", recipe: savedRecipe });
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

		const updatedRecipe = await Recipe.findByIdAndUpdate(id, req.body, {
			new: true,
			runValidators: true,
		});

		if (!updatedRecipe) {
			return res.status(404).json({ message: "Recipe not found" });
		}

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

		const deletedRecipe = await Recipe.findByIdAndDelete(id);

		if (!deletedRecipe) {
			return res.status(404).json({ message: "Recipe not found" });
		}

		const recipeId = new Types.ObjectId(id as string);
		await Promise.all([
			Comment.deleteMany({ recipe: recipeId }),
			Rating.deleteMany({ recipe: recipeId }),
		]);

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
		const { value, authorId } = req.body;
		const recipeId = new Types.ObjectId(id as string);

		if (!value || !authorId) {
			return res.status(400).json({ message: "Value and author required" });
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

		res.status(200).json({
			message: "Recipe rated successfully",
			rating,
		});
	} catch (error) {
		next(error);
	}
};
