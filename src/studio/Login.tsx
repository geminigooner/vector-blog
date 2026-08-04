import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export function Login() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-carbon flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="font-serif text-3xl text-ivory tracking-wide leading-none mb-2">LATENT AFFAIRS</h1>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver/80 mb-12">
          PUBLISHING STUDIO
        </p>
        
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={signInWithGoogle}
            className="bg-ivory text-carbon font-mono text-xs uppercase tracking-widest px-8 py-4 hover:bg-silver transition-colors"
          >
            SIGN IN WITH GOOGLE
          </button>
          
          <Link to="/" className="flex items-center gap-2 text-silver hover:text-ivory font-mono text-[10px] uppercase tracking-widest transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to Site
          </Link>
        </div>
      </div>
    </div>
  );
}
