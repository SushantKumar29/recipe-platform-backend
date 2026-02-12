import type { Types } from "mongoose";

export interface IUser {
	_id: Types.ObjectId | string;
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
	_id: Types.ObjectId | string;
	title: string;
	ingredients: string[];
	steps: string[];
	preparationTime: number;
	author: string | Types.ObjectId | IUser;
	isPublished: boolean;
	createdAt: NativeDate | string;
	updatedAt: NativeDate | string;
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
