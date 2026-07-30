import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PublicApp } from './PublicApp';
import { StudioApp } from './StudioApp';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicApp />} />
          <Route path="/studio/*" element={<StudioApp />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
