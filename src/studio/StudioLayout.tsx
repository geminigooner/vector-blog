import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Home, PenTool, Image as ImageIcon } from 'lucide-react';

export function StudioLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/studio', icon: Home },
    { label: 'New Artifact', path: '/studio/editor/new', icon: PenTool },
    { label: 'Media', path: '/studio/media', icon: ImageIcon },
  ];

  return (
    <div className="min-h-screen bg-graphite flex flex-col md:flex-row text-ivory font-sans">
      
      {/* Sidebar / Topbar */}
      <div className="w-full md:w-64 bg-carbon border-b md:border-b-0 md:border-r border-silver/10 flex flex-col">
        <div className="p-6">
          <Link to="/">
            <h1 className="font-serif text-xl tracking-wide">LATENT AFFAIRS</h1>
            <p className="font-mono text-[9px] uppercase tracking-widest text-silver/60 mt-1">STUDIO</p>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 pb-6 overflow-y-auto space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 text-xs font-mono uppercase tracking-widest transition-colors ${
                  isActive ? 'bg-silver/10 text-ivory' : 'text-silver hover:text-ivory hover:bg-silver/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-silver/10">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2 text-xs font-mono uppercase tracking-widest text-silver hover:text-rose transition-colors w-full text-left"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        {children}
      </div>

    </div>
  );
}
