import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Alert, AlertDescription } from './components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { toast, Toaster } from './components/ui/sonner';
import { 
  ShoppingCart, User, LogOut, BarChart3, Package, Users, Store, 
  Plus, Settings, DollarSign, Eye, Edit, Trash2, UserPlus, 
  ShoppingBag, Calculator, Scan
} from 'lucide-react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { username, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Invalid credentials' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-400 text-lg font-light">Loading...</div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// Simple Header Component
const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: BarChart3 },
    { label: 'POS', path: '/pos', icon: Calculator },
    { label: 'Inventory', path: '/inventory', icon: Package },
    ...(user?.role === 'admin' ? [{ label: 'Users', path: '/users', icon: Users }] : [])
  ];

  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <img
                src="https://customer-assets.emergentagent.com/job_exhib-sales-system/artifacts/wrbx7jzs_Asset%202.png"
                alt="Hakimi Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
            <span className="text-xl font-light text-gray-900">Badshah Hakimi</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-light transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{user?.full_name}</div>
              <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
            </div>
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-gray-100 text-gray-600 font-medium">
                {user?.full_name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Simple Login Page
const LoginPage = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.username, formData.password);

    if (result.success) {
      navigate('/dashboard');
      toast.success('Welcome back!');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
            <img
              src="https://customer-assets.emergentagent.com/job_exhib-sales-system/artifacts/wrbx7jzs_Asset%202.png"
              alt="Hakimi Logo"
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-4xl font-light text-gray-900 mb-2">Badshah Hakimi</h1>
          <p className="text-gray-600 font-light">Exhibition Sales Platform</p>
        </div>

        {/* Form */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700 font-light">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700 font-light">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="border-gray-200 focus:border-gray-400 font-light h-12"
                  data-testid="username-input"
                  placeholder="Enter username"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-light">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="border-gray-200 focus:border-gray-400 font-light h-12"
                  data-testid="password-input"
                  placeholder="Enter password"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-black hover:bg-gray-800 text-white font-light py-6 rounded-lg text-lg"
                disabled={loading}
                data-testid="login-submit-btn"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <div className="text-sm text-gray-500 font-light mb-2">
            Default Login: <span className="font-medium">admin</span> / <span className="font-medium">admin123</span>
          </div>
          <div className="text-xs text-gray-400 font-light">
            Contact admin for staff access
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard
const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${API}/analytics/dashboard`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-lg font-light">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2" data-testid="dashboard-title">
            Good day, {user?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-gray-600 font-light">
            {user?.role === 'admin' ? 'System Overview' : 
             user?.role === 'cashier' ? 'Ready for sales' : 'Inventory Dashboard'}
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => window.location.href = '/pos'}>
            <CardContent className="p-6 text-center">
              <Calculator className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Point of Sale</h3>
              <p className="text-gray-600 font-light">Process customer transactions</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => window.location.href = '/inventory'}>
            <CardContent className="p-6 text-center">
              <Package className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Inventory</h3>
              <p className="text-gray-600 font-light">Manage products and stock</p>
            </CardContent>
          </Card>
          
          {user?.role === 'admin' && (
            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => window.location.href = '/users'}>
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">User Management</h3>
                <p className="text-gray-600 font-light">Manage staff access</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Stats for Admin */}
        {user?.role === 'admin' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 font-light text-sm">Today's Sales</p>
                    <p className="text-2xl font-light text-gray-900" data-testid="total-sales">
                      ${stats.total_sales?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 font-light text-sm">Orders</p>
                    <p className="text-2xl font-light text-gray-900" data-testid="total-orders">
                      {stats.total_orders || 0}
                    </p>
                  </div>
                  <ShoppingBag className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 font-light text-sm">Products</p>
                    <p className="text-2xl font-light text-gray-900" data-testid="total-products">
                      {stats.total_products || 0}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 font-light text-sm">Staff</p>
                    <p className="text-2xl font-light text-gray-900" data-testid="total-users">
                      {stats.total_customers || 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

// User Management (Admin only)
const UsersPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ full_name: '', username: '', role: 'cashier', password: '' });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      // This would be a new endpoint to fetch all users
      const response = await axios.get(`${API}/users`);
      setUsers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/auth/register`, newUser);
      toast.success('User created successfully!');
      setNewUser({ full_name: '', username: '', role: 'cashier', password: '' });
      setShowAddUser(false);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to create user');
    }
  };

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-lg font-light">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-light text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600 font-light">Manage staff access and roles</p>
          </div>
          
          <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
            <DialogTrigger asChild>
              <Button className="bg-black hover:bg-gray-800 text-white font-light px-6">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-light">Add New Staff Member</DialogTitle>
                <DialogDescription className="font-light">
                  Create access for new staff member
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-light">Full Name</Label>
                  <Input
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    required
                    className="font-light"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="font-light">Username</Label>
                  <Input
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    required
                    className="font-light"
                    placeholder="e.g. sarah_j"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="font-light">Role</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger className="font-light">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cashier" className="font-light">Cashier (POS Access)</SelectItem>
                      <SelectItem value="inventory" className="font-light">Inventory Manager</SelectItem>
                      <SelectItem value="admin" className="font-light">Admin (Full Access)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="font-light">Password</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    className="font-light"
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowAddUser(false)} className="font-light">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-black hover:bg-gray-800 font-light">
                    Create User
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Users Table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100">
                  <TableHead className="font-light">Name</TableHead>
                  <TableHead className="font-light">Username</TableHead>
                  <TableHead className="font-light">Role</TableHead>
                  <TableHead className="font-light">Status</TableHead>
                  <TableHead className="font-light">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="border-gray-100">
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell className="text-gray-600 font-light">{u.username}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="font-light">
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.is_active ? 'default' : 'secondary'} className="font-light">
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// App Routes
const AppRoutes = () => {
  return (
    <ProtectedRoute>
      <Header />
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/pos" element={<ComingSoon title="Point of Sale" icon={Calculator} />} />
        <Route path="/inventory" element={<ComingSoon title="Inventory Management" icon={Package} />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </ProtectedRoute>
  );
};

// Coming Soon Component
const ComingSoon = ({ title, icon: Icon }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h1 className="text-3xl font-light text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600 font-light">Coming soon...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App font-light">
          <Toaster position="top-center" />
          <Routes>
            <Route path="/login" element={<LoginRedirectWrapper />} />
            <Route path="/" element={<LoginRedirectWrapper />} />
            <Route path="/*" element={<AppRoutes />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Login redirect wrapper
const LoginRedirectWrapper = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-lg font-light">Loading...</div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" />;
  }
  
  return <LoginPage />;
};