import type { Request, Response, NextFunction } from "express";
import Recipe from "../models/Recipe.js";

export const fetchRecipes = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const recipes = await Recipe.find({ isPublished: true }).sort({
			createdAt: -1,
		});

		res.status(200).json(recipes);
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

		const recipe = await Recipe.findById(id).populate({
			path: "comments",
			options: { sort: { createdAt: -1 } },
			populate: { path: "author", select: "name email" },
		});

		if (!recipe) {
			return res.status(404).json({ message: "Recipe not found" });
		}

		res.status(200).json(recipe);
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
		const { title, ingredients, steps, image, isPublished } = req.body;

		const updatedRecipe = await Recipe.findByIdAndUpdate(
			id,
			{
				title,
				ingredients,
				steps,
				image,
				isPublished,
			},
			{ new: true, runValidators: true },
		);

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

		res.status(200).json({
			message: "Recipe deleted successfully",
		});
	} catch (error) {
		next(error);
	}
};
