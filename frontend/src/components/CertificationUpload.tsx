import React, { useState } from 'react';
import { DocumentPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_ENDPOINT || 'https://your-api-gateway-url.com/prod';

interface CertificationUploadProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  skillCategory: string;
  certificateType: 'degree' | 'training' | 'professional' | '';
  certificateTitle: string;
  issuingOrganization: string;
  issueDate: string;
  file: File | null;
}

const categories = [
  'Technology',
  'Health & Wellness',
  'Education & Tutoring',
  'Arts & Crafts',
  'Music & Performance',
  'Home & Garden',
  'Business & Finance',
  'Sports & Fitness',
  'Language',
  'Other',
];

const CertificationUpload: React.FC<CertificationUploadProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<FormData>({
    skillCategory: '',
    certificateType: '',
    certificateTitle: '',
    issuingOrganization: '',
    issueDate: '',
    file: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Only PDF files are allowed');
        e.target.value = '';
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        e.target.value = '';
        return;
      }

      setFormData(prev => ({ ...prev, file }));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.skillCategory || !formData.certificateType || !formData.certificateTitle || 
        !formData.issuingOrganization || !formData.issueDate || !formData.file) {
      setError('All fields are required');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Request upload URL from backend
      const uploadResponse = await axios.post(`${API_BASE_URL}/api/certifications`, {
        skillCategory: formData.skillCategory,
        certificateType: formData.certificateType,
        certificateTitle: formData.certificateTitle,
        issuingOrganization: formData.issuingOrganization,
        issueDate: formData.issueDate,
        fileName: formData.file.name,
        fileSize: formData.file.size,
      });

      const { uploadUrl } = uploadResponse.data.data;

      // Step 2: Upload file to S3 using pre-signed URL
      await axios.put(uploadUrl, formData.file, {
        headers: {
          'Content-Type': 'application/pdf',
        },
      });

      // Success!
      onSuccess();
    } catch (err: any) {
      console.error('Error uploading certification:', err);
      setError(err.response?.data?.error || 'Failed to upload certification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Upload Certification</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Certificate Type */}
        <div>
          <label htmlFor="certificateType" className="block text-sm font-medium text-gray-700 mb-1">
            Certificate Type *
          </label>
          <select
            id="certificateType"
            name="certificateType"
            value={formData.certificateType}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select type...</option>
            <option value="degree">Degree (Bachelor's, Master's, PhD, etc.)</option>
            <option value="training">Training Certificate</option>
            <option value="professional">Professional Certification</option>
          </select>
        </div>

        {/* Certificate Title */}
        <div>
          <label htmlFor="certificateTitle" className="block text-sm font-medium text-gray-700 mb-1">
            Certificate Title *
          </label>
          <input
            type="text"
            id="certificateTitle"
            name="certificateTitle"
            value={formData.certificateTitle}
            onChange={handleInputChange}
            placeholder="e.g., Bachelor of Computer Science"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Issuing Organization */}
        <div>
          <label htmlFor="issuingOrganization" className="block text-sm font-medium text-gray-700 mb-1">
            Issuing Organization *
          </label>
          <input
            type="text"
            id="issuingOrganization"
            name="issuingOrganization"
            value={formData.issuingOrganization}
            onChange={handleInputChange}
            placeholder="e.g., Durham College"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Issue Date */}
        <div>
          <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 mb-1">
            Issue Date *
          </label>
          <input
            type="date"
            id="issueDate"
            name="issueDate"
            value={formData.issueDate}
            onChange={handleInputChange}
            max={new Date().toISOString().split('T')[0]}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Skill Category */}
        <div>
          <label htmlFor="skillCategory" className="block text-sm font-medium text-gray-700 mb-1">
            Related Skill Category *
          </label>
          <select
            id="skillCategory"
            name="skillCategory"
            value={formData.skillCategory}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select category...</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* File Upload */}
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
            Certificate Document (PDF only, max 5MB) *
          </label>
          <div className="mt-1 flex items-center justify-center w-full">
            <label
              htmlFor="file"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <DocumentPlusIcon className="w-10 h-10 mb-2 text-gray-400" />
                {formData.file ? (
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">{formData.file.name}</span>
                  </p>
                ) : (
                  <>
                    <p className="mb-1 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF (MAX. 5MB)</p>
                  </>
                )}
              </div>
              <input
                id="file"
                name="file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                required
              />
            </label>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Uploading...' : 'Upload Certificate'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CertificationUpload;
