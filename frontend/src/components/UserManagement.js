import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';
import './styles.css';

const UserManagement = () => {
  const { API, user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    password: '',
    role: 'cashier',
    phone: '',
    permissions: []
  });

  const permissions = [
    { id: 'dashboard', name: 'Dashboard', description: 'Access to main dashboard and analytics' },
    { id: 'products', name: 'Products', description: 'Manage product inventory' },
    { id: 'categories', name: 'Categories', description: 'Manage product categories' },
    { id: 'exhibitions', name: 'Exhibitions', description: 'Manage exhibitions' },
    { id: 'pos', name: 'Point of Sale', description: 'Access to POS system' },
    { id: 'expenses', name: 'Expenses', description: 'Manage daily expenses' },
    { id: 'leads', name: 'Leads', description: 'Manage customer leads' },
    { id: 'reports', name: 'Reports', description: 'View and generate reports' },
    { id: 'day_end_close', name: 'Day End Close', description: 'Day-end register closing' },
    { id: 'exhibition_closure', name: 'Exhibition Closure', description: 'Final exhibition closure' },
    { id: 'user_management', name: 'User Management', description: 'Manage system users (Super Admin only)' }
  ];

  const roles = [
    { id: 'super_admin', name: 'Super Admin', description: 'Full system access' },
    { id: 'admin', name: 'Admin', description: 'Administrative access' },
    { id: 'cashier', name: 'Cashier', description: 'POS and basic operations' },
    { id: 'inventory', name: 'Inventory', description: 'Product and inventory management' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Error fetching users. Make sure you have Super Admin privileges.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        ...formData,
        permissions: formData.permissions
      };

      if (selectedUser) {
        // Update permissions only for existing users
        await axios.put(`${API}/users/${selectedUser.id}/permissions`, formData.permissions);
        setShowEditModal(false);
      } else {
        // Create new user
        await axios.post(`${API}/users`, userData);
        setShowCreateModal(false);
      }

      // Reset form
      setFormData({
        username: '',
        full_name: '',
        password: '',
        role: 'cashier',
        phone: '',
        permissions: []
      });
      setSelectedUser(null);

      // Refresh users list
      fetchUsers();
      alert(selectedUser ? 'User permissions updated successfully!' : 'User created successfully!');
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePermissionChange = (permissionId) => {
    const updatedPermissions = formData.permissions.includes(permissionId)
      ? formData.permissions.filter(p => p !== permissionId)
      : [...formData.permissions, permissionId];
    
    setFormData({
      ...formData,
      permissions: updatedPermissions
    });
  };

  const editUser = (userToEdit) => {
    setSelectedUser(userToEdit);
    setFormData({
      username: userToEdit.username,
      full_name: userToEdit.full_name,
      password: '', // Don't pre-fill password
      role: userToEdit.role,
      phone: userToEdit.phone || '',
      permissions: userToEdit.permissions || []
    });
    setShowEditModal(true);
  };

  const deleteUser = async (userId) => {
    const confirmation = window.confirm('Are you sure you want to delete this user? This action cannot be undone.');
    if (!confirmation) return;

    try {
      await axios.delete(`${API}/users/${userId}`);
      fetchUsers();
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user. Please try again.');
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      'super_admin': { class: 'bg-purple-100 text-purple-800', label: 'Super Admin' },
      'admin': { class: 'bg-blue-100 text-blue-800', label: 'Admin' },
      'cashier': { class: 'bg-green-100 text-green-800', label: 'Cashier' },
      'inventory': { class: 'bg-yellow-100 text-yellow-800', label: 'Inventory' }
    };
    
    const config = roleConfig[role] || roleConfig['cashier'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const getPermissionCount = (userPermissions) => {
    return userPermissions ? userPermissions.length : 0;
  };

  // Check if current user is Super Admin
  if (user.role !== 'super_admin') {
    return (
      <div className="card p-12 text-center">
        <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h3>
        <p className="text-gray-600">Only Super Admin can access User Management.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and permissions</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New User
        </button>
      </div>

      {/* Users List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((userItem) => (
          <div key={userItem.id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{userItem.full_name}</h3>
                <p className="text-sm text-gray-600">@{userItem.username}</p>
                {userItem.phone && (
                  <p className="text-xs text-gray-500 mt-1">{userItem.phone}</p>
                )}
              </div>
              {getRoleBadge(userItem.role)}
            </div>
            
            <div className="mb-4">
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {getPermissionCount(userItem.permissions)} Permissions
              </div>
              <div className="text-xs text-gray-500">
                Created: {new Date(userItem.created_at).toLocaleDateString('en-AE')}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                userItem.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {userItem.is_active ? 'Active' : 'Inactive'}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => editUser(userItem)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Edit Permissions
                </button>
                {userItem.id !== user.id && userItem.role !== 'super_admin' && (
                  <button
                    onClick={() => deleteUser(userItem.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Users Found</h3>
          <p className="text-gray-500 mb-4">Create your first user to get started</p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Create First User
          </button>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New User</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    placeholder="Full name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    placeholder="Enter password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="+971 50 123 4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {permissions.map(permission => (
                    <label key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission.id)}
                        onChange={() => handlePermissionChange(permission.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                        <div className="text-xs text-gray-500">{permission.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Edit Permissions: {selectedUser.full_name}</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                  <p className="text-sm text-gray-600">@{selectedUser.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
                  <p className="text-sm text-gray-600">{getRoleBadge(selectedUser.role)}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Update Permissions
                </label>
                <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {permissions.map(permission => (
                    <label key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission.id)}
                        onChange={() => handlePermissionChange(permission.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                        <div className="text-xs text-gray-500">{permission.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Update Permissions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;