import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import SkillsMarketplace from './pages/SkillsMarketplace';
import PostSkill from './pages/PostSkill';
import Layout from './components/Layout';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes with layout */}
            <Route
              path="/*"
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/marketplace" replace />} />
                    <Route path="/marketplace" element={<SkillsMarketplace />} />
                    <Route
                      path="/post-skill"
                      element={
                        <ProtectedRoute>
                          <PostSkill />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </Layout>
              }
            />
          </Routes>
        </Router>
      </div>
    </AuthProvider>
  );
}

export default App;
