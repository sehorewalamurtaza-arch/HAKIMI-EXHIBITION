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
import { toast, Toaster } from './components/ui/sonner';
import { ShoppingCart, User, LogOut, BarChart3, Package, Users, Store } from 'lucide-react';
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

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const register = async (email, password, full_name, role = 'customer') => {
    try {
      await axios.post(`${API}/auth/register`, { email, password, full_name, role });
      return await login(email, password);
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
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
  if (!user) return <Navigate to="/auth" />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// Simple Header Component
const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], total_amount: 0 });

  useEffect(() => {
    if (user?.role === 'customer') {
      fetchCart();
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API}/cart`);
      setCart(response.data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-light text-gray-900">Badshah Hakimi</span>
          </Link>

          {/* User Info */}
          <div className="flex items-center space-x-6">
            {user?.role === 'customer' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/cart')}
                className="relative text-gray-600 hover:text-gray-900"
                data-testid="cart-button"
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.items?.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.items.length}
                  </span>
                )}
              </Button>
            )}
            
            <div className="flex items-center space-x-3">
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
      </div>
    </header>
  );
};

// Landing Page
const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-12">
            <div className="w-16 h-16 bg-black rounded-full mx-auto mb-6 flex items-center justify-center">
              <Store className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-light text-gray-900 mb-8 tracking-tight">
            Badshah
            <br />
            <span className="text-4xl md:text-5xl text-gray-500">Hakimi</span>
          </h1>
          
          <p className="text-xl font-light text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            A refined platform for exhibition sales.
            <br />Simple, elegant, effective.
          </p>
          
          <div className="space-y-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="bg-black hover:bg-gray-800 text-white font-light px-12 py-4 text-lg rounded-full"
              data-testid="get-started-btn"
            >
              Begin
            </Button>
            <div>
              <button
                onClick={() => navigate('/products')}
                className="text-gray-500 hover:text-gray-700 font-light text-lg underline underline-offset-4"
              >
                Browse Collection
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Simplified */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="space-y-4">
              <Store className="w-8 h-8 text-gray-700 mx-auto" />
              <h3 className="text-lg font-medium text-gray-900">Exhibitions</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                Manage your exhibitions with simplicity and grace.
              </p>
            </div>
            <div className="space-y-4">
              <Package className="w-8 h-8 text-gray-700 mx-auto" />
              <h3 className="text-lg font-medium text-gray-900">Inventory</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                Keep track of your products effortlessly.
              </p>
            </div>
            <div className="space-y-4">
              <BarChart3 className="w-8 h-8 text-gray-700 mx-auto" />
              <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                Clear insights into your business performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - Minimal */}
      <section className="px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-light text-gray-900 mb-8">
            Ready to begin?
          </h2>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="bg-black hover:bg-gray-800 text-white font-light px-12 py-4 text-lg rounded-full"
            data-testid="join-now-btn"
          >
            Start Today
          </Button>
        </div>
      </section>
    </div>
  );
};

// Elegant Authentication Component
const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '', role: 'customer' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = isLogin 
      ? await login(formData.email, formData.password)
      : await register(formData.email, formData.password, formData.full_name, formData.role);

    if (result.success) {
      navigate('/dashboard');
      toast.success('Welcome!');
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
          <div className="w-12 h-12 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
            <Store className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-light text-gray-900">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-gray-600 font-light mt-2">
            {isLogin ? 'Sign in to continue' : 'Join Badshah Hakimi'}
          </p>
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
              
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-gray-700 font-light">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required={!isLogin}
                    className="border-gray-200 focus:border-gray-400 font-light"
                    data-testid="full-name-input"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-light">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="border-gray-200 focus:border-gray-400 font-light"
                  data-testid="email-input"
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
                  className="border-gray-200 focus:border-gray-400 font-light"
                  data-testid="password-input"
                />
              </div>
              
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-gray-700 font-light">Account Type</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-gray-400 font-light" data-testid="role-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer" className="font-light">Customer</SelectItem>
                      <SelectItem value="vendor" className="font-light">Vendor</SelectItem>
                      <SelectItem value="admin" className="font-light">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-black hover:bg-gray-800 text-white font-light py-6 rounded-lg"
                disabled={loading}
                data-testid="auth-submit-btn"
              >
                {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
            </form>
            
            <div className="text-center mt-8">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-gray-600 hover:text-gray-800 font-light underline underline-offset-4"
                data-testid="toggle-auth-mode"
              >
                {isLogin ? "Create new account" : "Sign in instead"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Elegant Dashboard
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Welcome */}
        <div className="mb-12">
          <h1 className="text-4xl font-light text-gray-900 mb-2" data-testid="dashboard-title">
            Good day, {user?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-gray-600 font-light">
            {user?.role === 'admin' ? 'Your business overview' : 
             user?.role === 'vendor' ? 'Your vendor dashboard' : 'Your account'}
          </p>
        </div>
        
        {/* Stats for Admin */}
        {user?.role === 'admin' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 font-light text-sm">Sales</p>
                    <p className="text-2xl font-light text-gray-900" data-testid="total-sales">
                      ${stats.total_sales?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-gray-400" />
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
                  <Package className="w-8 h-8 text-gray-400" />
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
                  <Store className="w-8 h-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 font-light text-sm">Customers</p>
                    <p className="text-2xl font-light text-gray-900" data-testid="total-customers">
                      {stats.total_customers || 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Main Content */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-light text-gray-900 mb-4">Everything ready</h2>
            <p className="text-gray-600 font-light mb-8">
              Your platform is set up and ready to use.
            </p>
            <div className="space-x-4">
              <Button 
                variant="outline" 
                className="border-gray-200 text-gray-700 font-light px-6"
                onClick={() => window.location.href = '/products'}
              >
                View Products
              </Button>
              <Button 
                variant="outline" 
                className="border-gray-200 text-gray-700 font-light px-6"
                onClick={() => window.location.href = '/exhibitions'}
              >
                Manage Exhibitions
              </Button>
            </div>
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
        <Route path="/products" element={<ComingSoon title="Products" />} />
        <Route path="/exhibitions" element={<ComingSoon title="Exhibitions" />} />
        <Route path="/orders" element={<ComingSoon title="Orders" />} />
        <Route path="/cart" element={<ComingSoon title="Cart" />} />
      </Routes>
    </ProtectedRoute>
  );
};

// Coming Soon Component
const ComingSoon = ({ title }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
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
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/*" element={<AppRoutes />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}