import React, { useState, useEffect } from 'react';
import './styles.css';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    interest: '',
    notes: '',
    status: 'new'
  });

  useEffect(() => {
    // Load sample leads for demonstration
    const sampleLeads = [
      {
        id: '1',
        name: 'Ahmed Hassan',
        phone: '+971501234567',
        email: 'ahmed.hassan@email.com',
        interest: 'Premium Oud Collection',
        status: 'hot',
        notes: 'Interested in bulk purchase for wedding',
        created_at: '2024-09-29T10:30:00Z',
        follow_up_date: '2024-10-01'
      },
      {
        id: '2',
        name: 'Fatima Al-Zahra',
        phone: '+971509876543',
        email: 'fatima.zahra@email.com',
        interest: 'Rose Oil Products',
        status: 'warm',
        notes: 'Asked about pricing for gift sets',
        created_at: '2024-09-28T15:20:00Z',
        follow_up_date: '2024-09-30'
      },
      {
        id: '3',
        name: 'Mohammad Ali',
        phone: '+971556789012',
        email: 'mohammad.ali@email.com',
        interest: 'Bakhoor Collection',
        status: 'cold',
        notes: 'General inquiry, no immediate purchase intent',
        created_at: '2024-09-27T12:45:00Z',
        follow_up_date: '2024-10-05'
      }
    ];
    setLeads(sampleLeads);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newLead = {
      ...formData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      follow_up_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 3 days from now
    };
    
    setLeads([newLead, ...leads]);
    setFormData({
      name: '',
      phone: '',
      email: '',
      interest: '',
      notes: '',
      status: 'new'
    });
    setShowAddModal(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const updateLeadStatus = (leadId, newStatus) => {
    setLeads(leads.map(lead => 
      lead.id === leadId ? { ...lead, status: newStatus } : lead
    ));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'new': { class: 'bg-blue-100 text-blue-800', label: 'New' },
      'hot': { class: 'bg-red-100 text-red-800', label: 'Hot' },
      'warm': { class: 'bg-orange-100 text-orange-800', label: 'Warm' },
      'cold': { class: 'bg-gray-100 text-gray-800', label: 'Cold' },
      'converted': { class: 'bg-green-100 text-green-800', label: 'Converted' },
      'lost': { class: 'bg-red-200 text-red-900', label: 'Lost' }
    };
    
    const config = statusConfig[status] || statusConfig['new'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredLeads = filterStatus === 'all' 
    ? leads 
    : leads.filter(lead => lead.status === filterStatus);

  const getLeadStats = () => {
    const stats = {
      total: leads.length,
      new: leads.filter(l => l.status === 'new').length,
      hot: leads.filter(l => l.status === 'hot').length,
      warm: leads.filter(l => l.status === 'warm').length,
      converted: leads.filter(l => l.status === 'converted').length
    };
    return stats;
  };

  const stats = getLeadStats();

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Customer Leads</h1>
          <p className="text-gray-600 mt-1">Track and manage potential customers</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Lead
        </button>
      </div>

      {/* Lead Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="summary-card bg-blue-50 border-blue-200">
          <p className="text-sm font-semibold text-gray-600">Total Leads</p>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="summary-card bg-green-50 border-green-200">
          <p className="text-sm font-semibold text-gray-600">New</p>
          <p className="text-2xl font-bold text-green-600">{stats.new}</p>
        </div>
        <div className="summary-card bg-red-50 border-red-200">
          <p className="text-sm font-semibold text-gray-600">Hot</p>
          <p className="text-2xl font-bold text-red-600">{stats.hot}</p>
        </div>
        <div className="summary-card bg-orange-50 border-orange-200">
          <p className="text-sm font-semibold text-gray-600">Warm</p>
          <p className="text-2xl font-bold text-orange-600">{stats.warm}</p>
        </div>
        <div className="summary-card bg-amber-50 border-amber-200">
          <p className="text-sm font-semibold text-gray-600">Converted</p>
          <p className="text-2xl font-bold text-amber-600">{stats.converted}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-semibold text-gray-700">Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-select max-w-xs"
          >
            <option value="all">All Leads</option>
            <option value="new">New</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Leads List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredLeads.map((lead) => (
          <div key={lead.id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{lead.name}</h3>
                <p className="text-sm text-gray-600">{lead.interest}</p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(lead.status)}
                <select
                  value={lead.status}
                  onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                  className="text-xs border rounded px-2 py-1"
                >
                  <option value="new">New</option>
                  <option value="hot">Hot</option>
                  <option value="warm">Warm</option>
                  <option value="cold">Cold</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {lead.phone}
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {lead.email}
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Follow-up: {formatDate(lead.follow_up_date)}
              </div>
            </div>
            
            {lead.notes && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Notes: </span>{lead.notes}
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <span className="text-xs text-gray-500">
                Added: {formatDate(lead.created_at)}
              </span>
              <div className="flex space-x-2">
                <button className="text-amber-600 hover:text-amber-700 text-sm font-medium">
                  Call
                </button>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Email
                </button>
                <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Leads Found</h3>
          <p className="text-gray-500 mb-4">Start building your customer base by adding leads</p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            Add Your First Lead
          </button>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Add New Lead</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    placeholder="+971 50 123 4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="customer@email.com"
                />
              </div>

              <div className="grid-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Interest *
                  </label>
                  <select
                    name="interest"
                    value={formData.interest}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select interest</option>
                    <option value="Oud Collections">Oud Collections</option>
                    <option value="Rose Oil Products">Rose Oil Products</option>
                    <option value="Bakhoor & Incense">Bakhoor & Incense</option>
                    <option value="Gift Sets">Gift Sets</option>
                    <option value="Custom Blends">Custom Blends</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="new">New</option>
                    <option value="warm">Warm</option>
                    <option value="hot">Hot</option>
                    <option value="cold">Cold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="form-input"
                  rows={3}
                  placeholder="Additional notes about the lead..."
                />
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Add Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;