import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},

		email: {
			type: String,
			required: true,
			trim: true,
			unique: true,
		},

		password: {
			type: String,
			required: true,
		},

		image: {
			type: String,
		},
	},
	{ timestamps: true },
);

userSchema.pre("save", async function () {
	this.password = await bcrypt.hash(this.password, 12);
});

export default mongoose.model("User", userSchema);
