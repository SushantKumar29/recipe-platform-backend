import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import * as User from '../models/User.js';

interface AuthRequest extends Request {
  body: {
    name?: string;
    email: string;
    password: string;
    image?: string;
  };
}

const handleResponse = (
  res: Response,
  status: number,
  message: string,
  data: { [key: string]: unknown } = {},
) => {
  res.status(status).json({
    message,
    ...data,
  });
};

const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '7d',
  });
};

export const signup = async (req: AuthRequest, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return handleResponse(res, 400, 'Name, email and password are required');
  }

  try {
    const existingUser = await User.getUserByEmail(email);
    if (existingUser) {
      return handleResponse(res, 400, 'User with this email already exists');
    }

    const user = await User.createUser({ name, email, password });

    const token = generateToken(user.id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    handleResponse(res, 201, 'User created successfully', {
      user,
      token,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Password must be at least 8 characters')
    ) {
      return handleResponse(res, 400, error.message);
    }
    console.error('Signup error:', error);
    handleResponse(res, 500, 'Error creating user');
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return handleResponse(res, 400, 'Email and password are required');
  }

  try {
    const user = await User.getUserByEmail(email);
    if (!user) {
      return handleResponse(res, 401, 'Invalid credentials');
    }

    const isPasswordValid = await User.comparePassword(user as User.UserData, password);
    if (!isPasswordValid) {
      return handleResponse(res, 401, 'Invalid credentials');
    }

    const token = generateToken(user.id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    handleResponse(res, 200, 'Login successful', {
      user,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    handleResponse(res, 500, 'Error during login');
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    handleResponse(res, 200, 'Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    handleResponse(res, 500, 'Error during logout');
  }
};

export const getCurrentUser = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    if (!req.user?.id) {
      return handleResponse(res, 401, 'Not authenticated');
    }

    const user = await User.getUserById(req.user.id);
    if (!user) {
      return handleResponse(res, 404, 'User not found');
    }

    handleResponse(res, 200, 'User profile fetched successfully', {
      user,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    handleResponse(res, 500, 'Error fetching user profile');
  }
};
