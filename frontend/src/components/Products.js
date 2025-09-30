import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './styles.css';

const Products = () => {
  const { API } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: '',
    cost: '',
    sku: '',
    description: '',
    stock_quantity: 50
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sample products
  const sampleProducts = [
    {
      name: 'Oud Royal Attar 12ml',
      price: 150,
      cost: 75,
      sku: 'OUD-ROY-12ML',
      description: 'Premium oud attar from Cambodia, aged 5 years',
      stock_quantity: 25,
      category_name: 'Perfume Oils'
    },
    {
      name: 'Rose Damascus Oil 10ml',
      price: 85,
      cost: 45,
      sku: 'ROSE-DAM-10ML',
      description: 'Pure Damascus rose oil, highly concentrated',
      stock_quantity: 40,
      category_name: 'Essential Oils'
    },
    {
      name: 'Sandalwood Bakhoor 50g',
      price: 65,
      cost: 35,
      sku: 'SAND-BAK-50G',
      description: 'Traditional sandalwood bakhoor chips',
      stock_quantity: 60,
      category_name: 'Incense & Bakhoor'
    },
    {
      name: 'Premium Gift Set',
      price: 250,
      cost: 125,
      sku: 'PREM-SET-01',
      description: 'Luxury gift set with oud, rose, and incense',
      stock_quantity: 15,
      category_name: 'Gift Sets'
    }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories first
      const categoriesResponse = await axios.get(`${API}/categories`);
      setCategories(categoriesResponse.data);
      
      // Fetch products
      const productsResponse = await axios.get(`${API}/products`);
      
      if (productsResponse.data.length === 0 && categoriesResponse.data.length > 0) {
        await createSampleProducts(categoriesResponse.data);
      } else {
        setProducts(productsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Create mock data if API fails
      setCategories([{ id: 1, name: 'Perfume Oils' }]);
      setProducts(sampleProducts.map((product, index) => ({
        ...product,
        id: index + 1,
        category_id: 1,
        created_at: new Date().toISOString()
      })));
    } finally {
      setLoading(false);
    }
  };

  const createSampleProducts = async (categories) => {
    try {
      const createdProducts = [];
      
      for (const product of sampleProducts) {
        const category = categories.find(c => c.name === product.category_name);
        if (category) {
          const productData = {
            ...product,
            category_id: category.id
          };
          delete productData.category_name;
          
          try {
            const response = await axios.post(`${API}/products`, productData);
            createdProducts.push(response.data);
          } catch (error) {
            // Create mock if API fails
            createdProducts.push({
              ...productData,
              id: Date.now() + Math.random(),
              created_at: new Date().toISOString()
            });
          }
        }
      }
      
      setProducts(createdProducts);
    } catch (error) {
      console.error('Error creating sample products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        cost: parseFloat(formData.cost) || 0,
        stock_quantity: parseInt(formData.stock_quantity) || 0
      };

      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, submitData);
      } else {
        await axios.post(`${API}/products`, submitData);
      }

      closeModal();
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category_id: product.category_id,
      price: product.price.toString(),
      cost: product.cost.toString(),
      sku: product.sku || '',
      description: product.description || '',
      stock_quantity: product.stock_quantity || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await axios.delete(`${API}/products/${productId}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      category_id: '',
      price: '',
      cost: '',
      sku: '',
      description: '',
      stock_quantity: 50
    });
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const exportInventoryToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text('BADSHAH - HAKIMI EXHIBITION', 20, 20);
    doc.setFontSize(16);
    doc.text('INVENTORY REPORT', 20, 30);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-AE')}`, 20, 40);
    
    // Inventory Summary
    const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock_quantity), 0);
    const totalItems = products.reduce((sum, product) => sum + product.stock_quantity, 0);
    const lowStock = products.filter(product => product.stock_quantity <= 10).length;
    
    doc.setFontSize(14);
    doc.text('INVENTORY SUMMARY', 20, 55);
    doc.setFontSize(11);
    doc.text(`Total Products: ${products.length}`, 20, 65);
    doc.text(`Total Items in Stock: ${totalItems}`, 20, 72);
    doc.text(`Total Inventory Value: AED ${totalValue.toFixed(2)}`, 20, 79);
    doc.text(`Low Stock Items: ${lowStock}`, 20, 86);
    
    // Product Details Table
    const headers = ['Product Name', 'Category', 'SKU', 'Stock', 'Price', 'Value'];
    const data = products.map(product => [
      product.name,
      getCategoryName(product.category_id),
      product.sku || 'N/A',
      product.stock_quantity.toString(),
      `AED ${product.price.toFixed(2)}`,
      `AED ${(product.price * product.stock_quantity).toFixed(2)}`
    ]);
    
    doc.autoTable({
      startY: 95,
      head: [headers],
      body: data,
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11] },
      styles: { fontSize: 8 }
    });
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, 190, 285);
      doc.text('Confidential - Inventory Report', 20, 285);
    }
    
    doc.save('Inventory_Report.pdf');
  };

  const exportInventoryToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Summary Sheet
    const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock_quantity), 0);
    const totalItems = products.reduce((sum, product) => sum + product.stock_quantity, 0);
    const lowStock = products.filter(product => product.stock_quantity <= 10).length;
    
    const summaryData = [
      ['BADSHAH - HAKIMI EXHIBITION'],
      ['INVENTORY SUMMARY REPORT'],
      [''],
      ['Report Generated:', new Date().toLocaleDateString('en-AE')],
      [''],
      ['SUMMARY METRICS'],
      ['Total Products', products.length],
      ['Total Items in Stock', totalItems],
      ['Total Inventory Value (AED)', totalValue],
      ['Low Stock Items (≤10)', lowStock],
      [''],
      ['STOCK STATUS BREAKDOWN'],
      ['High Stock (>50)', products.filter(p => p.stock_quantity > 50).length],
      ['Medium Stock (11-50)', products.filter(p => p.stock_quantity > 10 && p.stock_quantity <= 50).length],
      ['Low Stock (≤10)', lowStock],
      ['Out of Stock (0)', products.filter(p => p.stock_quantity === 0).length]
    ];
    
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWS['!cols'] = [{ wch: 25 }, { wch: 15 }];
    
    // Detailed Inventory Sheet
    const inventoryHeaders = ['Product Name', 'Category', 'SKU', 'Description', 'Stock Quantity', 'Unit Price (AED)', 'Cost (AED)', 'Total Value (AED)', 'Stock Status'];
    const inventoryData = products.map(product => [
      product.name,
      getCategoryName(product.category_id),
      product.sku || 'N/A',
      product.description || 'N/A',
      product.stock_quantity,
      product.price,
      product.cost || product.price * 0.6, // Estimated cost if not available
      product.price * product.stock_quantity,
      product.stock_quantity === 0 ? 'OUT OF STOCK' :
      product.stock_quantity <= 10 ? 'LOW STOCK' :
      product.stock_quantity <= 50 ? 'MEDIUM STOCK' : 'HIGH STOCK'
    ]);
    
    const inventoryWS = XLSX.utils.aoa_to_sheet([inventoryHeaders, ...inventoryData]);
    inventoryWS['!cols'] = [
      { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 40 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];
    
    // Low Stock Alert Sheet
    const lowStockProducts = products.filter(product => product.stock_quantity <= 10);
    if (lowStockProducts.length > 0) {
      const alertHeaders = ['Product Name', 'Category', 'Current Stock', 'Unit Price', 'Status', 'Reorder Urgency'];
      const alertData = lowStockProducts.map(product => [
        product.name,
        getCategoryName(product.category_id),
        product.stock_quantity,
        product.price,
        product.stock_quantity === 0 ? 'OUT OF STOCK' : 'LOW STOCK',
        product.stock_quantity === 0 ? 'URGENT' :
        product.stock_quantity <= 5 ? 'HIGH' : 'MEDIUM'
      ]);
      
      const alertWS = XLSX.utils.aoa_to_sheet([alertHeaders, ...alertData]);
      alertWS['!cols'] = [
        { wch: 30 }, { wch: 20 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, alertWS, 'Low Stock Alert');
    }
    
    // Category Analysis Sheet
    const categoryAnalysis = {};
    products.forEach(product => {
      const categoryName = getCategoryName(product.category_id);
      if (!categoryAnalysis[categoryName]) {
        categoryAnalysis[categoryName] = {
          productCount: 0,
          totalStock: 0,
          totalValue: 0
        };
      }
      categoryAnalysis[categoryName].productCount++;
      categoryAnalysis[categoryName].totalStock += product.stock_quantity;
      categoryAnalysis[categoryName].totalValue += product.price * product.stock_quantity;
    });
    
    const categoryHeaders = ['Category', 'Product Count', 'Total Stock', 'Total Value (AED)'];
    const categoryData = Object.entries(categoryAnalysis).map(([category, data]) => [
      category,
      data.productCount,
      data.totalStock,
      data.totalValue
    ]);
    
    const categoryWS = XLSX.utils.aoa_to_sheet([categoryHeaders, ...categoryData]);
    categoryWS['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];
    
    // Add sheets to workbook
    XLSX.utils.book_append_sheet(workbook, summaryWS, 'Summary');
    XLSX.utils.book_append_sheet(workbook, inventoryWS, 'Detailed Inventory');
    XLSX.utils.book_append_sheet(workbook, categoryWS, 'Category Analysis');
    
    XLSX.writeFile(workbook, 'Inventory_Report.xlsx');
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
          <h1 className="text-3xl font-bold text-gray-800">Products</h1>
          <p className="text-gray-600 mt-1">Manage your perfumes, incenses and oils inventory</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={exportInventoryToPDF}
            className="btn-secondary bg-red-100 hover:bg-red-200 text-red-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export PDF
          </button>
          <button 
            onClick={exportInventoryToExcel}
            className="btn-secondary bg-green-100 hover:bg-green-200 text-green-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a4 4 0 01-4-4V5a4 4 0 014-4h10a4 4 0 014 4v14a4 4 0 01-4 4z" />
            </svg>
            Export Excel
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>
      </div>

      {products.length > 0 ? (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>SKU</th>
                <th>Stock</th>
                <th>Price</th>
                <th>Cost</th>
                <th>Margin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const margin = product.price > 0 ? ((product.price - product.cost) / product.price * 100) : 0;
                const stockStatus = product.stock_quantity <= 10 ? 'low' : product.stock_quantity <= 25 ? 'medium' : 'good';
                
                return (
                  <tr key={product.id}>
                    <td className="font-semibold">{product.name}</td>
                    <td>
                      <span className="status-badge status-new">
                        {getCategoryName(product.category_id)}
                      </span>
                    </td>
                    <td className="font-mono text-sm">{product.sku || '-'}</td>
                    <td>
                      <span className={`font-semibold ${
                        stockStatus === 'low' ? 'text-red-600' : 
                        stockStatus === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="font-semibold text-green-600">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="text-gray-600">
                      {formatCurrency(product.cost)}
                    </td>
                    <td>
                      <span className={`font-semibold ${
                        margin > 50 ? 'text-green-600' : 
                        margin > 25 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="btn-secondary text-xs px-3 py-1"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="btn-danger text-xs px-3 py-1"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Products Yet</h3>
          <p className="text-gray-500 mb-4">Add your first product to get started</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Add Your First Product
          </button>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input"
                    placeholder="e.g., Rose Attar Oil 10ml"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="form-select"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="form-input"
                    placeholder="25.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cost</label>
                  <input
                    type="number"
                    name="cost"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="form-input"
                    placeholder="15.00"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Quantity</label>
                  <input
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    className="form-input"
                    placeholder="50"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">SKU</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="form-input"
                  placeholder="e.g., ROSE-ATT-10ML"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-input resize-none"
                  rows="3"
                  placeholder="Product description..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                  {isSubmitting ? 'Saving...' : (editingProduct ? 'Update Product' : 'Save Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;