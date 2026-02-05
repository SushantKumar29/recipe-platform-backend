import mongoose from "mongoose";

const recipeSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
			minlength: 3,
			maxlength: 100,
		},
		ingredients: {
			type: String,
			required: true,
			trim: true,
		},
		steps: {
			type: String,
			required: true,
			trim: true,
		},
		image: {
			type: String,
			required: false,
		},
		author: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		isPublished: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	},
);

recipeSchema.virtual("comments", {
	ref: "Comment",
	localField: "_id",
	foreignField: "recipe",
	justOne: false,
});

recipeSchema.virtual("ratings", {
	ref: "Rating",
	localField: "_id",
	foreignField: "recipe",
	justOne: false,
});

recipeSchema.index({ title: "text" });
recipeSchema.index({ createdAt: -1 });

export default mongoose.model("Recipe", recipeSchema);
