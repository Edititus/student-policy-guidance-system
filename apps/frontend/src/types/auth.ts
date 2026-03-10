/**
 * Authentication types - users, login, register, and context
 */

/**
 * User role enum
 */
export type UserRole = 'student' | 'admin' | 'super_admin';

/**
 * User account status
 */
export type UserStatus = 'pending_approval' | 'active' | 'rejected' | 'suspended';

/**
 * User entity returned from API
 */
export interface IUser {
  id: number | string;
  email: string;
  name: string;
  role: UserRole;
  status?: UserStatus;
  schoolId?: string;
  schoolName?: string;
  schoolDomain?: string;
  department?: string;
  studentId?: string;
  matricNumber?: string;
  program?: string;
  year?: string;
  active: boolean;
  lastLogin?: string;
}

/**
 * Login request payload
 */
export interface ILoginRequest {
  email: string;
  password: string;
  role?: 'student' | 'admin';
}

/**
 * Successful login response data
 */
export interface ILoginResponse {
  user: IUser;
  token: string;
}

/**
 * Register request payload
 */
export interface IRegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'student' | 'admin';
  schoolId?: string;
  schoolName?: string;
  schoolDomain?: string;
  department?: string;
  studentId?: string;
  year?: string;
}

/**
 * Auth context shape for React context
 */
export interface IAuthContext {
  user: IUser | null;
  login: (email: string, password: string) => Promise<void>;
  platformLogin: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
}

/**
 * Profile update request (partial user fields)
 */
export type IProfileUpdateRequest = Partial<Omit<IUser, 'id' | 'email' | 'role' | 'active'>>;
