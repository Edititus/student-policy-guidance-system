/**
 * Platform Admin Login Page
 * Separate, dedicated login for super_admin users only.
 * Calls /auth/platform-login which rejects non-super_admin roles.
 */

import React, { useState } from 'react';
import { loginSchema, type LoginFormData, extractFieldErrors } from '../../validation';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/atoms';
import aspgIcon from '../../aspg-icon.svg';

interface IFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const PlatformAdminLoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<IFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { platformLogin } = useAuth();

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof IFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const fieldErrors = extractFieldErrors(loginSchema, formData);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors as IFormErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await platformLogin(formData.email, formData.password);
      // AuthContext sets user state; PlatformAuthWrapper will redirect to /platform
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : 'Invalid email or password.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Dark Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="admin-grid" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#admin-grid)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            <img src={aspgIcon} alt="ASPG" className="w-20 h-20 mb-6" />
            <h1 className="text-3xl xl:text-4xl font-serif text-white leading-tight mb-4">
              Platform
              <br />
              <span className="italic text-amber-400">Admin</span> Portal
            </h1>
            <p className="text-gray-400 text-lg max-w-md">
              Manage schools, administrators, and platform-wide settings from a single control panel.
            </p>
          </div>

          <div className="space-y-4 mt-8">
            {['Multi-school Management', 'Admin Provisioning', 'Platform Analytics'].map((feature) => (
              <div key={feature} className="flex items-center space-x-3 text-white/80">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Icon name="check" size={16} className="text-amber-400" />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-500/5"></div>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/3"></div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img src={aspgIcon} alt="ASPG" className="w-16 h-16 mx-auto mb-4" />
            <h1 className="font-serif text-2xl text-gray-900">
              Platform <span className="italic text-amber-600">Admin</span> Portal
            </h1>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Platform Admin</h2>
            <p className="text-gray-500">Sign in with your super administrator credentials</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            {/* General Error */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center space-x-2">
                <Icon name="error-circle" size={16} className="flex-shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="admin@platform.com"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-600">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all ${
                      errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon name={showPassword ? 'eye-off' : 'eye'} size={20} />
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="mt-1 text-sm text-red-600">
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 focus:ring-4 focus:ring-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <Icon name="spinner" size={20} className="-ml-1 mr-3 text-white" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In to Platform'
                )}
              </button>
            </form>

            {/* Back to regular login */}
            <div className="mt-6 text-center text-sm text-gray-500">
              Not a platform admin?{' '}
              <a href="/login" className="text-amber-600 hover:text-amber-700 font-medium">
                Go to university login
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-400">
            <p>© 2026 AI Policy Guidance System. Restricted access.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformAdminLoginPage;
