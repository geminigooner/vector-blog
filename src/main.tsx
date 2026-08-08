import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PublicApp } from './PublicApp.tsx';
import { StudioLayout } from './studio/StudioLayout.tsx';
import { Dashboard } from './studio/Dashboard.tsx';
import { Editor } from './studio/Editor.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicApp />} />
        <Route path="/studio" element={<StudioLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="editor/:id" element={<Editor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
