import type { Request, Response } from "express";
import * as User from "../models/User.js";

interface CustomRequest extends Request {
	params: {
		id?: string;
	};
}

const handleResponse = (
	res: Response,
	status: number,
	message: string,
	data: unknown = null,
) => {
	res.status(status).json({
		message,
		data,
	});
};

export const fetchUsers = async (req: Request, res: Response) => {
	try {
		const users = await User.getAllUsers();
		handleResponse(res, 200, "Users fetched successfully", users);
	} catch (error) {
		handleResponse(res, 500, "Error fetching users", error);
	}
};

export const fetchUser = async (req: CustomRequest, res: Response) => {
	const { id } = req.params;

	if (!id) {
		return handleResponse(res, 400, "User ID is required");
	}

	try {
		const user = await User.getUserById(id);
		if (!user) {
			return handleResponse(res, 404, "User not found");
		}
		handleResponse(res, 200, "User fetched successfully", user);
	} catch (error) {
		handleResponse(res, 500, "Error fetching user", error);
	}
};

export const createUser = async (req: Request, res: Response) => {
	const { name, email, password, image } = req.body;

	if (!name || !email || !password) {
		return handleResponse(res, 400, "Name, email and password are required");
	}

	try {
		const existingUser = await User.getUserByEmail(email);
		if (existingUser) {
			return handleResponse(res, 409, "User with this email already exists");
		}

		const user = await User.createUser({ name, email, password, image });
		handleResponse(res, 201, "User created successfully", user);
	} catch (error) {
		if (
			error instanceof Error &&
			error.message.includes("Password must be at least 8 characters")
		) {
			return handleResponse(res, 400, error.message);
		}
		handleResponse(res, 500, "Error creating user", error);
	}
};

export const updateUser = async (req: CustomRequest, res: Response) => {
	const { id } = req.params;
	const { name, email, image } = req.body;

	if (!id) {
		return handleResponse(res, 400, "User ID is required");
	}

	try {
		const user = await User.getUserById(id);
		if (!user) {
			return handleResponse(res, 404, "User not found");
		}

		if (email && email !== user.email) {
			const existingUser = await User.getUserByEmail(email);
			if (existingUser) {
				return handleResponse(res, 409, "Email is already in use");
			}
		}

		const updates: Partial<{
			name: string;
			email: string;
			image?: string;
		}> = {};
		if (name) updates.name = name;
		if (email) updates.email = email;
		if (image !== undefined) updates.image = image;

		const updatedUser = await User.updateUser(id, updates);
		handleResponse(res, 200, "User updated successfully", updatedUser);
	} catch (error) {
		if (error instanceof Error && error.message === "User not found") {
			return handleResponse(res, 404, error.message);
		}
		handleResponse(res, 500, "Error updating user", error);
	}
};

export const deleteUser = async (req: CustomRequest, res: Response) => {
	const { id } = req.params;

	if (!id) {
		return handleResponse(res, 400, "User ID is required");
	}

	try {
		const user = await User.getUserById(id);
		if (!user) {
			return handleResponse(res, 404, "User not found");
		}

		const deleted = await User.deleteUser(id);
		if (deleted) {
			handleResponse(res, 200, "User deleted successfully");
		} else {
			handleResponse(res, 500, "Error deleting user");
		}
	} catch (error) {
		handleResponse(res, 500, "Error deleting user", error);
	}
};
