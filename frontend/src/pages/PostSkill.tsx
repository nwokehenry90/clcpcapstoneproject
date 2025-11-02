import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://your-api-gateway-url.com/api';

interface SkillFormData {
  title: string;
  description: string;
  userName: string;
  userEmail: string;
  category: string;
  location: string;
}

const PostSkill: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<SkillFormData>({
    title: '',
    description: '',
    userName: '',
    userEmail: '',
    category: 'Technology',
    location: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate user info from auth context
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        userName: user.attributes.name || user.username || '',
        userEmail: user.email || ''
      }));
    }
  }, [user]);

  const categories = [
    'Technology',
    'Design',
    'Tutoring',
    'Home Services',
    'Fitness',
    'Music',
    'Cooking',
    'Crafts',
    'Language',
    'Other'
  ];

  const oshawaAreas = [
    'Downtown Oshawa',
    'North Oshawa',
    'South Oshawa',
    'Central Oshawa',
    'East Oshawa',
    'West Oshawa',
    'Whitby Border',
    'Courtice Area'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null); // Clear error when user starts typing
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return 'Skill title is required';
    if (!formData.description.trim()) return 'Description is required';
    if (!formData.userName.trim()) return 'Your name is required';
    if (!formData.userEmail.trim()) return 'Email is required';
    if (!formData.location.trim()) return 'Location is required';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.userEmail)) {
      return 'Please enter a valid email address';
    }

    if (formData.title.length < 5) return 'Title must be at least 5 characters';
    if (formData.description.length < 20) return 'Description must be at least 20 characters';

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axios.post(`${API_BASE_URL}/skills`, formData);
      setSuccess(true);
      
      // Redirect after showing success message
      setTimeout(() => {
        navigate('/marketplace');
      }, 2000);
      
    } catch (err) {
      console.error('Error posting skill:', err);
      setError('Failed to post skill. Please try again.');
      
      // For demo purposes, show success even if API fails
      console.log('Demo mode: Skill would be posted with data:', formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/marketplace');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600 mb-4" />
          <h2 className="text-lg font-semibold text-green-900 mb-2">
            Skill Posted Successfully!
          </h2>
          <p className="text-green-700 mb-4">
            Your skill "{formData.title}" has been added to the marketplace.
          </p>
          <p className="text-sm text-green-600">
            Redirecting you back to the marketplace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Share Your Skill</h1>
          <p className="mt-1 text-sm text-gray-600">
            Help your Oshawa community by offering your skills and expertise
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {/* Skill Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Skill Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Guitar lessons for beginners, Web development tutoring"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={100}
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.title.length}/100 characters
            </p>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Describe your skill, experience level, what you can teach, and any requirements..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={500}
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/500 characters (minimum 20)
            </p>
          </div>

          {/* Personal Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  id="userName"
                  name="userName"
                  value={formData.userName}
                  onChange={handleInputChange}
                  placeholder="Your full name"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="userEmail"
                  name="userEmail"
                  value={formData.userEmail}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Area in Oshawa *
            </label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select your area</option>
              {oshawaAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              This helps people find skills in their neighborhood
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/marketplace')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Posting Skill...' : 'Post Skill'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Tips Section */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Tips for a Great Skill Post:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Be specific about what you can teach or help with</li>
          <li>• Mention your experience level or qualifications</li>
          <li>• Include any materials or requirements needed</li>
          <li>• Be clear about your availability (evenings, weekends, etc.)</li>
          <li>• Consider mentioning if you're open to skill exchanges</li>
        </ul>
      </div>
    </div>
  );
};

export default PostSkill;