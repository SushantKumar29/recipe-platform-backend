import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getRecipes(options?: {
	page?: number;
	limit?: number;
	authorId?: string;
	search?: string;
	isPublished?: boolean;
}) {
	const page = options?.page || 1;
	const limit = options?.limit || 10;
	const skip = (page - 1) * limit;

	const where: any = { isPublished: options?.isPublished ?? true };

	if (options?.authorId) {
		where.authorId = options.authorId;
	}

	if (options?.search) {
		where.OR = [
			{ title: { contains: options.search, mode: "insensitive" } },
			{ ingredients: { has: options.search } },
		];
	}

	const [recipes, total] = await Promise.all([
		prisma.recipe.findMany({
			where,
			include: {
				author: { select: { name: true, email: true } },
				ratings: { select: { value: true } },
			},
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.recipe.count({ where }),
	]);

	const recipesWithRating = recipes.map((recipe: any) => {
		const ratings = recipe.ratings as any[];
		const ratingCount = ratings.length;
		const averageRating = ratingCount
			? Number(
					(ratings.reduce((sum, r) => sum + r.value, 0) / ratingCount).toFixed(
						1,
					),
				)
			: 0;

		return {
			...recipe,
			image: {
				url: recipe.imageUrl,
				publicId: recipe.imagePublicId,
			},
			averageRating,
			ratingCount,
		};
	});

	return {
		recipes: recipesWithRating,
		total,
		page,
		totalPages: Math.ceil(total / limit),
	};
}

export async function createRecipe(data: {
	title: string;
	ingredients: string[];
	steps: string[];
	preparationTime: number;
	image?: { url: string; publicId: string };
	authorId: string;
	isPublished?: boolean;
}) {
	if (data.title.length < 3 || data.title.length > 100) {
		throw new Error("Title must be between 3 and 100 characters");
	}
	if (data.preparationTime < 1 || data.preparationTime > 1440) {
		throw new Error("Preparation time must be between 1 and 1440 minutes");
	}

	const recipe = await prisma.recipe.create({
		data: {
			title: data.title,
			ingredients: data.ingredients,
			steps: data.steps,
			preparationTime: data.preparationTime,
			imageUrl: data.image?.url ?? null,
			imagePublicId: data.image?.publicId ?? null,
			authorId: data.authorId,
			isPublished: data.isPublished ?? true,
		},
		include: {
			author: {
				select: { id: true, name: true, email: true },
			},
		},
	});

	return {
		...recipe,
		image: {
			url: data.image?.url ?? null,
			publicId: data.image?.publicId ?? null,
		},
	};
}

export async function getRecipeById(id: string) {
	const recipe = await prisma.recipe.findUnique({
		where: { id },
		include: {
			author: {
				select: { id: true, name: true, email: true },
			},
			ratings: true,
		},
	});

	if (!recipe) return null;

	const ratings = recipe.ratings as any[];
	const ratingCount = ratings.length;
	const averageRating = ratingCount
		? Number(
				(ratings.reduce((sum, r) => sum + r.value, 0) / ratingCount).toFixed(1),
			)
		: 0;

	return {
		...recipe,
		image: {
			url: recipe.imageUrl,
			publicId: recipe.imagePublicId,
		},
		averageRating,
		ratingCount,
	};
}

export async function updateRecipe(
	id: string,
	userId: string,
	data: Partial<{
		title: string;
		ingredients: string[];
		steps: string[];
		preparationTime: number;
		image: { url: string; publicId: string };
		isPublished: boolean;
	}>,
) {
	const recipe = await prisma.recipe.findUnique({ where: { id } });
	if (!recipe) throw new Error("Recipe not found");
	if (recipe.authorId !== userId) throw new Error("Unauthorized");

	const updateData: any = {};
	if (data.title) updateData.title = data.title;
	if (data.ingredients) updateData.ingredients = data.ingredients;
	if (data.steps) updateData.steps = data.steps;
	if (data.preparationTime) updateData.preparationTime = data.preparationTime;
	if (data.image) {
		updateData.imageUrl = data.image.url;
		updateData.imagePublicId = data.image.publicId;
	}
	if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;

	return await prisma.recipe.update({
		where: { id },
		data: updateData,
		include: {
			author: { select: { name: true, email: true } },
		},
	});
}

export async function deleteRecipe(id: string, userId: string) {
	const recipe = await prisma.recipe.findUnique({ where: { id } });
	if (!recipe) throw new Error("Recipe not found");
	if (recipe.authorId !== userId) throw new Error("Unauthorized");

	await prisma.recipe.delete({ where: { id } });
	return { success: true };
}

export async function getUserRecipes(userId: string) {
	return await prisma.recipe.findMany({
		where: { authorId: userId },
		include: {
			ratings: { select: { value: true } },
		},
		orderBy: { createdAt: "desc" },
	});
}

export async function getRecipeRating(recipeId: string) {
	const ratings = await prisma.rating.aggregate({
		where: { recipeId },
		_avg: { value: true },
		_count: { value: true },
	});

	return {
		average: ratings._avg.value || 0,
		count: ratings._count.value || 0,
	};
}
