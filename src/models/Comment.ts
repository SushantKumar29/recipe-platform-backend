import mongoose from "mongoose";
import { Types } from "mongoose";

const commentSchema = new mongoose.Schema(
	{
		content: {
			type: String,
			required: true,
			trim: true,
			minlength: 1,
			maxlength: 500,
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

commentSchema.index({ recipe: 1, createdAt: -1 });
commentSchema.index({ author: 1 });

export default mongoose.model("Comment", commentSchema);
