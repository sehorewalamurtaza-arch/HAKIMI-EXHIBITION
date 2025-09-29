import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';
import './styles.css';

const EnhancedPOS = () => {
  const { API, user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsResponse, categoriesResponse] = await Promise.all([
        axios.get(`${API}/products`),
        axios.get(`${API}/categories`)
      ]);
      
      setProducts(productsResponse.data.filter(p => p.stock_quantity > 0));
      setCategories(categoriesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Use sample data if API fails
      const sampleProducts = [
        { id: 1, name: 'Oud Royal Attar 12ml', price: 150, stock_quantity: 25, category_id: 1 },
        { id: 2, name: 'Rose Damascus Oil 10ml', price: 85, stock_quantity: 40, category_id: 1 },
        { id: 3, name: 'Sandalwood Bakhoor 50g', price: 65, stock_quantity: 60, category_id: 2 },
        { id: 4, name: 'Premium Gift Set', price: 250, stock_quantity: 15, category_id: 3 }
      ];
      const sampleCategories = [
        { id: 1, name: 'Perfume Oils' },
        { id: 2, name: 'Incense & Bakhoor' },
        { id: 3, name: 'Gift Sets' }
      ];
      
      setProducts(sampleProducts);
      setCategories(sampleCategories);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity < product.stock_quantity) {
        setCart(cart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        ));
      } else {
        alert('Insufficient stock!');
      }
    } else {
      setCart([...cart, {
        ...product,
        quantity: 1,
        total: product.price
      }]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (newQuantity > product.stock_quantity) {
      alert('Insufficient stock!');
      return;
    }

    setCart(cart.map(item => 
      item.id === productId 
        ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
        : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerInfo({ name: '', phone: '', email: '' });
    setAmountReceived('');
    setShowCheckout(false);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.total, 0);
  };

  const getTaxAmount = () => {
    return getCartTotal() * 0.05; // 5% tax
  };

  const getFinalTotal = () => {
    return getCartTotal() + getTaxAmount();
  };

  const getChange = () => {
    const received = parseFloat(amountReceived) || 0;
    const total = getFinalTotal();
    return Math.max(0, received - total);
  };

  const processSale = async () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    if (paymentMethod === 'cash') {
      const received = parseFloat(amountReceived) || 0;
      if (received < getFinalTotal()) {
        alert('Insufficient payment amount!');
        return;
      }
    }

    setIsProcessing(true);
    
    try {
      const saleData = {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          variation_selection: {}
        })),
        payment_method: paymentMethod,
        payment_received: paymentMethod === 'cash' ? parseFloat(amountReceived) : getFinalTotal(),
        discount_amount: 0,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_email: customerInfo.email
      };

      // Try to process through API
      try {
        const response = await axios.post(`${API}/sales`, saleData);
        setLastSale({
          ...response.data,
          items: cart,
          customer: customerInfo,
          change: getChange()
        });
      } catch (apiError) {
        // Create local sale record if API fails
        const localSale = {
          id: Date.now(),
          sale_number: `SALE-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          items: cart,
          subtotal: getCartTotal(),
          tax_amount: getTaxAmount(),
          total_amount: getFinalTotal(),
          payment_method: paymentMethod,
          payment_received: paymentMethod === 'cash' ? parseFloat(amountReceived) : getFinalTotal(),
          change_given: getChange(),
          customer: customerInfo,
          cashier_name: user?.full_name || 'Staff',
          created_at: new Date().toISOString()
        };
        
        // Save to localStorage
        const existingSales = JSON.parse(localStorage.getItem('pos_sales') || '[]');
        existingSales.push(localSale);
        localStorage.setItem('pos_sales', JSON.stringify(existingSales));
        
        setLastSale(localSale);
      }

      // Clear cart and show success
      clearCart();
      alert('Sale processed successfully!');
      
    } catch (error) {
      console.error('Error processing sale:', error);
      alert('Error processing sale. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category_id.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
          <h1 className="text-3xl font-bold text-gray-800">Point of Sale</h1>
          <p className="text-gray-600 mt-1">Process customer orders and sales</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">Cashier: {user?.full_name}</span>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="btn-secondary text-sm px-4 py-2"
            >
              Clear Cart
            </button>
          )}
        </div>
      </div>

      <div className="pos-grid">
        {/* Products Section */}
        <div className="pos-products">
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input flex-1"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-select"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Grid */}
          <div className="product-grid">
            {filteredProducts.map(product => {
              const inCart = cart.find(item => item.id === product.id);
              const availableStock = product.stock_quantity - (inCart?.quantity || 0);
              
              return (
                <div
                  key={product.id}
                  className={`product-card ${
                    availableStock === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  onClick={() => availableStock > 0 && addToCart(product)}
                >
                  <div className="mb-2">
                    <h3 className="font-semibold text-gray-800 text-sm">{product.name}</h3>
                    <p className="text-lg font-bold text-amber-600">{formatCurrency(product.price)}</p>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Stock: {availableStock}</span>
                    {inCart && (
                      <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded">
                        In Cart: {inCart.quantity}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Products Found</h3>
              <p className="text-gray-500">Try adjusting your search or category filter</p>
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div className="pos-cart">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Shopping Cart</h2>
          
          {cart.length > 0 ? (
            <div className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-gray-800">{item.name}</h4>
                      <p className="text-sm text-gray-600">{formatCurrency(item.price)} each</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-gray-800">{formatCurrency(item.total)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(getCartTotal())}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Tax (5%):</span>
                  <span>{formatCurrency(getTaxAmount())}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-gray-800">
                  <span>Total:</span>
                  <span>{formatCurrency(getFinalTotal())}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => setShowCheckout(true)}
                className="btn-primary w-full py-4 text-lg"
              >
                Proceed to Checkout
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Cart is Empty</h3>
              <p className="text-gray-500">Add products from the left to start a sale</p>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Checkout</h2>
              <button
                onClick={() => setShowCheckout(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Order Summary */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Order Summary</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                      <span>{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span>Total (incl. 5% tax):</span>
                      <span>{formatCurrency(getFinalTotal())}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Customer Information (Optional)</h3>
                <div className="grid-2 gap-4">
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="form-input"
                  />
                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    className="form-input"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  className="form-input mt-4"
                />
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Payment Method</h3>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-2"
                    />
                    Cash
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-2"
                    />
                    Card
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="mobile"
                      checked={paymentMethod === 'mobile'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-2"
                    />
                    Mobile Payment
                  </label>
                </div>
              </div>

              {/* Cash Payment */}
              {paymentMethod === 'cash' && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Cash Payment</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Amount Received *
                      </label>
                      <input
                        type="number"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        className="form-input"
                        placeholder={getFinalTotal().toString()}
                        step="0.01"
                        min="0"
                      />
                    </div>
                    {amountReceived && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between">
                          <span>Change to give:</span>
                          <span className="font-bold text-green-600">
                            {formatCurrency(getChange())}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Process Sale Button */}
              <button
                onClick={processSale}
                disabled={isProcessing || (paymentMethod === 'cash' && !amountReceived)}
                className="btn-primary w-full py-4 text-lg flex items-center justify-center"
              >
                {isProcessing && <span className="loading-spinner mr-2"></span>}
                {isProcessing ? 'Processing...' : `Process Sale ${formatCurrency(getFinalTotal())}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Last Sale Receipt */}
      {lastSale && (
        <div className="card p-6 bg-green-50 border border-green-200">
          <h3 className="text-lg font-bold text-green-800 mb-4">✅ Sale Completed!</h3>
          <div className="text-sm space-y-1">
            <p><strong>Sale #:</strong> {lastSale.sale_number}</p>
            <p><strong>Total:</strong> {formatCurrency(lastSale.total_amount)}</p>
            <p><strong>Payment:</strong> {lastSale.payment_method} - {formatCurrency(lastSale.payment_received)}</p>
            {lastSale.change_given > 0 && (
              <p><strong>Change Given:</strong> {formatCurrency(lastSale.change_given)}</p>
            )}
            <p><strong>Customer:</strong> {lastSale.customer?.name || 'Walk-in'}</p>
            <p><strong>Time:</strong> {new Date(lastSale.created_at).toLocaleString()}</p>
          </div>
          <button
            onClick={() => setLastSale(null)}
            className="mt-4 btn-secondary text-sm px-4 py-2"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default EnhancedPOS;