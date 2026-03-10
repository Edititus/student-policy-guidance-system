/**
 * Core API types - response wrappers, pagination, and error handling
 */

/**
 * Custom API Error class for typed error handling
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Standard API response wrapper
 */
export interface IApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Pagination metadata for list endpoints
 */
export interface IPaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Paginated API response wrapper
 */
export interface IPaginatedResponse<T> extends IApiResponse<T> {
  pagination: IPaginationInfo;
}

/**
 * Confidence level enum used across the application
 */
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Common query parameters for list endpoints
 */
export interface IListParams {
  limit?: number;
  offset?: number;
}

/**
 * Date range filter parameters
 */
export interface IDateRangeParams {
  startDate?: string;
  endDate?: string;
}
