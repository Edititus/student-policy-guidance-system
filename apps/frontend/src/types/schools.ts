/**
 * School types - institutions and organization
 */

/**
 * School/institution type
 */
export type SchoolType = 'public' | 'private';

/**
 * School entity from API
 */
export interface ISchool {
  id: string;
  name: string;
  domain: string;
  country?: string;
  type?: SchoolType;
}

/**
 * Schools list response wrapper
 */
export interface ISchoolsResponse {
  success: boolean;
  schools: ISchool[];
}
