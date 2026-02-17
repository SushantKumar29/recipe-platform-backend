import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createRating(data: {
	value: number;
	authorId: string;
	recipeId: string;
}) {
	const { value, authorId, recipeId } = data;

	if (value < 1 || value > 5) {
		throw new Error("Rating value must be between 1 and 5");
	}

	const recipe = await prisma.recipe.findUnique({
		where: { id: recipeId },
	});
	if (!recipe) {
		throw new Error("Recipe not found");
	}

	const existing = await prisma.rating.findUnique({
		where: {
			authorId_recipeId: {
				authorId,
				recipeId,
			},
		},
	});

	if (existing) {
		throw new Error("User has already rated this recipe");
	}

	const rating = await prisma.rating.create({
		data: {
			value,
			authorId,
			recipeId,
		},
	});

	return rating;
}

export async function getRecipeAverageRating(recipeId: string) {
	const result = await prisma.rating.aggregate({
		where: { recipeId },
		_avg: { value: true },
		_count: { value: true },
	});

	return {
		average: result._avg.value || 0,
		count: result._count.value || 0,
	};
}
