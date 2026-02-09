import { Types } from "mongoose";
import Recipe from "../../models/Recipe.ts";
import Rating from "../../models/Rating.ts";
import type { IRecipe, IRating } from "./types.ts";
import User from "../../models/User.ts";

export const buildFilteredQuery = async ({
	search,
	authorId,
	preparationTime,
	minRating,
}: {
	search?: string;
	authorId?: string;
	preparationTime?: string;
	minRating?: string;
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

	if (preparationTime) {
		switch (preparationTime) {
			case "0-30":
				query.preparationTime = { $gte: 0, $lte: 30 };
				break;
			case "30-60":
				query.preparationTime = { $gte: 30, $lte: 60 };
				break;
			case "60-120":
				query.preparationTime = { $gte: 60, $lte: 120 };
				break;
			case "120+":
				query.preparationTime = { $gte: 120 };
				break;
		}
	}

	if (minRating) {
		query.minRating = parseFloat(minRating);
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
	const minRating = query.minRating;

	const recipeQuery = { ...query };
	delete recipeQuery.minRating;

	if (sortBy === "rating") {
		const allRecipes = await Recipe.find(recipeQuery)
			.populate("author", "name email")
			.lean();

		const recipesWithRatings = await addRatingsToRecipes(
			allRecipes as unknown as IRecipe[],
			minRating,
		);

		recipesWithRatings.sort((a, b) => {
			const ratingA = a.averageRating || 0;
			const ratingB = b.averageRating || 0;
			return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
		});

		const paginatedRecipes = recipesWithRatings.slice(offset, offset + limit);
		const total = recipesWithRatings.length;

		return { recipes: paginatedRecipes, total };
	}

	const sort: any = {};
	sort[sortBy] = sortOrder === "asc" ? 1 : -1;

	const recipes = await Recipe.find(recipeQuery)
		.populate("author", "name email")
		.sort(sort)
		.skip(offset)
		.limit(limit)
		.lean();

	const total = minRating
		? (
				await addRatingsToRecipes(
					(await Recipe.find(recipeQuery).lean()) as unknown as IRecipe[],
					minRating,
				)
			).length
		: await Recipe.countDocuments(recipeQuery);

	const recipesWithRatings = await addRatingsToRecipes(
		recipes as unknown as IRecipe[],
		minRating,
	);

	return { recipes: recipesWithRatings, total };
};

export const addRatingsToRecipes = async (
	recipes: IRecipe[],
	minRating?: number,
) => {
	if (recipes.length === 0) return [];

	const recipeIds = recipes.map((recipe) => recipe._id);
	const ratings = await Rating.find({ recipe: { $in: recipeIds } }).lean();

	const ratingsMap: Record<string, IRating[]> = {};
	const recipeRatingStats: Record<string, { average: number; count: number }> =
		{};

	ratings.forEach((rating) => {
		const recipeId = rating.recipe.toString();
		if (!ratingsMap[recipeId]) ratingsMap[recipeId] = [];
		ratingsMap[recipeId].push(rating as unknown as IRating);
	});

	Object.keys(ratingsMap).forEach((recipeId) => {
		const recipeRatings = ratingsMap[recipeId];

		if (!recipeRatings || recipeRatings.length === 0) {
			recipeRatingStats[recipeId] = { average: 0, count: 0 };
			return;
		}

		const ratingCount = recipeRatings.length;
		const sum = recipeRatings.reduce(
			(total, rating) => total + rating.value,
			0,
		);
		const averageRating = parseFloat((sum / ratingCount).toFixed(1));

		recipeRatingStats[recipeId] = {
			average: averageRating,
			count: ratingCount,
		};
	});

	const filteredRecipes = minRating
		? recipes.filter((recipe) => {
				const recipeId = recipe._id.toString();
				const stats = recipeRatingStats[recipeId];
				return stats && stats.average >= minRating;
			})
		: recipes;

	return filteredRecipes.map((recipe) => {
		const recipeId = recipe._id.toString();
		const stats = recipeRatingStats[recipeId] || { average: 0, count: 0 };

		return {
			...recipe,
			ratingCount: stats.count,
			averageRating: stats.average,
		};
	});
};
