import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-carbon flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="font-serif text-3xl text-ivory tracking-wide leading-none mb-2">LATENT AFFAIRS</h1>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver/80 mb-12">
          PUBLISHING STUDIO
        </p>

        <button
          onClick={signInWithGoogle}
          className="bg-ivory text-carbon font-mono text-xs uppercase tracking-widest px-8 py-4 hover:bg-silver transition-colors"
        >
          SIGN IN WITH GOOGLE
        </button>
      </div>
    </div>
  );
}
