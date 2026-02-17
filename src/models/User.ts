import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export interface UserData {
	name: string;
	email: string;
	password: string;
	image?: string;
}

export async function getAllUsers() {
	const users = await prisma.user.findMany({
		orderBy: { createdAt: "desc" },
	});
	return users;
}

export async function getUserById(id: string) {
	return await prisma.user.findUnique({
		where: { id },
	});
}

export async function getUserByEmail(email: string) {
	return await prisma.user.findUnique({
		where: { email },
	});
}

export async function createUser(data: UserData) {
	const { name, email, password, image } = data;

	if (!password || password.length < 8) {
		throw new Error("Password must be at least 8 characters long");
	}

	const existingUser = await getUserByEmail(email);
	if (existingUser) {
		throw new Error("User with this email already exists");
	}

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

export async function updateUser(
	id: string,
	updates: Partial<Omit<UserData, "password">>,
) {
	const existingUser = await getUserById(id);
	if (!existingUser) {
		throw new Error("User not found");
	}

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

export async function comparePassword(user: any, candidatePassword: string) {
	return bcrypt.compare(candidatePassword, user.password);
}
