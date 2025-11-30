import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MagnifyingGlassIcon, 
  UserIcon, 
  ClockIcon,
  MapPinIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import CertifiedBadge from '../components/CertifiedBadge';

const API_BASE_URL = process.env.REACT_APP_API_ENDPOINT || 'https://your-api-gateway-url.com/prod';

interface Skill {
  id: string;
  title: string;
  description: string;
  userName: string;
  userEmail: string;
  category: string;
  location: string;
  createdAt: string;
  rating?: number;
  isAvailable: boolean;
}

const SkillsMarketplace: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [certifiedUsers] = useState<Set<string>>(new Set());

  const categories = [
    'all',
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

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/skills`);
      setSkills(response.data.data?.skills || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching skills:', err);
      setError('Failed to load skills. Using demo data.');
      // Demo data for when API is not available
      setSkills([
        {
          id: '1',
          title: 'Guitar Lessons for Beginners',
          description: 'I offer beginner guitar lessons with 10+ years of experience. Learn basic chords, strumming patterns, and your first songs!',
          userName: 'Sarah Johnson',
          userEmail: 'sarah.j@email.com',
          category: 'Music',
          location: 'Downtown Oshawa',
          createdAt: '2024-01-15T10:30:00Z',
          rating: 4.8,
          isAvailable: true
        },
        {
          id: '2',
          title: 'Web Development Tutoring',
          description: 'Full-stack developer offering tutoring in React, Node.js, and modern web technologies. Perfect for beginners and intermediate learners.',
          userName: 'Mike Chen',
          userEmail: 'mike.chen@email.com',
          category: 'Technology',
          location: 'North Oshawa',
          createdAt: '2024-01-14T15:45:00Z',
          rating: 4.9,
          isAvailable: true
        },
        {
          id: '3',
          title: 'Home Garden Design',
          description: 'Create beautiful outdoor spaces! I help design vegetable gardens, flower beds, and landscaping for small to medium yards.',
          userName: 'Lisa Rodriguez',
          userEmail: 'lisa.r@email.com',
          category: 'Home Services',
          location: 'South Oshawa',
          createdAt: '2024-01-13T09:20:00Z',
          rating: 4.7,
          isAvailable: true
        },
        {
          id: '4',
          title: 'French Conversation Practice',
          description: 'Native French speaker offering conversation practice sessions. Improve your spoken French in a relaxed, friendly environment.',
          userName: 'Pierre Dubois',
          userEmail: 'pierre.d@email.com',
          category: 'Language',
          location: 'Central Oshawa',
          createdAt: '2024-01-12T14:15:00Z',
          rating: 4.6,
          isAvailable: true
        },
        {
          id: '5',
          title: 'Photography for Beginners',
          description: 'Learn the basics of photography with your smartphone or camera. Composition, lighting, and editing tips included.',
          userName: 'Alex Turner',
          userEmail: 'alex.t@email.com',
          category: 'Design',
          location: 'East Oshawa',
          createdAt: '2024-01-11T11:00:00Z',
          rating: 4.5,
          isAvailable: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         skill.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         skill.userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory;
    
    return matchesSearch && matchesCategory && skill.isAvailable;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-CA', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleContactSkill = (skill: Skill) => {
    // In a real app, this would open a contact form or messaging system
    window.location.href = `mailto:${skill.userEmail}?subject=Interest in: ${skill.title}&body=Hi ${skill.userName},%0D%0A%0D%0AI'm interested in your skill: "${skill.title}"%0D%0A%0D%0APlease let me know your availability.%0D%0A%0D%0AThank you!`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Oshawa Skills Exchange</h1>
        <p className="mt-2 text-lg text-gray-600">
          Connect with your neighbors to learn, teach, and share skills
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search skills, people, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-700 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {filteredSkills.length} skill{filteredSkills.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSkills.map((skill) => (
          <div key={skill.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              {/* Category Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {skill.category}
                </span>
                {skill.rating && (
                  <div className="flex items-center space-x-1">
                    <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">{skill.rating}</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {skill.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {skill.description}
              </p>

              {/* User Info */}
              <div className="flex items-center space-x-2 mb-3">
                <UserIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">{skill.userName}</span>
                {/* Show certified badge if user is certified */}
                {certifiedUsers.has(skill.userEmail) && (
                  <CertifiedBadge size="small" showText={false} />
                )}
              </div>

              {/* Location */}
              <div className="flex items-center space-x-2 mb-3">
                <MapPinIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">{skill.location}</span>
              </div>

              {/* Date */}
              <div className="flex items-center space-x-2 mb-4">
                <ClockIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">Posted {formatDate(skill.createdAt)}</span>
              </div>

              {/* Contact Button */}
              <button
                onClick={() => handleContactSkill(skill)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Contact {skill.userName.split(' ')[0]}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredSkills.length === 0 && !loading && (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No skills found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search terms or category filter.
          </p>
        </div>
      )}
    </div>
  );
};

export default SkillsMarketplace;