import React from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="relative group">
      <div className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-100">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <UserIcon className="w-8 h-8 text-gray-600" />
        )}
        <span className="text-sm font-medium text-gray-700">
          {user.displayName || 'User'}
        </span>
      </div>

      <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}