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
	image?: string;
	author: string | IUser;
	isPublished: boolean;
	createdAt: string;
	updatedAt: string;
	__v?: number;
	ratingCount: number;
	averageRating: number;
}
