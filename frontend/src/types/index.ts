// User Profile Types
export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  isCertified: boolean;
  certifiedSkills: string[];
  createdAt: string;
  updatedAt: string;
}

// Certification Types
export type CertificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Certification {
  certificationId: string;
  userId: string;
  userEmail: string;
  userName: string;
  skillCategory: string;
  certificateType: string;
  certificateTitle: string;
  issuingOrganization: string;
  issueDate: string;
  status: CertificationStatus;
  documentKey: string;
  documentUrl?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

// Request Types
export interface CertificationUploadRequest {
  skillCategory: string;
  certificateType: string;
  certificateTitle: string;
  issuingOrganization: string;
  issueDate: string;
  fileName: string;
  fileSize: number;
}

export interface CertificationUploadResponse {
  uploadUrl: string;
  certificationId: string;
  documentKey: string;
  expiresIn: number;
}

export interface ProfileUpdateRequest {
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
}

// Badge Size Types
export type BadgeSize = 'small' | 'medium' | 'large';
