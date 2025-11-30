// Shared TypeScript types for Oshawa Skills Exchange

export interface UserProfile {
  userId: string;              // Cognito sub ID
  email: string;               // From Cognito (immutable)
  name: string;                // From Cognito (immutable)
  phoneNumber?: string;        // Editable
  address?: string;            // Editable
  dateOfBirth?: string;        // Editable (YYYY-MM-DD)
  isCertified: boolean;        // Auto-updated when cert approved
  certifiedSkills: string[];   // Auto-updated from approved certs
  createdAt: string;           // ISO timestamp
  updatedAt: string;           // ISO timestamp
}

export interface Certification {
  certificationId: string;
  userId: string;              // Cognito sub ID
  userEmail: string;           // From Cognito
  userName: string;            // From Cognito
  skillCategory: string;       // Technology, Health, etc.
  certificateType: 'degree' | 'training' | 'professional';
  certificateTitle: string;    // e.g., "Bachelor of Computer Science"
  issuingOrganization: string; // e.g., "Durham College"
  issueDate: string;           // YYYY-MM-DD
  documentUrl?: string;        // S3 URL (after upload)
  documentKey: string;         // S3 key: certs/{userId}/{timestamp}-{filename}.pdf
  fileSize: number;            // In bytes
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;         // Admin email
  reviewedAt?: string;         // ISO timestamp
  rejectionReason?: string;    // Only if rejected
  uploadedAt: string;          // ISO timestamp
  createdAt: string;           // ISO timestamp
}

export interface CertificationUploadRequest {
  skillCategory: string;
  certificateType: 'degree' | 'training' | 'professional';
  certificateTitle: string;
  issuingOrganization: string;
  issueDate: string;
  fileName: string;
  fileSize: number;
}

export interface CertificationReviewRequest {
  action: 'approve' | 'reject';
  rejectionReason?: string;    // Required if action is 'reject'
}

export interface ProfileUpdateRequest {
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
}

export interface Skill {
  skillId: string;
  title: string;
  description: string;
  userName: string;
  userEmail: string;
  category: string;
  location: string;
  isAvailable: boolean;
  isCertified?: boolean;       // Added for certification system
  certifiedSkills?: string[];  // Added for certification system
  createdAt: string;
  updatedAt: string;
}
