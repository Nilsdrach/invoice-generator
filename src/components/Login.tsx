import React, { useState } from 'react';
import { User } from '../types/invoice';
import { LogIn, Crown, User as UserIcon } from 'lucide-react';

interface LoginProps {
  user: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
}

export const Login: React.FC<LoginProps> = ({ user, onLogin, onLogout }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simuliere Login-API-Aufruf
    setTimeout(() => {
      // Für Demo-Zwecke: Alle E-Mails mit "premium" sind Premium-User
      const isPremium = email.toLowerCase().includes('premium');
      const newUser: User = { email, isPremium };
      
      // Speichere in LocalStorage
      localStorage.setItem('invoiceUser', JSON.stringify(newUser));
      onLogin(newUser);
      
      setIsLoading(false);
      setEmail('');
      setPassword('');
    }, 1000);
  };

  const handleLogout = () => {
    localStorage.removeItem('invoiceUser');
    onLogout();
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <UserIcon className="w-4 h-4" />
          <span className="text-gray-700">{user.email}</span>
          {user.isPremium && (
            <Crown className="w-4 h-4 text-yellow-500" title="Premium User" />
          )}
        </div>
        <button
          onClick={handleLogout}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
        >
          Abmelden
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="flex items-center gap-3">
      <input
        type="email"
        placeholder="E-Mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#9B1D20]"
        required
      />
      <input
        type="password"
        placeholder="Passwort"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#9B1D20]"
        required
      />
      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-1 text-sm bg-[#9B1D20] text-white rounded-md hover:bg-[#8A1A1D] transition-colors disabled:opacity-50"
      >
        <LogIn className="w-4 h-4" />
        {isLoading ? 'Anmelden...' : 'Anmelden'}
      </button>

    </form>
  );
};

