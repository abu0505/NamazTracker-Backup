import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import { registerUserSchema, loginUserSchema, safeUserSchema } from "@shared/schema";
import type { RequestHandler, Request, Response } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-here";

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12);
};

// Verify password
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
export const generateToken = (user: User): string => {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Middleware for authentication
export const authenticate: RequestHandler = (req: Request & { user?: any }, res: Response, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed" });
  }
};

// Register user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = registerUserSchema.parse(req.body);

    // Check if user already exists
    const existingUsers = await Promise.all([
      validatedData.username ? storage.getUserByUsername(validatedData.username) : Promise.resolve(null),
      validatedData.email ? storage.getUserByEmail(validatedData.email) : Promise.resolve(null)
    ]);

    if (existingUsers[0]) {
      res.status(400).json({ message: "Username already exists" });
      return;
    }

    if (existingUsers[1]) {
      res.status(400).json({ message: "Email already exists" });
      return;
    }

    // Hash password (validatedData.passwordHash should be present for JWT auth)
    const passwordHash = await hashPassword(validatedData.passwordHash!);

    // Create user
    const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
      username: validatedData.username as string,
      email: validatedData.email as string,
      passwordHash,
      firstName: validatedData.firstName || null,
      lastName: validatedData.lastName || null,
      profileImageUrl: validatedData.profileImageUrl || null,
      isActive: true,
    };

    const newUser = await storage.createUser(userData);

    // Generate token
    const token = generateToken(newUser as User);

    // Return safe user data (without password)
    const safeUser = safeUserSchema.parse(newUser);

    res.status(201).json({
      user: safeUser,
      token,
      message: "Registration successful"
    });

  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof Error && error.name === "ZodError") {
      res.status(400).json({ message: "Validation error", errors: (error as any).errors });
    } else {
      res.status(500).json({ message: "Registration failed" });
    }
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = loginUserSchema.parse(req.body);

    // Find user by username
    const user = await storage.getUserByUsername(username);
    if (!user || !user.isActive) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Check if user has password hash (JWT auth)
    if (!user.passwordHash) {
      res.status(401).json({ message: "Invalid authentication method" });
      return;
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Generate token
    const token = generateToken(user);

    // Return safe user data (without password)
    const safeUser = safeUserSchema.parse(user);

    res.json({
      user: safeUser,
      token,
      message: "Login successful"
    });

  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof Error && error.name === "ZodError") {
      res.status(400).json({ message: "Validation error", errors: (error as any).errors });
    } else {
      res.status(500).json({ message: "Login failed" });
    }
  }
};

// Get current user
export const getMe = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const user = await storage.getUser(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Return safe user data (without password)
    const safeUser = safeUserSchema.parse(user);
    res.json(safeUser);

  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Failed to get user" });
  }
};

// Logout (client-side token removal)
export const logout = (req: Request, res: Response): void => {
  res.json({ message: "Logged out successfully" });
};
