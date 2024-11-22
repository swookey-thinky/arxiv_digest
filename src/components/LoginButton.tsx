import React from 'react';
import { LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function LoginButton() {
  const { signInWithGoogle, error } = useAuth();

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={signInWithGoogle}
        className="flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
      >
        <LogIn className="w-5 h-5" />
        Sign in with Google
      </button>
      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
          {error}
        </p>
      )}
    </div>
  );
}