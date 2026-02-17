import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Auth/Login'; // Reusing Login for now
import AdminLayout from './AdminPanel/AdminLayout';
import Users from './AdminPanel/Users';
import AdminPosts from './AdminPanel/Posts';
import AdminTopics from './AdminPanel/Topics';
import Reports from './AdminPanel/Reports';

// Simple Admin Auth Check
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  // In a real app, verify token and role here
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login isAdmin={true} />} />

        <Route path="/" element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }>
          <Route index element={<div className="text-xl p-4">Welcome to Admin Dashboard</div>} />
          <Route path="users" element={<Users />} />
          <Route path="posts" element={<AdminPosts />} />
          <Route path="topics" element={<AdminTopics />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
