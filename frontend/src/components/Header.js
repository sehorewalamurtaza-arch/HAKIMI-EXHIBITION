import React, { useContext } from 'react';
import { AuthContext } from '../App';

const Header = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="bg-white/90 backdrop-filter backdrop-blur-lg border-b border-orange-200/50 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 flex items-center justify-center">
            <img
              src="https://customer-assets.emergentagent.com/job_exhib-sales-system/artifacts/wrbx7jzs_Asset%202.png"
              alt="Hakimi Logo"
              className="w-12 h-12 object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Badshah</h1>
            <p className="text-sm text-gray-600">Hakimi Exhibition Sales Platform</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-semibold text-gray-600">Currency:</label>
            <select
              value={localStorage.getItem('currency') || 'AED'}
              onChange={(e) => {
                localStorage.setItem('currency', e.target.value);
                window.location.reload(); // Refresh to update all currency displays
              }}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1 bg-white"
              data-testid="currency-selector"
            >
              <option value="AED">AED (د.إ)</option>
              <option value="QAR">QAR (ر.ق)</option>
            </select>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-800" data-testid="user-name">{user?.full_name}</p>
            <p className="text-sm text-gray-600 capitalize" data-testid="user-role">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button
            onClick={logout}
            className="btn-secondary"
            data-testid="logout-button"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;