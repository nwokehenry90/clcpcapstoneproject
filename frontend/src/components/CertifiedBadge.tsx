import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface CertifiedBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

const CertifiedBadge: React.FC<CertifiedBadgeProps> = ({ size = 'medium', showText = true }) => {
  const sizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  };

  const textSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
      <CheckCircleIcon className={`${sizes[size]} text-green-600`} />
      {showText && <span className={`${textSizes[size]} font-semibold text-green-700`}>Certified</span>}
    </span>
  );
};

export default CertifiedBadge;
