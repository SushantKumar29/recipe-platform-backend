import type { Types } from "mongoose";

export interface IUser {
	_id: string;
	name: string;
	email: string;
}

export interface IRating {
	_id: string;
	value: number;
	author: IUser;
	recipe: string;
	createdAt: string;
	updatedAt: string;
}

export interface IRecipe {
	_id: string;
	title: string;
	ingredients: string[];
	steps: string[];
	preparationTime: number;
	author: string | IUser;
	isPublished: boolean;
	createdAt: string;
	updatedAt: string;
	ratingCount?: number;
	averageRating?: number;
	image?: string | { url: string; publicId: string } | null;
	__v?: number;
	ratings?: IRating[];
}

export interface IFilteredQueryParams {
	search?: string;
	authorId?: string;
	preparationTime?: string;
	minRating?: string;
}

export interface IRecipeQuery {
	isPublished: boolean;
	author?: Types.ObjectId;
	$or?: Array<Record<string, unknown>>;
	preparationTime?: { $gte?: number; $lte?: number };
	minRating?: number;
	[key: string]: unknown;
}
