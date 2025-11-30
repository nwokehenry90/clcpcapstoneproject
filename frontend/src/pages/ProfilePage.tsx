import React, { useState, useEffect } from 'react';
import { UserIcon, PhoneIcon, MapPinIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { profileApi, certificationApi } from '../services/apiService';
import CertificationUpload from '../components/CertificationUpload';
import CertificationCard from '../components/CertificationCard';

const ProfilePage: React.FC = () => {
  // Profile State
  const [profile, setProfile] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  // Certification State
  const [certifications, setCertifications] = useState<any[]>([]);
  const [isUploadingCert, setIsUploadingCert] = useState(false);

  // Loading & Error State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load Profile on Mount
  useEffect(() => {
    loadProfile();
    loadCertifications();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await profileApi.getProfile();
      const profileData = response.data.data || response.data;
      setProfile(profileData);
      setPhoneNumber(profileData.phoneNumber || '');
      setAddress(profileData.address || '');
      setDateOfBirth(profileData.dateOfBirth || '');
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadCertifications = async () => {
    try {
      const response = await certificationApi.getUserCertifications();
      setCertifications(response.data.data || response.data);
    } catch (err: any) {
      console.error('Failed to load certifications:', err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await profileApi.updateProfile({
        phoneNumber: phoneNumber || undefined,
        address: address || undefined,
        dateOfBirth: dateOfBirth || undefined,
      });
      setSuccess('Profile updated successfully');
      setIsEditingProfile(false);
      await loadProfile();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleCertUploadSuccess = () => {
    setIsUploadingCert(false);
    loadCertifications();
    setSuccess('Certification uploaded successfully! Awaiting admin review.');
  };

  const handleDeleteCert = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this certification?')) return;

    try {
      await certificationApi.deleteCertification(id);
      loadCertifications();
      setSuccess('Certification deleted successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete certification');
    }
  };

  const handleViewCert = (url: string) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Personal Info */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Personal Information</h2>
              {!isEditingProfile ? (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Edit
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsEditingProfile(false);
                    setPhoneNumber(profile?.phoneNumber || '');
                    setAddress(profile?.address || '');
                    setDateOfBirth(profile?.dateOfBirth || '');
                  }}
                  className="text-gray-600 hover:text-gray-700 text-sm"
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="flex items-center text-gray-600">
                  <UserIcon className="w-5 h-5 mr-2" />
                  <span>{profile?.email}</span>
                </div>
              </div>

              {/* Name (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <div className="flex items-center text-gray-600">
                  <UserIcon className="w-5 h-5 mr-2" />
                  <span>{profile?.name}</span>
                </div>
              </div>

              {/* Phone Number (Editable) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                {isEditingProfile ? (
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                ) : (
                  <div className="flex items-center text-gray-600">
                    <PhoneIcon className="w-5 h-5 mr-2" />
                    <span>{profile?.phoneNumber || 'Not provided'}</span>
                  </div>
                )}
              </div>

              {/* Address (Editable) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                {isEditingProfile ? (
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Main St, Oshawa, ON"
                    rows={3}
                  />
                ) : (
                  <div className="flex items-start text-gray-600">
                    <MapPinIcon className="w-5 h-5 mr-2 mt-1" />
                    <span>{profile?.address || 'Not provided'}</span>
                  </div>
                )}
              </div>

              {/* Date of Birth (Editable) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                {isEditingProfile ? (
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex items-center text-gray-600">
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    <span>{profile?.dateOfBirth || 'Not provided'}</span>
                  </div>
                )}
              </div>

              {isEditingProfile && (
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
                >
                  Save Changes
                </button>
              )}
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Certifications */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">My Certifications</h2>
              {!isUploadingCert && (
                <button
                  onClick={() => setIsUploadingCert(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                  Upload New Certification
                </button>
              )}
            </div>

            {/* Upload Form or Certifications List */}
            {isUploadingCert ? (
              <CertificationUpload
                onSuccess={handleCertUploadSuccess}
                onCancel={() => setIsUploadingCert(false)}
              />
            ) : (
              <div className="space-y-4">
                {certifications.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="mb-4">You haven't uploaded any certifications yet.</p>
                    <button
                      onClick={() => setIsUploadingCert(true)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Upload your first certification →
                    </button>
                  </div>
                ) : (
                  certifications.map((cert) => (
                    <CertificationCard
                      key={cert.certificationId}
                      certification={cert}
                      onDelete={handleDeleteCert}
                      onView={handleViewCert}
                    />
                  ))
                )}
              </div>
            )}

            {/* Certification Status Summary */}
            {certifications.length > 0 && !isUploadingCert && (
              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <h3 className="font-semibold mb-2">Status Summary</h3>
                <div className="flex gap-4 text-sm">
                  <span className="text-yellow-600">
                    Pending: {certifications.filter(c => c.status === 'pending').length}
                  </span>
                  <span className="text-green-600">
                    Approved: {certifications.filter(c => c.status === 'approved').length}
                  </span>
                  <span className="text-red-600">
                    Rejected: {certifications.filter(c => c.status === 'rejected').length}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
