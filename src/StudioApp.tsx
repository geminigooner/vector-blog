import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { StudioLayout } from './studio/StudioLayout';
import { Login } from './studio/Login';
import { Dashboard } from './studio/Dashboard';
import { Editor } from './studio/Editor';
import { Media } from './studio/Media';
import { Migration } from './pages/Migration';

export function StudioApp() {
  const { user, isOwner, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-carbon flex items-center justify-center font-mono text-silver text-xs">LOADING STUDIO...</div>;
  }

  if (!user || !isOwner) {
    return <Login />;
  }

  return (
    <StudioLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/editor/new" element={<Editor />} />
        <Route path="/editor/:id" element={<Editor />} />
        <Route path="/media" element={<Media />} />
        <Route path="/migrate" element={<Migration />} />
        <Route path="*" element={<Navigate to="/studio" replace />} />
      </Routes>
    </StudioLayout>
  );
}
