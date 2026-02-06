import { Types } from "mongoose";
import Recipe from "../../models/Recipe.ts";
import Rating from "../../models/Rating.ts";
import type { IRecipe, IRating } from "./types.ts";
import User from "../../models/User.ts";

export const getFilteredQuery = async ({
	search,
	authorId,
}: {
	search?: string;
	authorId?: string;
}) => {
	const query: any = { isPublished: true };

	if (authorId) {
		query.author = new Types.ObjectId(authorId);
	}

	if (search) {
		const searchRegex = new RegExp(search, "i");

		const matchingAuthors = await User.find({
			$or: [{ name: searchRegex }, { email: searchRegex }],
		}).select("_id");

		const authorIds = matchingAuthors.map((a) => a._id);

		query.$or = [
			{ title: searchRegex },
			{ ingredients: searchRegex },
			{ steps: searchRegex },
			{ author: { $in: authorIds } },
		];
	}

	return query;
};

export const getPaginatedRecipes = async (
	query: any,
	page: number,
	limit: number,
	sortBy: string,
	sortOrder: string,
) => {
	const offset = (page - 1) * limit;

	if (sortBy === "rating") {
		const allRecipes = await Recipe.find(query)
			.populate("author", "name email")
			.lean();

		const recipesWithRatings = await addRatingsToRecipes(
			allRecipes as unknown as IRecipe[],
		);

		recipesWithRatings.sort((a, b) => {
			const ratingA = a.averageRating || 0;
			const ratingB = b.averageRating || 0;
			return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
		});

		const paginatedRecipes = recipesWithRatings.slice(offset, offset + limit);
		const total = allRecipes.length;

		return { recipes: paginatedRecipes, total };
	}

	const sort: any = {};
	sort[sortBy] = sortOrder === "asc" ? 1 : -1;

	const recipes = await Recipe.find(query)
		.populate("author", "name email")
		.sort(sort)
		.skip(offset)
		.limit(limit)
		.lean();

	const total = await Recipe.countDocuments(query);

	const recipesWithRatings = await addRatingsToRecipes(
		recipes as unknown as IRecipe[],
	);

	return { recipes: recipesWithRatings, total };
};

export const addRatingsToRecipes = async (recipes: IRecipe[]) => {
	if (recipes.length === 0) return [];

	const recipeIds = recipes.map((recipe) => recipe._id);
	const ratings = await Rating.find({ recipe: { $in: recipeIds } }).lean();

	const ratingsMap: Record<string, IRating[]> = {};
	ratings.forEach((rating) => {
		const recipeId = rating.recipe.toString();
		if (!ratingsMap[recipeId]) ratingsMap[recipeId] = [];
		ratingsMap[recipeId].push(rating as unknown as IRating);
	});

	return recipes.map((recipe) => {
		const recipeId = recipe._id.toString();
		const recipeRatings = ratingsMap[recipeId] || [];
		const ratingCount = recipeRatings.length;

		let averageRating = 0;
		if (ratingCount > 0) {
			const sum = recipeRatings.reduce(
				(total, rating) => total + rating.value,
				0,
			);
			averageRating = parseFloat((sum / ratingCount).toFixed(1));
		}

		return {
			...recipe,
			ratingCount,
			averageRating,
		};
	});
};
