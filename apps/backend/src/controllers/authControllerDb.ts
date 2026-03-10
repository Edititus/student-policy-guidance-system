import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { School } from '../models/School';

const JWT_SECRET_RAW = process.env.JWT_SECRET;
if (!JWT_SECRET_RAW) {
  throw new Error('FATAL: JWT_SECRET environment variable is required. Set it before starting the server.');
}
const JWT_SECRET: string = JWT_SECRET_RAW;
const JWT_EXPIRES_IN = '2h';

/**
 * Extended Request with user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
    schoolId?: string;
  };
}

/**
 * AuthController - Handles all authentication operations
 * Uses PostgreSQL database for user storage
 */
export class AuthController {
  /**
   * Login endpoint
   * POST /api/auth/login
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, role } = req.body;

      // Validation
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
        return;
      }

      // Find user by email
      const user = await User.findOne({
        where: { email: email.toLowerCase() },
        include: [{ model: School, as: 'school' }],
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      // Check if user is active
      if (!user.active) {
        res.status(401).json({
          success: false,
          message: 'Account is deactivated. Please contact support.',
        });
        return;
      }

      // Check user approval status
      if (user.status === 'pending_approval') {
        res.status(403).json({
          success: false,
          message: 'Your account is pending admin approval. Please check back later.',
          code: 'PENDING_APPROVAL',
        });
        return;
      }

      if (user.status === 'rejected') {
        res.status(403).json({
          success: false,
          message: 'Your registration was not approved. Please contact your school administrator.',
          code: 'REJECTED',
        });
        return;
      }

      if (user.status === 'suspended') {
        res.status(403).json({
          success: false,
          message: 'Your account has been suspended. Please contact your school administrator.',
          code: 'SUSPENDED',
        });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      // Block super_admin from the general login — they must use /platform-login
      if (user.role === 'super_admin') {
        res.status(403).json({
          success: false,
          message: 'Super Admin must log in through the platform admin portal.',
          code: 'USE_PLATFORM_LOGIN',
        });
        return;
      }

      // Update last login
      await user.update({ lastLogin: new Date() });

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          schoolId: user.schoolId,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Return user data (exclude password)
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        schoolId: user.schoolId,
        schoolName: user.schoolName,
        schoolDomain: user.schoolDomain,
        department: user.department,
        studentId: user.studentId,
        year: user.year,
        active: user.active,
        lastLogin: user.lastLogin,
      };

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userData,
          token,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.',
      });
    }
  };

  /**
   * Platform Admin Login endpoint
   * POST /api/auth/platform-login
   * Only allows super_admin users to authenticate
   */
  platformLogin = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
        return;
      }

      const user = await User.findOne({
        where: { email: email.toLowerCase() },
        include: [{ model: School, as: 'school' }],
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      if (!user.active) {
        res.status(401).json({
          success: false,
          message: 'Account is deactivated. Please contact support.',
        });
        return;
      }

      if (user.status === 'suspended') {
        res.status(403).json({
          success: false,
          message: 'Your account has been suspended.',
          code: 'SUSPENDED',
        });
        return;
      }

      // Verify password FIRST to prevent role enumeration
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      // Only super_admin may use this endpoint
      if (user.role !== 'super_admin') {
        res.status(403).json({
          success: false,
          message: 'This portal is for platform administrators only.',
          code: 'NOT_PLATFORM_ADMIN',
        });
        return;
      }

      await user.update({ lastLogin: new Date() });

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          schoolId: user.schoolId,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        schoolId: user.schoolId,
        schoolName: user.schoolName,
        schoolDomain: user.schoolDomain,
        active: user.active,
        lastLogin: user.lastLogin,
      };

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userData,
          token,
        },
      });
    } catch (error) {
      console.error('Platform login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.',
      });
    }
  };

  /**
   * Register endpoint
   * POST /api/auth/register
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        email,
        password,
        name,
        // role is always 'student' — admin/super_admin creation is done via admin endpoints
        schoolId,
        schoolName,
        schoolDomain,
        department,
        studentId,
        year,
      } = req.body;

      // Validate required fields
      if (!email || !password || !name) {
        res.status(400).json({
          success: false,
          message: 'Email, password, and name are required',
        });
        return;
      }

      // Check if user exists
      const existingUser = await User.findOne({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'User with this email already exists',
        });
        return;
      }

      // If schoolId provided, verify it exists
      let school: School | null = null;
      if (schoolId) {
        school = await School.findByPk(schoolId);
        if (!school) {
          res.status(400).json({
            success: false,
            message: 'Invalid school ID',
          });
          return;
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user as student with pending_approval status
      const user = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role: 'student',
        status: 'pending_approval',
        schoolId: school?.id || schoolId,
        schoolName: school?.name || schoolName,
        schoolDomain: school?.domain || schoolDomain,
        department,
        studentId,
        year,
        active: true,
      });

      // Return success but do NOT issue a JWT — account needs admin approval
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        schoolId: user.schoolId,
        schoolName: user.schoolName,
        schoolDomain: user.schoolDomain,
        department: user.department,
        studentId: user.studentId,
        year: user.year,
        active: user.active,
      };

      res.status(201).json({
        success: true,
        message: 'Registration successful — your account is pending admin approval. You will be able to log in once approved.',
        data: {
          user: userData,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed. Please try again.',
      });
    }
  };

  /**
   * Verify token endpoint
   * GET /api/auth/verify
   */
  verifyToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'No token provided',
        });
        return;
      }

      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: number;
        email: string;
        role: string;
        schoolId?: string;
      };

      // Find user
      const user = await User.findByPk(decoded.userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      if (!user.active) {
        res.status(401).json({
          success: false,
          message: 'Account is deactivated',
        });
        return;
      }

      // Also check status
      if (user.status !== 'active') {
        res.status(401).json({
          success: false,
          message: 'Account is not active',
          code: user.status === 'pending_approval' ? 'PENDING_APPROVAL' : user.status === 'suspended' ? 'SUSPENDED' : 'REJECTED',
        });
        return;
      }

      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        schoolId: user.schoolId,
        schoolName: user.schoolName,
        schoolDomain: user.schoolDomain,
        department: user.department,
        studentId: user.studentId,
        year: user.year,
        active: user.active,
        lastLogin: user.lastLogin,
      };

      res.json({
        success: true,
        data: {
          user: userData,
        },
      });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  };

  /**
   * Logout endpoint
   * POST /api/auth/logout
   */
  logout = async (_req: Request, res: Response): Promise<void> => {
    // In JWT system, logout is handled client-side
    // Could implement token blacklisting here if needed
    res.json({
      success: true,
      message: 'Logout successful',
    });
  };

  /**
   * Change password endpoint
   * POST /api/auth/change-password
   */
  changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password and new password are required',
        });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters',
        });
        return;
      }

      const user = await User.findByPk(req.user.userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isCurrentPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        });
        return;
      }

      // Hash and update password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await user.update({ password: hashedNewPassword });

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
      });
    }
  };

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const user = await User.findByPk(req.user.userId, {
        include: [{ model: School, as: 'school' }],
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
        schoolName: user.schoolName,
        schoolDomain: user.schoolDomain,
        department: user.department,
        studentId: user.studentId,
        year: user.year,
        active: user.active,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        status: user.status,
      };

      res.json({
        success: true,
        data: { user: userData },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
      });
    }
  };

  /**
   * Update user profile
   * PATCH /api/auth/me
   */
  updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { name, department, year } = req.body;

      const user = await User.findByPk(req.user.userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Update allowed fields only
      const updates: Partial<{ name: string; department: string; year: string }> = {};
      if (name) updates.name = name;
      if (department) updates.department = department;
      if (year) updates.year = year;

      await user.update(updates);

      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
        schoolName: user.schoolName,
        department: user.department,
        year: user.year,
      };

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: userData },
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
      });
    }
  };
}

/**
 * Middleware to verify JWT token
 */
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email: string;
      role: string;
      schoolId?: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
    res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
    return;
  }
  next();
};

/**
 * Middleware to check if user is super admin
 */
export const requireSuperAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'super_admin') {
    res.status(403).json({
      success: false,
      message: 'Super admin access required',
    });
    return;
  }
  next();
};

export default AuthController;
