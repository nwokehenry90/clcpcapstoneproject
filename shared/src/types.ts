// Skill types for the marketplace
export interface Skill {
  id: string;
  title: string;
  description: string;
  userName: string;
  userEmail: string;
  category: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  isAvailable: boolean;
  rating?: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Email notification types (for SES integration)
export interface ContactRequest {
  skillId: string;
  senderName: string;
  senderEmail: string;
  message: string;
}

// Skill request/response types
export interface CreateSkillRequest {
  title: string;
  description: string;
  userName: string;
  userEmail: string;
  category: string;
  location: string;
}

export interface SkillsResponse {
  skills: Skill[];
  total?: number;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export enum ErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UPLOAD_ERROR = 'UPLOAD_ERROR'
}