export interface IUser {
  id?: string;
  name: string;
  email: string;
}

export interface IRating {
  id: string;
  value: number;
  author: IUser;
  recipe: string;
  createdAt: string;
  updatedAt: string;
}

export interface IRecipe {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  preparationTime: number;
  author: string | IUser;
  isPublished: boolean;
  createdAt: NativeDate | string;
  updatedAt: NativeDate | string;
  authorId?: string;
  ratingCount?: number;
  averageRating?: number;
  image?: string | { url: string; publicId: string } | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
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
  author?: string | IUser;
  $or?: Array<Record<string, unknown>>;
  preparationTime?: { $gte?: number; $lte?: number };
  minRating?: number;
  [key: string]: unknown;
}

export interface IUpdateRecipeData {
  title?: string;
  ingredients?: string[];
  steps?: string[];
  preparationTime?: number;
  image?: { url: string; publicId: string };
  isPublished?: boolean;
  imageUrl?: string;
  imagePublicId?: string;
}
