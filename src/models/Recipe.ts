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
			default: false,
		},

		ratings: {
			type: Number,
			min: 0,
			max: 5,
			default: 0,
			set: (v: number) => Math.round(v * 10) / 10,
		},
	},
	{ timestamps: true },
);

recipeSchema.virtual("comments", {
	ref: "Comment",
	localField: "_id",
	foreignField: "recipe",
});

recipeSchema.set("toJSON", { virtuals: true });
recipeSchema.set("toObject", { virtuals: true });

recipeSchema.index({ title: "text" });
recipeSchema.index({ createdAt: -1 });

export default mongoose.model("Recipe", recipeSchema);
