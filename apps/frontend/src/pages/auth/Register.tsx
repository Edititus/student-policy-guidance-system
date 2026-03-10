/**
 * Registration Page
 * Student self-registration with school selection
 * Status: pending_approval until admin approves
 */

import React, { useState, useEffect } from 'react';
import { registerSchema, type RegisterFormData, extractFieldErrors } from '../../validation';
import { Icon } from '../../components/atoms';
import type { ISchool } from '../../types';
import aspgIcon from '../../aspg-icon.svg';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface IFormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  schoolId?: string;
  general?: string;
}

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    schoolId: '',
  });
  const [errors, setErrors] = useState<IFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [schools, setSchools] = useState<ISchool[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch schools on mount
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/schools`);
        const data = await response.json();
        if (data.success && data.schools) {
          setSchools(data.schools);
          if (data.schools.length > 0) {
            setFormData((prev) => ({ ...prev, schoolId: data.schools[0].id }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch schools:', error);
      } finally {
        setLoadingSchools(false);
      }
    };
    fetchSchools();
  }, []);

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof IFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const fieldErrors = extractFieldErrors(registerSchema, formData);
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
      const selectedSchool = schools.find((s) => s.id === formData.schoolId);
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          schoolId: formData.schoolId,
          schoolName: selectedSchool?.name,
          schoolDomain: selectedSchool?.domain,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccess(true);
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : 'Registration failed. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-smoke p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-teal-mist rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="check-circle" size={32} className="text-teal-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-teal-deep mb-3">Registration Submitted</h2>
            <p className="text-slate mb-6">
              Your account is pending admin approval. You'll be able to log in once approved.
            </p>
            <a
              href="/login"
              className="inline-block w-full py-3 px-4 bg-teal-primary text-white rounded-xl font-medium hover:bg-ocean-deep transition-all text-center"
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-deep via-ocean-deep to-teal-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            <img src={aspgIcon} alt="ASPG" className="w-24 h-24 mb-6" />
            <h1 className="text-4xl xl:text-5xl font-serif text-white leading-tight mb-4">
              Create Your
              <br />
              <span className="italic text-teal-bright">Student</span> Account
            </h1>
            <p className="text-teal-mist text-lg max-w-md">
              Register to access your university's AI-powered policy guidance system.
            </p>
          </div>

          <div className="space-y-4 mt-8">
            {['Instant policy answers', 'Secure & private', 'Admin-approved access'].map((feature) => (
              <div key={feature} className="flex items-center space-x-3 text-white/90">
                <div className="w-8 h-8 rounded-full bg-teal-bright/20 flex items-center justify-center">
                  <Icon name="check" size={16} className="text-teal-bright" />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-teal-bright/10"></div>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5"></div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-smoke">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img src={aspgIcon} alt="ASPG" className="w-16 h-16 mx-auto mb-4" />
            <h1 className="font-serif text-2xl text-teal-deep">
              AI Student <span className="italic text-teal-primary">Policy</span> Guidance
            </h1>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-teal-deep mb-2">Create Account</h2>
            <p className="text-slate">Register as a student to get started</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* School Selector */}
            <div className="mb-4">
              <label htmlFor="school" className="block text-sm font-medium text-teal-deep mb-2">
                University
              </label>
              {loadingSchools ? (
                <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-slate animate-pulse">
                  Loading...
                </div>
              ) : schools.length === 0 ? (
                <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-slate">
                  No universities available
                </div>
              ) : (
                <select
                  id="school"
                  value={formData.schoolId}
                  onChange={(e) => handleInputChange('schoolId', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-teal-primary bg-white text-teal-deep transition-all ${
                    errors.schoolId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.schoolId && (
                <p className="mt-1 text-sm text-red-600">{errors.schoolId}</p>
              )}
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center space-x-2">
                <Icon name="error-circle" size={16} className="flex-shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-teal-deep mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-teal-primary transition-all ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-teal-deep mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="student@university.edu"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-teal-primary transition-all ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-teal-deep mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Min 8 chars, upper + lower + number"
                    className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-teal-primary transition-all ${
                      errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate hover:text-teal-deep transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon name={showPassword ? 'eye-off' : 'eye'} size={20} />
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-teal-deep mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Re-enter your password"
                    className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-teal-primary transition-all ${
                      errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate hover:text-teal-deep transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} />
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-teal-primary text-white rounded-xl font-medium hover:bg-ocean-deep focus:ring-4 focus:ring-teal-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <Icon name="spinner" size={20} className="-ml-1 mr-3 text-white" />
                    Registering...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate">
              Already have an account?{' '}
              <a href="/login" className="text-teal-primary hover:text-ocean-deep font-medium">
                Sign in
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
