import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export interface UserData {
	name: string;
	email: string;
	password: string;
	image?: string;
}

// Get all users
export async function getAllUsers() {
	const users = await prisma.user.findMany({
		orderBy: { createdAt: "desc" },
	});
	return users;
}

// Get user by ID
export async function getUserById(id: string) {
	return await prisma.user.findUnique({
		where: { id },
	});
}

// Get user by email
export async function getUserByEmail(email: string) {
	return await prisma.user.findUnique({
		where: { email },
	});
}

// Create new user
export async function createUser(data: UserData) {
	const { name, email, password, image } = data;

	// Validate password length
	if (!password || password.length < 8) {
		throw new Error("Password must be at least 8 characters long");
	}

	// Check if user already exists
	const existingUser = await getUserByEmail(email);
	if (existingUser) {
		throw new Error("User with this email already exists");
	}

	// Hash password
	const hashedPassword = await bcrypt.hash(password, 12);

	const user = await prisma.user.create({
		data: {
			name,
			email,
			password: hashedPassword,
			image: image || null,
		},
	});

	return user;
}

// Update user
export async function updateUser(
	id: string,
	updates: Partial<Omit<UserData, "password">>,
) {
	// Check if user exists
	const existingUser = await getUserById(id);
	if (!existingUser) {
		throw new Error("User not found");
	}

	// If email is being updated, check if it's already taken
	if (updates.email && updates.email !== existingUser.email) {
		const userWithEmail = await getUserByEmail(updates.email);
		if (userWithEmail) {
			throw new Error("Email is already in use");
		}
	}

	const user = await prisma.user.update({
		where: { id },
		data: updates,
	});

	return user;
}

// Delete user
export async function deleteUser(id: string) {
	try {
		await prisma.user.delete({
			where: { id },
		});
		return true;
	} catch {
		return false;
	}
}

// Compare password
export async function comparePassword(user: any, candidatePassword: string) {
	return bcrypt.compare(candidatePassword, user.password);
}
