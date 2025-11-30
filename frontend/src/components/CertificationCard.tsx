import React from 'react';
import { DocumentTextIcon, CalendarIcon, BuildingOfficeIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface Certification {
  certificationId: string;
  skillCategory: string;
  certificateType: string;
  certificateTitle: string;
  issuingOrganization: string;
  issueDate: string;
  status: 'pending' | 'approved' | 'rejected';
  documentUrl?: string;
  rejectionReason?: string;
  reviewedAt?: string;
}

interface CertificationCardProps {
  certification: Certification;
  onDelete?: (id: string) => void;
  onView?: (url: string) => void;
}

const CertificationCard: React.FC<CertificationCardProps> = ({ certification, onDelete, onView }) => {
  const statusConfig = {
    pending: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: ClockIcon,
      label: 'Pending Review',
    },
    approved: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: CheckCircleIcon,
      label: 'Approved',
    },
    rejected: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: XCircleIcon,
      label: 'Rejected',
    },
  };

  const config = statusConfig[certification.status];
  const StatusIcon = config.icon;

  return (
    <div className={`border rounded-lg p-4 ${config.bg} ${config.border}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <DocumentTextIcon className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">{certification.certificateTitle}</h3>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
            <BuildingOfficeIcon className="w-4 h-4" />
            <span>{certification.issuingOrganization}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <CalendarIcon className="w-4 h-4" />
            <span>{new Date(certification.issueDate).toLocaleDateString()}</span>
          </div>
        </div>
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${config.bg} border ${config.border}`}>
          <StatusIcon className={`w-4 h-4 ${config.text}`} />
          <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
        </div>
      </div>

      <div className="mb-3">
        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
          {certification.skillCategory}
        </span>
        <span className="inline-block ml-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
          {certification.certificateType}
        </span>
      </div>

      {certification.status === 'rejected' && certification.rejectionReason && (
        <div className="bg-red-100 border border-red-200 rounded p-2 mb-3">
          <p className="text-sm font-medium text-red-900 mb-1">Rejection Reason:</p>
          <p className="text-sm text-red-700">{certification.rejectionReason}</p>
        </div>
      )}

      <div className="flex gap-2">
        {certification.documentUrl && onView && (
          <button
            onClick={() => onView(certification.documentUrl!)}
            className="flex-1 px-3 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            View PDF
          </button>
        )}
        {certification.status === 'pending' && onDelete && (
          <button
            onClick={() => onDelete(certification.certificationId)}
            className="px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default CertificationCard;
