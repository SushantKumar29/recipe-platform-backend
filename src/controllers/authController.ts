import type { Request, Response, NextFunction } from "express";
import User from "../models/User.js";
import { createSecretToken } from "../lib/secretToken.ts";
import bcrypt from "bcrypt";

export const signup = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { name, email, password } = req.body;
		if (!name || !email || !password) {
			return res.status(400).json({ message: "All fields are required" });
		}
		const ifUserExists = await User.findOne({ email });
		if (ifUserExists) {
			return res
				.status(400)
				.json({ message: "You are already signed up. Please login" });
		}
		const user = await User.create({ name, email, password });

		const token = createSecretToken(user._id);
		res.cookie("token", token, {});

		res.status(200).json({ message: "Signup successful", user, token });
	} catch (error) {
		next(error);
	}
};

export const login = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({ message: "Email and password required" });
		}
		const user = await User.findOne({ email });
		if (!user) {
			return res
				.status(404)
				.json({ message: "You are not registered. Please signup" });
		}

		const auth = await bcrypt.compare(password, user.password);
		if (!auth) {
			return res.status(401).json({ message: "Invalid credentials" });
		}
		const token = createSecretToken(user._id);
		res.cookie("token", token, {});
		res.status(201).json({ message: "Login successful", user, token });
	} catch (error) {
		next(error);
	}
};

export const logout = (req: Request, res: Response, _next: NextFunction) => {
	res.clearCookie("token", {
		httpOnly: true,
		sameSite: "strict",
		secure: process.env.NODE_ENV === "production",
	});

	return res.status(200).json({ message: "Logout successful" });
};
