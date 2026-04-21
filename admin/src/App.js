import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Auth/Login'; // Reusing Login for now
import AdminLayout from './AdminPanel/AdminLayout';
import Users from './AdminPanel/Users';
import AdminTopics from './AdminPanel/Topics';
import Reports from './AdminPanel/Reports';
import Dashboard from './AdminPanel/Dashboard';
import Settings from './AdminPanel/Settings';
import AuditLogs from './AdminPanel/AuditLogs';
import AdminManagement from './AdminPanel/AdminManagement';

import AccessDenied from './AdminPanel/AccessDenied';

// Simple Admin Auth Check
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const isAdmin = token && (adminUser.role === 'admin' || adminUser.role === 'superadmin');
  return isAdmin ? children : <Navigate to="/login" />;
};

// Granular Permission Check
const ProtectedRoute = ({ children, permission }) => {
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  const hasAccess =
    adminUser.role === 'superadmin' ||
    adminUser.permissions?.includes('all') ||
    adminUser.permissions?.includes(permission);

  return hasAccess ? children : <AccessDenied requiredPermission={permission} />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login isAdmin={true} />} />

        <Route path="/admin" element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }>
          <Route index element={
            <ProtectedRoute permission="dashboard">
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="users" element={
            <ProtectedRoute permission="users">
              <Users />
            </ProtectedRoute>
          } />
          <Route path="admins" element={
            <ProtectedRoute permission="superadmin">
              <AdminManagement />
            </ProtectedRoute>
          } />
          <Route path="topics" element={
            <ProtectedRoute permission="topics">
              <AdminTopics />
            </ProtectedRoute>
          } />
          <Route path="reports" element={
            <ProtectedRoute permission="reports">
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="settings" element={
            <ProtectedRoute permission="settings">
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="audit-logs" element={
            <ProtectedRoute permission="audits">
              <AuditLogs />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="/" element={<Navigate to="/admin" />} />
      </Routes>
    </Router>
  );
}

export default App;
