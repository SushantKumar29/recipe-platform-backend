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
			minlength: 8,
		},
		image: {
			type: String,
		},
	},
	{ timestamps: true },
);

userSchema.pre("save", async function () {
	if (this.isModified("password")) {
		this.password = await bcrypt.hash(this.password, 12);
	}
});

const User = mongoose.model("User", userSchema);

export default User;
