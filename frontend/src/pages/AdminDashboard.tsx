import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheckIcon, DocumentTextIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { adminApi } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [pendingCerts, setPendingCerts] = useState<any[]>([]);
  const [approvedCerts, setApprovedCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedCertId, setSelectedCertId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Check Admin Authorization
  useEffect(() => {
    checkAdminAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkAdminAccess = async () => {
    try {
      if (!user) {
        setError('Please login to access admin dashboard');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // Try to fetch pending certifications - backend will return 403 if not admin
      setLoading(true);
      const response = await adminApi.getPendingCertifications();
      setPendingCerts(response.data.data || response.data);
      setIsAdmin(true);
      await loadApprovedCertifications();
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        setError('Access Denied: Admin privileges required');
        setIsAdmin(false);
        setTimeout(() => navigate('/'), 3000);
      } else {
        setError('Failed to verify admin access');
        setTimeout(() => navigate('/'), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPendingCertifications = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getPendingCertifications();
      setPendingCerts(response.data.data || response.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Access Denied: Admin privileges required');
        setIsAdmin(false);
        setTimeout(() => navigate('/'), 3000);
      } else {
        setError(err.response?.data?.message || 'Failed to load certifications');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadApprovedCertifications = async () => {
    try {
      const response = await adminApi.getApprovedCertifications();
      setApprovedCerts(response.data.data || response.data);
    } catch (err: any) {
      console.error('Failed to load approved certifications:', err);
    }
  };

  const handleViewPDF = (cert: any) => {
    if (cert.documentUrl) {
      window.open(cert.documentUrl, '_blank');
    } else {
      setError('PDF URL not available');
    }
  };

  const handleApprove = async (certId: string) => {
    if (!window.confirm('Are you sure you want to approve this certification?')) return;

    try {
      setError('');
      setSuccess('');
      await adminApi.approveCertification(certId);
      setSuccess('Certification approved! Email notification sent to user.');
      loadPendingCertifications();
      loadApprovedCertifications();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve certification');
    }
  };

  const openRejectModal = (certId: string) => {
    setSelectedCertId(certId);
    setRejectModalOpen(true);
    setRejectionReason('');
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      setError('');
      setSuccess('');
      await adminApi.rejectCertification(selectedCertId, rejectionReason);
      setSuccess('Certification rejected. Email notification sent to user.');
      setRejectModalOpen(false);
      setRejectionReason('');
      loadPendingCertifications();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject certification');
    }
  };

  const handleDelete = async (certId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}'s approved certification? This will remove their certified status.`)) return;

    try {
      setError('');
      setSuccess('');
      await adminApi.deleteCertification(certId);
      setSuccess('Certification deleted successfully.');
      loadApprovedCertifications();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete certification');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
          <p className="font-bold">Access Denied</p>
          <p>You do not have admin privileges. Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <ShieldCheckIcon className="w-8 h-8 text-blue-600 mr-3" />
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

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

      {/* Pending Certifications Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold">
            Pending Certifications ({pendingCerts.length})
          </h2>
        </div>

        {pendingCerts.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>No pending certifications to review</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Skill Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certificate Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issued
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingCerts.map((cert) => (
                  <tr key={cert.certificationId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {cert.userName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {cert.userEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {cert.skillCategory}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {cert.certificateType}
                      </div>
                      <div className="text-sm text-gray-500">
                        {cert.certificateTitle}
                      </div>
                      <div className="text-xs text-gray-400">
                        {cert.issuingOrganization}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(cert.issueDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(cert.uploadedAt || cert.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewPDF(cert)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View PDF
                        </button>
                        <button
                          onClick={() => handleApprove(cert.certificationId)}
                          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectModal(cert.certificationId)}
                          className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm"
                        >
                          <XCircleIcon className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approved Certifications Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            Approved Certifications ({approvedCerts.length})
          </h2>
        </div>

        {approvedCerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No approved certifications yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certificate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approved Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approved By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {approvedCerts.map((cert) => (
                  <tr key={cert.certificationId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {cert.userName}
                      </div>
                      <div className="text-xs text-gray-500">{cert.userEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {cert.certificateTitle}
                      </div>
                      <div className="text-xs text-gray-400">
                        {cert.issuingOrganization}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(cert.reviewedAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {cert.reviewedBy}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewPDF(cert)}
                          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
                        >
                          <DocumentTextIcon className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(cert.certificationId, cert.userName)}
                          className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm"
                        >
                          <XCircleIcon className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject Certification</h3>
            
            <form onSubmit={handleReject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={4}
                  placeholder="Explain why this certification is being rejected..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This reason will be sent to the user via email.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md"
                >
                  Submit Rejection
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejectModalOpen(false);
                    setRejectionReason('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
