/**
 * Login Page
 * Handles user authentication with Zod validation
 */

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { loginSchema, type LoginFormData, extractFieldErrors } from '../../validation'
import { Icon } from '../../components/atoms'
import type { ISchool } from '../../types'
import aspgIcon from '../../aspg-icon.svg'
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

interface IFormErrors {
  email?: string
  password?: string
  general?: string
}

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<IFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null)
  const [schools, setSchools] = useState<ISchool[]>([])
  const [loadingSchools, setLoadingSchools] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  const { login } = useAuth()

  // Fetch schools on mount
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/schools`)
        const data = await response.json()
        if (data.success && data.schools) {
          setSchools(data.schools)
          if (data.schools.length > 0) {
            setSelectedSchoolId(data.schools[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to fetch schools:', error)
      } finally {
        setLoadingSchools(false)
      }
    }
    fetchSchools()
  }, [])

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId) || null

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear field error on change
    if (errors[field as keyof IFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const fieldErrors = extractFieldErrors(loginSchema, formData)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors as IFormErrors)
      return false
    }
    setErrors({})
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await login(formData.email, formData.password)
    } catch (err) {
      setErrors({
        general:
          err instanceof Error ? err.message : 'Invalid email or password. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-deep via-ocean-deep to-teal-primary relative overflow-hidden">
        {/* Background Pattern */}
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

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            <img src={aspgIcon} alt="ASPG" className="w-24 h-24 mb-6" />
            <h1 className="text-4xl xl:text-5xl font-serif text-white leading-tight mb-4">
              AI Student
              <br />
              <span className="italic text-teal-bright">Policy</span> Guidance
            </h1>
            <p className="text-teal-mist text-lg max-w-md">
              Instant, accurate answers to your university policy questions powered by AI.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4 mt-8">
            {[
              '24/7 Policy Support',
              'Accurate & Up-to-date Information',
              'Source References Included',
            ].map((feature) => (
              <div key={feature} className="flex items-center space-x-3 text-white/90">
                <div className="w-8 h-8 rounded-full bg-teal-bright/20 flex items-center justify-center">
                  <Icon name="check" size={16} className="text-teal-bright" />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-teal-bright/10"></div>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5"></div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-smoke">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img src={aspgIcon} alt="ASPG" className="w-16 h-16 mx-auto mb-4" />
            <h1 className="font-serif text-2xl text-teal-deep">
              AI Student <span className="italic text-teal-primary">Policy</span> Guidance
            </h1>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-teal-deep mb-2">Welcome back</h2>
            <p className="text-slate">Sign in to access your university's policy guidance system</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* School Selector */}
            <div className="mb-5">
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
                  value={selectedSchoolId || ''}
                  onChange={(e) => setSelectedSchoolId(e.target.value || null)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-teal-primary bg-white text-teal-deep transition-all"
                >
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* General Error Message */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center space-x-2">
                <Icon name="error-circle" size={16} className="flex-shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-teal-deep mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder={`you@${selectedSchool?.domain || 'university.edu'}`}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-teal-primary transition-all ${
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
                <label htmlFor="password" className="block text-sm font-medium text-teal-deep mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-teal-primary transition-all ${
                      errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
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
                {errors.password && (
                  <p id="password-error" className="mt-1 text-sm text-red-600">
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-teal-primary border-gray-300 rounded focus:ring-teal-primary"
                  />
                  <span className="ml-2 text-slate">Remember me</span>
                </label>
                <a href="#" className="text-teal-primary hover:text-ocean-deep font-medium">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-teal-primary text-white rounded-xl font-medium hover:bg-ocean-deep focus:ring-4 focus:ring-teal-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <Icon name="spinner" size={20} className="-ml-1 mr-3 text-white" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center text-sm text-slate">
              Don't have an account?{' '}
              <a href="/register" className="text-teal-primary hover:text-ocean-deep font-medium">
                Create one
              </a>
            </div>
          </div>

          {/* Platform Admin Link */}
          {/* <div className="mt-3 text-center text-sm text-slate">
            Platform administrator?{' '}
            <a href="/platform-admin/login" className="text-teal-primary hover:text-ocean-deep font-medium">
              Sign in here
            </a>
          </div> */}

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-slate">
            <p>
              © 2026 {selectedSchool?.name || 'AI Policy Guidance System'}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
