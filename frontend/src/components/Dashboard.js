import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';

const Dashboard = () => {
  const { API } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalExhibitions: 0,
    totalProducts: 0,
    totalSales: 0,
    totalLeads: 0
  });
  const [recentSales, setRecentSales] = useState([]);
  const [activeExhibitions, setActiveExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch exhibitions
      const exhibitionsResponse = await axios.get(`${API}/exhibitions`);
      const exhibitions = exhibitionsResponse.data;

      // Fetch products
      const productsResponse = await axios.get(`${API}/products`);
      const products = productsResponse.data;

      // Calculate stats
      const activeExhibs = exhibitions.filter(e => e.status === 'active');
      setActiveExhibitions(activeExhibs);

      // Get recent sales from active exhibitions
      let allSales = [];
      for (const exhibition of activeExhibs.slice(0, 3)) {
        try {
          const salesResponse = await axios.get(`${API}/sales/exhibition/${exhibition.id}`);
          const salesWithExhibition = salesResponse.data.map(sale => ({
            ...sale,
            exhibition_name: exhibition.name
          }));
          allSales = [...allSales, ...salesWithExhibition];
        } catch (error) {
          console.error(`Error fetching sales for exhibition ${exhibition.id}:`, error);
        }
      }

      // Sort by date and take recent 5
      allSales.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRecentSales(allSales.slice(0, 5));

      // Count total leads
      let totalLeads = 0;
      for (const exhibition of exhibitions) {
        try {
          const leadsResponse = await axios.get(`${API}/leads/exhibition/${exhibition.id}`);
          totalLeads += leadsResponse.data.length;
        } catch (error) {
          console.error(`Error fetching leads for exhibition ${exhibition.id}:`, error);
        }
      }

      setStats({
        totalExhibitions: exhibitions.length,
        totalProducts: products.length,
        totalSales: allSales.reduce((sum, sale) => sum + sale.total_amount, 0),
        totalLeads
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const [currency, setCurrency] = useState(localStorage.getItem('currency') || 'AED');

  const formatCurrency = (amount) => {
    const currencyMap = {
      'AED': { locale: 'ar-AE', currency: 'AED' },
      'QAR': { locale: 'ar-QA', currency: 'QAR' }
    };

    const config = currencyMap[currency] || currencyMap['AED'];
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="dashboard-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="dashboard-content">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to your exhibition overview</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="btn-secondary flex items-center"
          data-testid="refresh-dashboard-button"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid-4">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-gray-600">Total Exhibitions</p>
              <p className="text-2xl font-bold text-gray-800" data-testid="total-exhibitions">{stats.totalExhibitions}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-800" data-testid="total-products">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-800" data-testid="total-sales">{formatCurrency(stats.totalSales)}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-800" data-testid="total-leads">{stats.totalLeads}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Exhibitions and Recent Sales */}
      <div className="grid-2">
        {/* Active Exhibitions */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Active Exhibitions</h2>
          <div className="space-y-3" data-testid="active-exhibitions-list">
            {activeExhibitions.length > 0 ? (
              activeExhibitions.map((exhibition) => (
                <div key={exhibition.id} className="p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-gray-800">{exhibition.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{exhibition.location}</p>
                  <div className="flex items-center mt-2">
                    <span className="status-badge status-active">Active</span>
                    <span className="ml-2 text-xs text-gray-500">
                      Ends: {formatDate(exhibition.end_date)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p>No active exhibitions</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Sales</h2>
          <div className="space-y-3" data-testid="recent-sales-list">
            {recentSales.length > 0 ? (
              recentSales.map((sale) => (
                <div key={sale.id} className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{formatCurrency(sale.total_amount)}</p>
                      <p className="text-sm text-gray-600">{sale.exhibition_name}</p>
                      {sale.customer_name && (
                        <p className="text-xs text-gray-500">Customer: {sale.customer_name}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(sale.created_at)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p>No recent sales</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;