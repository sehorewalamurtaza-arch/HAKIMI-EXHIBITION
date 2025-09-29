import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Textarea } from './components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Alert, AlertDescription } from './components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Separator } from './components/ui/separator';
import { toast, Toaster } from './components/ui/sonner';
import { ShoppingCart, Plus, Search, User, LogOut, BarChart3, Package, Users, Store, Eye, Edit, Trash2, Star } from 'lucide-react';
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

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// Header Component
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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">Badshah-Hakimi</span>
          </Link>

          <nav className="hidden md:flex space-x-6">
            <Link to="/" className="text-gray-600 hover:text-gray-900">Home</Link>
            <Link to="/exhibitions" className="text-gray-600 hover:text-gray-900">Exhibitions</Link>
            <Link to="/products" className="text-gray-600 hover:text-gray-900">Products</Link>
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
          </nav>

          <div className="flex items-center space-x-4">
            {user?.role === 'customer' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/cart')}
                className="relative"
                data-testid="cart-button"
              >
                <ShoppingCart className="w-4 h-4" />
                {cart.items?.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 px-1 py-0.5 text-xs">
                    {cart.items.length}
                  </Badge>
                )}
              </Button>
            )}
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src="" />
                <AvatarFallback>{user?.full_name?.charAt(0)?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{user?.full_name}</span>
              <Badge variant={user?.role === 'admin' ? 'default' : user?.role === 'vendor' ? 'secondary' : 'outline'}>
                {user?.role}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="logout-button">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1693763824819-965758f8f5c7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBleGhpYml0aW9ufGVufDB8fHx8MTc1OTE2OTkwNXww&ixlib=rb-4.1.0&q=85)'
          }}
        />
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Badshah-Hakimi
            </span>
            <br />
            <span className="text-4xl md:text-5xl">Exhibition Sales Platform</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The premier destination for professional exhibition sales. Connect vendors, customers, 
            and exhibition organizers in one powerful platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')} data-testid="get-started-btn">
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/products')}>
              Browse Products
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our Platform?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Store className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Professional Exhibitions</h3>
              <p className="text-gray-600">Manage multiple exhibitions with advanced booth allocation, visitor tracking, and real-time analytics.</p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Package className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Smart Inventory</h3>
              <p className="text-gray-600">Real-time inventory management with low-stock alerts and predictive analytics for optimal stock levels.</p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <BarChart3 className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Advanced Analytics</h3>
              <p className="text-gray-600">Comprehensive sales reports, customer insights, and exhibition performance metrics in real-time.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Exhibition Business?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of successful vendors and exhibition organizers using our platform.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate('/auth')} data-testid="join-now-btn">
            Join Now - It's Free
          </Button>
        </div>
      </section>
    </div>
  );
};

// Authentication Component
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
      toast.success(`${isLogin ? 'Login' : 'Registration'} successful!`);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {isLogin ? 'Sign in to your account' : 'Join the Badshah-Hakimi platform'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {!isLogin && (
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required={!isLogin}
                  data-testid="full-name-input"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="email-input"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                data-testid="password-input"
              />
            </div>
            
            {!isLogin && (
              <div>
                <Label htmlFor="role">Account Type</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger data-testid="role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={loading} data-testid="auth-submit-btn">
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
          </form>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-blue-600 hover:underline"
              data-testid="toggle-auth-mode"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Toaster position="top-right" />
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

// App Routes Component (will be continued in next file due to length)
const AppRoutes = () => {
  return (
    <ProtectedRoute>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/exhibitions" element={<ExhibitionsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/cart" element={<CartPage />} />
        </Routes>
      </main>
    </ProtectedRoute>
  );
};

// Dashboard Component (placeholder - will be implemented in next file)
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
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8" data-testid="dashboard-title">
          {user?.role === 'admin' ? 'Admin Dashboard' : 
           user?.role === 'vendor' ? 'Vendor Dashboard' : 'Customer Dashboard'}
        </h1>
        
        {user?.role === 'admin' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="total-sales">
                  ${stats.total_sales?.toFixed(2) || '0.00'}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="total-orders">
                  {stats.total_orders || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="total-products">
                  {stats.total_products || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="total-customers">
                  {stats.total_customers || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold mb-4">Welcome to your dashboard!</h2>
          <p className="text-gray-600">More features coming soon...</p>
        </div>
      </div>
    </div>
  );
};

// Placeholder components (will be fully implemented)
const ProductsPage = () => (
  <div className="p-6">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Products</h1>
      <p>Products page coming soon...</p>
    </div>
  </div>
);

const ExhibitionsPage = () => (
  <div className="p-6">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Exhibitions</h1>
      <p>Exhibitions page coming soon...</p>
    </div>
  </div>
);

const OrdersPage = () => (
  <div className="p-6">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Orders</h1>
      <p>Orders page coming soon...</p>
    </div>
  </div>
);

const CartPage = () => (
  <div className="p-6">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <p>Cart page coming soon...</p>
    </div>
  </div>
);