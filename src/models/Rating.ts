import mongoose from "mongoose";
import { Types } from "mongoose";

const ratingSchema = new mongoose.Schema(
	{
		value: {
			type: Number,
			min: 0.5,
			max: 5,
			required: true,
			set: (v: number) => {
				const rounded = Math.round(v * 2) / 2;
				return Math.min(Math.max(rounded, 0.5), 5);
			},
		},
		author: {
			type: Types.ObjectId,
			ref: "User",
			required: true,
		},
		recipe: {
			type: Types.ObjectId,
			ref: "Recipe",
			required: true,
		},
	},
	{ timestamps: true },
);

ratingSchema.index({ author: 1, recipe: 1 }, { unique: true });
ratingSchema.index({ recipe: 1, createdAt: -1 });
ratingSchema.index({ author: 1 });

export default mongoose.model("Rating", ratingSchema);
