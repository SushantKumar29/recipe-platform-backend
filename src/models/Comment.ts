import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createComment(data: {
	content: string;
	authorId: string;
	recipeId: string;
}) {
	const { content, authorId, recipeId } = data;

	if (!content || content.trim().length === 0) {
		throw new Error("Comment content cannot be empty");
	}

	const recipe = await prisma.recipe.findUnique({
		where: { id: recipeId },
	});
	if (!recipe) {
		throw new Error("Recipe not found");
	}

	const comment = await prisma.comment.create({
		data: {
			content: content.trim(),
			authorId,
			recipeId,
		},
		include: {
			author: {
				select: { name: true, email: true },
			},
		},
	});

	return comment;
}

export async function getRecipeComments(
	recipeId: string,
	options?: {
		page?: number;
		limit?: number;
	},
) {
	const page = options?.page || 1;
	const limit = options?.limit || 10;
	const skip = (page - 1) * limit;

	const [comments, total] = await Promise.all([
		prisma.comment.findMany({
			where: { recipeId },
			include: {
				author: {
					select: { name: true, email: true },
				},
			},
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.comment.count({
			where: { recipeId },
		}),
	]);

	return { comments, total };
}

export async function updateComment(
	id: string,
	userId: string,
	content: string,
) {
	if (!content || content.trim().length === 0) {
		throw new Error("Comment content cannot be empty");
	}

	const comment = await prisma.comment.findUnique({
		where: { id },
	});

	if (!comment) {
		throw new Error("Comment not found");
	}

	if (comment.authorId !== userId) {
		throw new Error("Unauthorized to update this comment");
	}

	return await prisma.comment.update({
		where: { id },
		data: { content: content.trim() },
		include: {
			author: {
				select: { name: true, email: true },
			},
		},
	});
}

export async function deleteComment(id: string, userId: string) {
	const comment = await prisma.comment.findUnique({
		where: { id },
	});

	if (!comment) {
		throw new Error("Comment not found");
	}

	if (comment.authorId !== userId) {
		throw new Error("Unauthorized to delete this comment");
	}

	await prisma.comment.delete({
		where: { id },
	});

	return { success: true };
}

export async function getCommentById(id: string) {
	try {
		// Check if it's a valid UUID format
		const uuidRegex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(id)) {
			throw new Error("Invalid comment ID format");
		}

		return await prisma.comment.findUnique({
			where: { id },
			include: {
				author: {
					select: { name: true, email: true },
				},
				recipe: {
					select: { title: true },
				},
			},
		});
	} catch (error) {
		return null;
	}
}
