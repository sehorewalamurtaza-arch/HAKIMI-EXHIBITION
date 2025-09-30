import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './styles.css';

const Reports = () => {
  const { API } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [exhibitions, setExhibitions] = useState([]);
  const [selectedExhibition, setSelectedExhibition] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState('summary');
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    fetchExhibitions();
    fetchExpenses();
  }, []);

  const fetchExhibitions = async () => {
    try {
      const response = await axios.get(`${API}/exhibitions`);
      setExhibitions(response.data);
      if (response.data.length > 0) {
        setSelectedExhibition(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching exhibitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      // For demo purposes, we'll simulate expense data since we don't have expenses API
      const sampleExpenses = [
        { category: 'Travel', amount: 150, date: '2024-09-29', notes: 'Transportation to exhibition' },
        { category: 'Hotel', amount: 400, date: '2024-09-28', notes: 'Staff accommodation' },
        { category: 'Staff Salary', amount: 600, date: '2024-09-29', notes: 'Daily staff wages' },
        { category: 'Marketing Materials', amount: 200, date: '2024-09-27', notes: 'Brochures and banners' },
        { category: 'Venue Rental', amount: 800, date: '2024-09-26', notes: 'Exhibition space rental' }
      ];
      setExpenses(sampleExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const generateReport = async () => {
    if (!selectedExhibition) return;

    try {
      setLoading(true);
      
      // For demo, we'll simulate sales data and calculate P&L
      const sampleSales = [
        { product_name: 'Oud Royal Attar 12ml', quantity: 5, unit_price: 150, total: 750, date: '2024-09-29' },
        { product_name: 'Rose Damascus Oil 10ml', quantity: 8, unit_price: 85, total: 680, date: '2024-09-29' },
        { product_name: 'Sandalwood Bakhoor 50g', quantity: 12, unit_price: 65, total: 780, date: '2024-09-28' },
        { product_name: 'Premium Gift Set', quantity: 3, unit_price: 250, total: 750, date: '2024-09-28' }
      ];

      // Calculate totals
      const totalSales = sampleSales.reduce((sum, sale) => sum + sale.total, 0);
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const grossProfit = totalSales;
      const netProfit = totalSales - totalExpenses;
      const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(2) : 0;

      // Calculate inventory value (simulated cost prices - 60% of selling price)
      const inventoryCost = sampleSales.reduce((sum, sale) => sum + (sale.total * 0.6), 0);
      const actualProfit = netProfit - inventoryCost;

      setReportData({
        exhibition: selectedExhibition,
        sales: sampleSales,
        totalSales,
        totalExpenses,
        grossProfit,
        netProfit,
        actualProfit,
        profitMargin,
        inventoryCost,
        salesCount: sampleSales.length,
        topProducts: sampleSales.sort((a, b) => b.total - a.total).slice(0, 3),
        expenseBreakdown: expenses.reduce((acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
          return acc;
        }, {})
      });
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-AE', {
      style: 'currency',
      currency: 'AED'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportToPDF = () => {
    if (!reportData) return;
    
    const doc = new jsPDF();
    
    // Header with company logo and info
    doc.setFontSize(20);
    doc.text('BADSHAH - HAKIMI EXHIBITION SALES PLATFORM', 20, 20);
    doc.setFontSize(16);
    doc.text('Exhibition Sales Report', 20, 30);
    
    // Exhibition details
    doc.setFontSize(12);
    doc.text(`Exhibition: ${reportData.exhibition.name}`, 20, 45);
    doc.text(`Location: ${reportData.exhibition.location}`, 20, 52);
    doc.text(`Report Generated: ${new Date().toLocaleDateString('en-AE')}`, 20, 59);
    
    // Financial Summary
    doc.setFontSize(14);
    doc.text('FINANCIAL SUMMARY', 20, 75);
    doc.setFontSize(11);
    
    const summaryData = [
      ['Metric', 'Amount (AED)'],
      ['Total Sales Revenue', formatCurrencyPlain(reportData.totalSales)],
      ['Cost of Goods Sold', formatCurrencyPlain(reportData.inventoryCost)],
      ['Gross Profit', formatCurrencyPlain(reportData.totalSales - reportData.inventoryCost)],
      ['Operating Expenses', formatCurrencyPlain(reportData.totalExpenses)],
      ['Net Profit', formatCurrencyPlain(reportData.actualProfit)],
      ['Profit Margin', `${reportData.profitMargin}%`]
    ];
    
    doc.autoTable({
      startY: 80,
      head: [summaryData[0]],
      body: summaryData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11] }, // Amber color
      styles: { fontSize: 10 }
    });
    
    // Sales Details
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('SALES DETAILS', 20, finalY);
    
    const salesHeaders = ['Product', 'Quantity', 'Unit Price', 'Total', 'Date'];
    const salesData = reportData.sales.map(sale => [
      sale.product_name,
      sale.quantity.toString(),
      formatCurrencyPlain(sale.unit_price),
      formatCurrencyPlain(sale.total),
      formatDate(sale.date)
    ]);
    
    doc.autoTable({
      startY: finalY + 5,
      head: [salesHeaders],
      body: salesData,
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11] },
      styles: { fontSize: 9 }
    });
    
    // Expense Breakdown
    const expenseY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('EXPENSE BREAKDOWN', 20, expenseY);
    
    const expenseData = Object.entries(reportData.expenseBreakdown).map(([category, amount]) => [
      category,
      formatCurrencyPlain(amount)
    ]);
    
    doc.autoTable({
      startY: expenseY + 5,
      head: [['Category', 'Amount (AED)']],
      body: expenseData,
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11] },
      styles: { fontSize: 10 }
    });
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, 190, 285);
      doc.text('Confidential - Badshah Hakimi Exhibition Sales Report', 20, 285);
    }
    
    doc.save(`${reportData.exhibition.name.replace(/\s+/g, '_')}_Report.pdf`);
  };

  const exportToExcel = () => {
    if (!reportData) return;
    
    const workbook = XLSX.utils.book_new();
    
    // Summary Sheet
    const summaryData = [
      ['BADSHAH - HAKIMI EXHIBITION SALES PLATFORM'],
      ['Exhibition Sales Report'],
      [''],
      ['Exhibition:', reportData.exhibition.name],
      ['Location:', reportData.exhibition.location],
      ['Report Generated:', new Date().toLocaleDateString('en-AE')],
      [''],
      ['FINANCIAL SUMMARY'],
      ['Metric', 'Amount (AED)'],
      ['Total Sales Revenue', reportData.totalSales],
      ['Cost of Goods Sold', reportData.inventoryCost],
      ['Gross Profit', reportData.totalSales - reportData.inventoryCost],
      ['Operating Expenses', reportData.totalExpenses],
      ['Net Profit', reportData.actualProfit],
      ['Profit Margin (%)', parseFloat(reportData.profitMargin)]
    ];
    
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths
    summaryWS['!cols'] = [
      { wch: 25 },
      { wch: 15 }
    ];
    
    // Sales Details Sheet
    const salesHeaders = ['Product Name', 'Quantity', 'Unit Price (AED)', 'Total (AED)', 'Date'];
    const salesData = reportData.sales.map(sale => [
      sale.product_name,
      sale.quantity,
      sale.unit_price,
      sale.total,
      formatDate(sale.date)
    ]);
    
    const salesWS = XLSX.utils.aoa_to_sheet([salesHeaders, ...salesData]);
    salesWS['!cols'] = [
      { wch: 30 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 }
    ];
    
    // Expense Breakdown Sheet
    const expenseHeaders = ['Category', 'Amount (AED)'];
    const expenseData = Object.entries(reportData.expenseBreakdown).map(([category, amount]) => [
      category,
      amount
    ]);
    
    const expenseWS = XLSX.utils.aoa_to_sheet([expenseHeaders, ...expenseData]);
    expenseWS['!cols'] = [
      { wch: 20 },
      { wch: 15 }
    ];
    
    // Inventory Analysis Sheet (if available)
    const inventoryHeaders = ['Product', 'Opening Stock', 'Sold Quantity', 'Remaining Stock', 'Sales Value'];
    const inventoryData = reportData.sales.map(sale => [
      sale.product_name,
      sale.quantity + 10, // Simulated opening stock
      sale.quantity,
      10, // Simulated remaining
      sale.total
    ]);
    
    const inventoryWS = XLSX.utils.aoa_to_sheet([inventoryHeaders, ...inventoryData]);
    inventoryWS['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 }
    ];
    
    // Add sheets to workbook
    XLSX.utils.book_append_sheet(workbook, summaryWS, 'Summary');
    XLSX.utils.book_append_sheet(workbook, salesWS, 'Sales Details');
    XLSX.utils.book_append_sheet(workbook, expenseWS, 'Expenses');
    XLSX.utils.book_append_sheet(workbook, inventoryWS, 'Inventory Analysis');
    
    // Save the file
    XLSX.writeFile(workbook, `${reportData.exhibition.name.replace(/\s+/g, '_')}_Report.xlsx`);
  };

  const formatCurrencyPlain = (amount) => {
    return amount.toFixed(2);
  };

  const exportReport = () => {
    if (!reportData) return;
    
    // Simple CSV export (keeping existing functionality)
    let csvContent = "Exhibition Sales Report\n\n";
    csvContent += `Exhibition: ${reportData.exhibition.name}\n`;
    csvContent += `Location: ${reportData.exhibition.location}\n`;
    csvContent += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    
    csvContent += "SALES SUMMARY\n";
    csvContent += `Total Sales,${reportData.totalSales}\n`;
    csvContent += `Total Expenses,${reportData.totalExpenses}\n`;
    csvContent += `Net Profit,${reportData.netProfit}\n\n`;
    
    csvContent += "DETAILED SALES\n";
    csvContent += "Product,Quantity,Unit Price,Total,Date\n";
    reportData.sales.forEach(sale => {
      csvContent += `${sale.product_name},${sale.quantity},${sale.unit_price},${sale.total},${sale.date}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.exhibition.name.replace(/\s+/g, '_')}_Report.csv`;
    a.click();
  };

  if (loading && !reportData) {
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
          <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Exhibition performance and profit analysis</p>
        </div>
        <div className="flex space-x-3">
          {reportData && (
            <>
              <button 
                onClick={exportToPDF}
                className="btn-primary bg-red-600 hover:bg-red-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>
              <button 
                onClick={exportToExcel}
                className="btn-primary bg-green-600 hover:bg-green-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a4 4 0 01-4-4V5a4 4 0 014-4h10a4 4 0 014 4v14a4 4 0 01-4 4z" />
                </svg>
                Export Excel
              </button>
              <button 
                onClick={exportReport}
                className="btn-secondary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            </>
          )}
          <button 
            onClick={generateReport}
            className="btn-primary"
            disabled={!selectedExhibition}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Generate Report
          </button>
        </div>
      </div>

      {/* Exhibition Selection */}
      <div className="card p-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-semibold text-gray-700">Exhibition:</label>
          <select
            value={selectedExhibition?.id || ''}
            onChange={(e) => setSelectedExhibition(exhibitions.find(ex => ex.id === e.target.value))}
            className="form-select max-w-xs"
          >
            <option value="">Select Exhibition</option>
            {exhibitions.map(exhibition => (
              <option key={exhibition.id} value={exhibition.id}>
                {exhibition.name} - {exhibition.location}
              </option>
            ))}
          </select>
        </div>
      </div>

      {reportData ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="summary-card bg-green-50 border-green-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.totalSales)}</p>
                </div>
              </div>
            </div>

            <div className="summary-card bg-red-50 border-red-200">
              <div className="flex items-center">
                <div className="p-2 bg-red-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h8a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(reportData.totalExpenses)}</p>
                </div>
              </div>
            </div>

            <div className="summary-card bg-blue-50 border-blue-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600">Actual Profit</p>
                  <p className={`text-2xl font-bold ${reportData.actualProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatCurrency(reportData.actualProfit)}
                  </p>
                </div>
              </div>
            </div>

            <div className="summary-card bg-amber-50 border-amber-200">
              <div className="flex items-center">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600">Profit Margin</p>
                  <p className="text-2xl font-bold text-amber-600">{reportData.profitMargin}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Performance */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Sales Performance</h3>
              <div className="space-y-4">
                {reportData.sales.map((sale, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-800">{sale.product_name}</p>
                      <p className="text-sm text-gray-600">Qty: {sale.quantity} × {formatCurrency(sale.unit_price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">{formatCurrency(sale.total)}</p>
                      <p className="text-xs text-gray-500">{formatDate(sale.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expense Breakdown */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Expense Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(reportData.expenseBreakdown).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-gray-700">{category}</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Profit & Loss Statement */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Profit & Loss Statement</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="font-semibold text-gray-700">Gross Sales Revenue</span>
                <span className="font-bold text-green-600">{formatCurrency(reportData.totalSales)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="font-semibold text-gray-700">Cost of Goods Sold (COGS)</span>
                <span className="font-bold text-red-600">-{formatCurrency(reportData.inventoryCost)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="font-semibold text-gray-700">Gross Profit</span>
                <span className="font-bold text-blue-600">{formatCurrency(reportData.totalSales - reportData.inventoryCost)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="font-semibold text-gray-700">Operating Expenses</span>
                <span className="font-bold text-red-600">-{formatCurrency(reportData.totalExpenses)}</span>
              </div>
              <div className="flex items-center justify-between py-2 bg-amber-50 px-4 rounded-lg">
                <span className="font-bold text-gray-800">Net Profit</span>
                <span className={`font-bold text-xl ${reportData.actualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(reportData.actualProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Generate Your Report</h3>
          <p className="text-gray-500 mb-4">Select an exhibition and generate comprehensive profit & loss analysis</p>
        </div>
      )}
    </div>
  );
};

export default Reports;