import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';

const Login = () => {
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(formData.username, formData.password);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/20 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">H</span>
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-3">
            Badshah Hakimi
          </h1>
          <p className="text-gray-600 font-normal">
            Exhibition Sales Platform
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-sm border border-gray-200/40">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="form-input"
                data-testid="username-input"
                placeholder="Username"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="form-input"
                data-testid="password-input"
                placeholder="Password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="w-full btn-primary py-4 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
              data-testid="login-submit-btn"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="loading-spinner"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            &copy; 2024 Badshah Hakimi Exhibition Sales
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;