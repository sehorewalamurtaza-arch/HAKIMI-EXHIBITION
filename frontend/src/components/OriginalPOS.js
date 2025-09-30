import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';
import './styles.css';

const OriginalPOS = () => {
  const { API } = useContext(AuthContext);
  const [exhibitions, setExhibitions] = useState([]);
  const [selectedExhibition, setSelectedExhibition] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [payments, setPayments] = useState([{ type: 'cash', amount: '' }]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Order management state
  const [recentOrders, setRecentOrders] = useState([]);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState(null);

  const paymentTypes = ['cash', 'card', 'bank_transfer', 'digital_wallet'];

  useEffect(() => {
    fetchExhibitions();
    fetchRecentOrders();
  }, []);

  useEffect(() => {
    if (selectedExhibition) {
      fetchInventory();
      fetchRecentOrders();
    }
  }, [selectedExhibition]);

  const fetchRecentOrders = async () => {
    if (!selectedExhibition) return;

    try {
      const response = await axios.get(`${API}/sales/exhibition/${selectedExhibition.id}`);
      // Get today's orders and sort by most recent
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = response.data.filter(sale => {
        const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
        return saleDate === today;
      });
      
      // Add sample recent orders for demo
      const sampleOrders = [
        {
          id: 'recent-1',
          sale_number: 'SALE-' + today.replace(/-/g, '') + '-001',
          total_amount: 315.00,
          customer_name: 'Ahmed Hassan',
          customer_phone: '+971501234567',
          created_at: new Date().toISOString(),
          status: 'completed',
          items: [
            { product_name: 'Oud Royal Attar 12ml', quantity: 1, price: 150.00 },
            { product_name: 'Rose Damascus Oil 10ml', quantity: 2, price: 85.00 }
          ],
          payments: [{ type: 'cash', amount: 315.00 }]
        },
        {
          id: 'recent-2',
          sale_number: 'SALE-' + today.replace(/-/g, '') + '-002',
          total_amount: 246.75,
          customer_name: 'Fatima Al-Zahra',
          customer_phone: '+971509876543',
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          status: 'completed',
          items: [
            { product_name: 'Sandalwood Bakhoor 50g', quantity: 3, price: 65.00 },
            { product_name: 'Premium Gift Set', quantity: 1, price: 51.75 }
          ],
          payments: [{ type: 'card', amount: 246.75 }]
        }
      ];

      const allOrders = [...todayOrders, ...sampleOrders];
      setRecentOrders(allOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10));
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    }
  };

  const editOrder = (order) => {
    setEditingOrder({...order});
    setShowEditModal(true);
  };

  const saveEditedOrder = async () => {
    if (!editingOrder) return;

    try {
      setIsProcessing(true);
      
      // In a real implementation, you'd call an API to update the order
      // For demo purposes, we'll update the local state
      const updatedOrders = recentOrders.map(order => 
        order.id === editingOrder.id ? editingOrder : order
      );
      setRecentOrders(updatedOrders);
      
      setShowEditModal(false);
      setEditingOrder(null);
      alert('Order updated successfully!');
      
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Error updating order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelEditOrder = () => {
    setEditingOrder(null);
    setShowEditModal(false);
  };

  const updateEditingOrderItem = (index, field, value) => {
    const updatedItems = [...editingOrder.items];
    updatedItems[index][field] = field === 'quantity' || field === 'price' ? parseFloat(value) || 0 : value;
    
    // Recalculate total
    const newTotal = updatedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    setEditingOrder({
      ...editingOrder,
      items: updatedItems,
      total_amount: newTotal
    });
  };

  const deleteOrder = async (orderId) => {
    const confirmation = window.confirm('Are you sure you want to delete this order?');
    if (!confirmation) return;

    try {
      // In a real implementation, you'd call an API to delete the order
      // For demo purposes, we'll update the local state
      const updatedOrders = recentOrders.filter(order => order.id !== orderId);
      setRecentOrders(updatedOrders);
      alert('Order deleted successfully!');
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Error deleting order. Please try again.');
    }
  };

  const fetchExhibitions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/exhibitions`);
      const activeExhibitions = response.data.filter(e => e.status === 'active');
      setExhibitions(activeExhibitions);
      if (activeExhibitions.length > 0) {
        setSelectedExhibition(activeExhibitions[0]);
      }
    } catch (error) {
      console.error('Error fetching exhibitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    if (!selectedExhibition) return;

    try {
      const response = await axios.get(`${API}/inventory/exhibition/${selectedExhibition.id}`);
      const availableInventory = response.data.filter(item => item.remaining_quantity > 0);
      setInventory(availableInventory);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const addToCart = (item) => {
    if (item.remaining_quantity <= 0) {
      alert('This item is out of stock');
      return;
    }

    const existingItem = cart.find(cartItem => cartItem.product_id === item.product_id);
    if (existingItem) {
      if (existingItem.quantity >= item.remaining_quantity) {
        alert('Cannot add more items than available in stock');
        return;
      }
      setCart(cart.map(cartItem =>
        cartItem.product_id === item.product_id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, {
        product_id: item.product_id,
        product_name: item.product_name,
        price: item.product_price,
        quantity: 1,
        max_quantity: item.remaining_quantity
      }]);
    }
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.product_id !== productId));
    } else {
      setCart(cart.map(item =>
        item.product_id === productId
          ? { ...item, quantity: Math.min(newQuantity, item.max_quantity) }
          : item
      ));
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const handleCustomerChange = (e) => {
    setCustomer({
      ...customer,
      [e.target.name]: e.target.value
    });
  };

  const updatePayment = (index, field, value) => {
    const newPayments = [...payments];
    newPayments[index][field] = value;
    setPayments(newPayments);
  };

  const addPayment = () => {
    setPayments([...payments, { type: 'cash', amount: '' }]);
  };

  const removePayment = (index) => {
    if (payments.length > 1) {
      setPayments(payments.filter((_, i) => i !== index));
    }
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalPaid = () => {
    return payments.reduce((total, payment) => total + (parseFloat(payment.amount) || 0), 0);
  };

  const getChange = () => {
    return getTotalPaid() - getTotalAmount();
  };

  const processSale = async () => {
    if (cart.length === 0) {
      alert('Please add items to cart');
      return;
    }

    if (Math.abs(getChange()) > 0.01 && getChange() < 0) {
      alert('Payment amount is insufficient');
      return;
    }

    setIsProcessing(true);

    try {
      const saleData = {
        exhibition_id: selectedExhibition.id,
        customer_name: customer.name || null,
        customer_phone: customer.phone || null,
        customer_email: customer.email || null,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        })),
        payments: payments.map(payment => ({
          type: payment.type,
          amount: parseFloat(payment.amount) || 0
        }))
      };

      await axios.post(`${API}/sales/enhanced`, saleData);

      // Reset form
      setCart([]);
      setCustomer({ name: '', phone: '', email: '' });
      setPayments([{ type: 'cash', amount: '' }]);

      // Refresh inventory
      fetchInventory();

      alert('Sale completed successfully!');
    } catch (error) {
      console.error('Error processing sale:', error);
      alert('Error processing sale. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    const currency = localStorage.getItem('currency') || 'AED';
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

  // Filter inventory based on search term
  const filteredInventory = inventory.filter(item =>
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="pos-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (exhibitions.length === 0) {
    return (
      <div className="card p-12 text-center fade-in" data-testid="no-active-exhibitions">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Active Exhibitions</h3>
        <p className="text-gray-500 mb-4">You need an active exhibition to start selling</p>
        <a href="/exhibitions" className="btn-primary">Go to Exhibitions</a>
      </div>
    );
  }

  return (
    <div className="pos-grid fade-in" data-testid="pos-page">
      {/* Products Section */}
      <div className="pos-products">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Point of Sale</h1>
            <p className="text-gray-600 mt-1">Select products to add to cart</p>
          </div>
          <select
            value={selectedExhibition?.id || ''}
            onChange={(e) => setSelectedExhibition(exhibitions.find(ex => ex.id === e.target.value))}
            className="form-select max-w-xs"
            data-testid="exhibition-select"
          >
            {exhibitions.map(exhibition => (
              <option key={exhibition.id} value={exhibition.id}>
                {exhibition.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input w-full"
          />
        </div>

        {filteredInventory.length > 0 ? (
          <div className="product-grid" data-testid="products-grid">
            {filteredInventory.map((item) => (
              <div key={item.id} className="product-card cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => addToCart(item)}
                data-testid={`product-card-${item.product_id}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 text-sm" data-testid={`product-name-${item.product_id}`}>
                    {item.product_name}
                  </h3>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {item.remaining_quantity} left
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-amber-600" data-testid={`product-price-${item.product_id}`}>
                    {formatCurrency(item.product_price)}
                  </span>
                  <button className="btn-primary text-xs px-3 py-1">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center" data-testid="no-inventory-message">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
            <p className="text-gray-600">No products available for sale</p>
          </div>
        )}
      </div>

      {/* Cart and Checkout Section */}
      <div className="pos-cart">
        {/* Cart */}
        <div className="card p-6" data-testid="shopping-cart">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Shopping Cart</h2>

          {cart.length > 0 ? (
            <div className="space-y-3 mb-4">
              {cart.map((item) => (
                <div key={item.product_id} className="cart-item"
                  data-testid={`cart-item-${item.product_id}`}>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{item.product_name}</h4>
                    <p className="text-xs text-gray-600">{formatCurrency(item.price)} each</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateCartQuantity(item.product_id, item.quantity - 1);
                      }}
                      className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center"
                      data-testid={`decrease-quantity-${item.product_id}`}
                    >
                      -
                    </button>
                    <span className="text-sm font-semibold w-8 text-center" data-testid={`quantity-${item.product_id}`}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateCartQuantity(item.product_id, item.quantity + 1);
                      }}
                      className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center"
                      data-testid={`increase-quantity-${item.product_id}`}
                    >
                      +
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(item.product_id);
                      }}
                      className="w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center ml-2"
                      data-testid={`remove-item-${item.product_id}`}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span data-testid="cart-total">{formatCurrency(getTotalAmount())}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500" data-testid="empty-cart-message">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
              <p>Cart is empty</p>
            </div>
          )}
        </div>

        {/* Customer Information */}
        <div className="card p-6 mt-6" data-testid="customer-info">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Customer Information</h2>
          <div className="space-y-3">
            <input
              type="text"
              name="name"
              value={customer.name}
              onChange={handleCustomerChange}
              className="form-input text-sm"
              placeholder="Customer Name (Optional)"
              data-testid="customer-name-input"
            />
            <input
              type="tel"
              name="phone"
              value={customer.phone}
              onChange={handleCustomerChange}
              className="form-input text-sm"
              placeholder="Phone Number (Optional)"
              data-testid="customer-phone-input"
            />
            <input
              type="email"
              name="email"
              value={customer.email}
              onChange={handleCustomerChange}
              className="form-input text-sm"
              placeholder="Email (Optional)"
              data-testid="customer-email-input"
            />
          </div>
        </div>

        {/* Payment */}
        <div className="card p-6 mt-6" data-testid="payment-section">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Payment</h2>

          <div className="space-y-3 mb-4">
            {payments.map((payment, index) => (
              <div key={index} className="flex items-center space-x-2" data-testid={`payment-${index}`}>
                <select
                  value={payment.type}
                  onChange={(e) => updatePayment(index, 'type', e.target.value)}
                  className="form-select text-sm flex-1"
                  data-testid={`payment-type-${index}`}
                >
                  {paymentTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={payment.amount}
                  onChange={(e) => updatePayment(index, 'amount', e.target.value)}
                  className="form-input text-sm w-24"
                  placeholder="Amount"
                  step="0.01"
                  min="0"
                  data-testid={`payment-amount-${index}`}
                />
                {payments.length > 1 && (
                  <button
                    onClick={() => removePayment(index)}
                    className="w-8 h-8 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                    data-testid={`remove-payment-${index}`}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addPayment}
            className="btn-secondary w-full text-sm mb-4"
            data-testid="add-payment-button"
          >
            + Add Payment Method
          </button>

          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span data-testid="subtotal">{formatCurrency(getTotalAmount())}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Paid:</span>
              <span data-testid="total-paid">{formatCurrency(getTotalPaid())}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Change:</span>
              <span className={getChange() >= 0 ? 'text-green-600' : 'text-red-600'} data-testid="change-amount">
                {formatCurrency(getChange())}
              </span>
            </div>
          </div>

          <button
            onClick={processSale}
            disabled={isProcessing || cart.length === 0}
            className="btn-primary w-full flex items-center justify-center py-4"
            data-testid="process-sale-button"
          >
            {isProcessing && <span className="loading-spinner mr-2"></span>}
            {isProcessing ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OriginalPOS;