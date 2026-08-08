import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Home, PenTool, Image as ImageIcon, ExternalLink } from 'lucide-react';

export function StudioLayout() {
  const { signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/studio', icon: Home },
    { label: 'New Artifact', path: '/studio/editor/new', icon: PenTool },
    { label: 'Media', path: '/studio/media', icon: ImageIcon },
  ];

  return (
    <div className="h-screen bg-graphite flex flex-col md:flex-row text-ivory font-sans overflow-hidden">
      
      {/* Sidebar / Topbar */}
      <div className="w-full md:w-64 bg-carbon border-b md:border-b-0 md:border-r border-silver/10 flex flex-col shrink-0">
        <div className="p-4 md:p-6 flex justify-between items-center">
          <Link to="/">
            <h1 className="font-serif text-lg md:text-xl tracking-wide">LATENT AFFAIRS</h1>
            <p className="font-mono text-[9px] uppercase tracking-widest text-silver/60 mt-1">STUDIO</p>
          </Link>
          <button onClick={signOut} className="md:hidden text-silver hover:text-rose p-2">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        
        <nav className="flex-row md:flex-col flex px-4 pb-2 md:pb-6 overflow-x-auto md:overflow-y-auto space-x-2 md:space-x-0 md:space-y-1 md:flex-1 custom-scrollbar shrink-0">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 md:gap-3 px-3 py-2 text-[10px] md:text-xs font-mono uppercase tracking-widest transition-colors whitespace-nowrap ${
                  isActive ? 'bg-silver/10 text-ivory' : 'text-silver hover:text-ivory hover:bg-silver/5'
                }`}
              >
                <Icon className="w-3 h-3 md:w-4 md:h-4" />
                {item.label}
              </Link>
            );
          })}
          
          <div className="hidden md:block pt-4 mt-4 border-t border-silver/10">
            <a
              href="/"
              className="flex items-center gap-3 px-3 py-2 text-xs font-mono uppercase tracking-widest text-silver hover:text-ivory hover:bg-silver/5 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Site
            </a>
          </div>
        </nav>
        
        <div className="hidden md:block p-4 border-t border-silver/10">
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
        <Outlet />
      </div>
    </div>
  );
}
