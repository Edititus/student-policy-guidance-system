import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

export const registerUser = async ({ email, password, name, role, schoolId, schoolName, schoolDomain, department, studentId, year }: any) => {
  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw { status: 409, message: 'User with this email already exists' };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const newUser = await User.create({
    email,
    password: hashedPassword,
    name,
    role,
    schoolId,
    schoolName,
    schoolDomain,
    department,
    studentId,
    year,
    active: true,
  });

  // Generate JWT token
  const token = jwt.sign(
    {
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // Return user data (exclude password)
  const { password: _, ...userWithoutPassword } = newUser.toJSON();

  return {
    success: true,
    message: 'Registration successful',
    data: {
      user: userWithoutPassword,
      token,
    },
  };
};
