import React, { useState } from 'react';

interface AdminLoginProps {
  onLogin: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Hardcoded credentials as requested for separate configuration
    if (username === '2399518' && password === 'xxx2399518') {
      onLogin();
    } else {
      setError('Invalid credentials');
    }
  };

  const handleBackToApp = (e: React.MouseEvent) => {
      e.preventDefault();
      const event = new CustomEvent('lumina-route-change', { detail: { view: 'app' } });
      window.dispatchEvent(event);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md animate-[fadeIn_0.5s_ease-out]">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-lumina-dark rounded-full flex items-center justify-center mx-auto mb-4 text-lumina-gold text-2xl">
                <i className="fas fa-shield-alt"></i>
            </div>
            <h1 className="text-2xl font-serif font-bold text-gray-800">Admin Portal</h1>
            <p className="text-gray-500 text-sm mt-1">Authorized Personnel Only</p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 flex items-center gap-2">
                <i className="fas fa-exclamation-circle"></i> {error}
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
                <div className="relative">
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-lumina-purple focus:ring-1 focus:ring-lumina-purple transition"
                        placeholder="Enter username"
                    />
                    <i className="fas fa-user absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                </div>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                <div className="relative">
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-lumina-purple focus:ring-1 focus:ring-lumina-purple transition"
                        placeholder="Enter password"
                    />
                    <i className="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                </div>
            </div>

            <button 
                type="submit" 
                className="w-full bg-lumina-dark text-white py-3 rounded-lg font-bold hover:bg-lumina-purple transition shadow-lg"
            >
                Login
            </button>
        </form>

        <div className="mt-8 text-center space-y-2">
             <div className="text-xs text-gray-400">
                &copy; Liuzi Tree Hollow Management System
             </div>
             <div>
                <a href="/" onClick={handleBackToApp} className="text-sm text-lumina-purple hover:underline cursor-pointer">
                    &larr; Back to Hollow
                </a>
             </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;