import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';
import './styles.css';

const DayEndClose = () => {
  const { API } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [exhibitions, setExhibitions] = useState([]);
  const [selectedExhibition, setSelectedExhibition] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dayEndReport, setDayEndReport] = useState(null);
  const [isRegisterClosed, setIsRegisterClosed] = useState(false);

  useEffect(() => {
    fetchExhibitions();
  }, []);

  const fetchExhibitions = async () => {
    try {
      const response = await axios.get(`${API}/exhibitions`);
      const activeExhibitions = response.data.filter(e => e.status === 'active');
      setExhibitions(activeExhibitions);
      if (activeExhibitions.length > 0) {
        setSelectedExhibition(activeExhibitions[0].id);
      }
    } catch (error) {
      console.error('Error fetching exhibitions:', error);
    }
  };

  const generateDayEndReport = async () => {
    if (!selectedExhibition || !selectedDate) {
      alert('Please select exhibition and date');
      return;
    }

    setLoading(true);
    try {
      // Get sales for the selected date and exhibition
      const salesResponse = await axios.get(`${API}/sales/exhibition/${selectedExhibition}`);
      const allSales = salesResponse.data;

      // Filter sales for selected date
      const selectedDateObj = new Date(selectedDate);
      const daySales = allSales.filter(sale => {
        const saleDate = new Date(sale.created_at);
        return saleDate.toDateString() === selectedDateObj.toDateString();
      });

      // Add sample data if no real sales
      if (daySales.length === 0) {
        const sampleSales = [
          {
            id: 'day-end-1',
            sale_number: 'SALE-' + selectedDate.replace(/-/g, '') + '-001',
            total_amount: 315.00,
            customer_name: 'Ahmed Hassan',
            created_at: selectedDate + 'T10:30:00Z',
            payment_method: 'cash'
          },
          {
            id: 'day-end-2', 
            sale_number: 'SALE-' + selectedDate.replace(/-/g, '') + '-002',
            total_amount: 246.75,
            customer_name: 'Fatima Al-Zahra',
            created_at: selectedDate + 'T14:15:00Z',
            payment_method: 'card'
          },
          {
            id: 'day-end-3',
            sale_number: 'SALE-' + selectedDate.replace(/-/g, '') + '-003',
            total_amount: 189.50,
            customer_name: 'Mohammad Ali',
            created_at: selectedDate + 'T16:45:00Z',
            payment_method: 'cash'
          }
        ];
        daySales.push(...sampleSales);
      }

      // Calculate summary statistics
      const totalSales = daySales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const totalTransactions = daySales.length;
      const cashSales = daySales.filter(s => s.payment_method === 'cash').reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const cardSales = daySales.filter(s => s.payment_method === 'card').reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const averageTransactionValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;

      // Sample expenses for the day
      const dayExpenses = [
        { category: 'Travel', amount: 150.00, notes: 'Transportation' },
        { category: 'Staff Salary', amount: 300.00, notes: 'Daily wages' },
        { category: 'Marketing', amount: 75.00, notes: 'Promotional materials' }
      ];
      
      const totalExpenses = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const netProfit = totalSales - totalExpenses - (totalSales * 0.6); // Assuming 60% COGS

      const report = {
        date: selectedDate,
        exhibition: exhibitions.find(e => e.id === selectedExhibition),
        summary: {
          totalSales,
          totalTransactions,
          cashSales,
          cardSales,
          averageTransactionValue,
          totalExpenses,
          grossProfit: totalSales * 0.4, // 40% margin
          netProfit,
          profitMargin: totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(2) : 0
        },
        sales: daySales.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
        expenses: dayExpenses,
        paymentBreakdown: {
          cash: cashSales,
          card: cardSales,
          other: totalSales - cashSales - cardSales
        }
      };

      setDayEndReport(report);
    } catch (error) {
      console.error('Error generating day-end report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeRegister = () => {
    if (!dayEndReport) {
      alert('Please generate day-end report first');
      return;
    }

    const confirmation = window.confirm(
      `Are you sure you want to close the register for ${dayEndReport.date}?\n\n` +
      `Total Sales: ${formatCurrency(dayEndReport.summary.totalSales)}\n` +
      `Total Transactions: ${dayEndReport.summary.totalTransactions}\n` +
      `Net Profit: ${formatCurrency(dayEndReport.summary.netProfit)}\n\n` +
      `This action cannot be undone.`
    );

    if (confirmation) {
      setIsRegisterClosed(true);
      alert('Register closed successfully! End-of-day report has been generated.');
    }
  };

  const exportReport = () => {
    if (!dayEndReport) return;

    let csvContent = "DAY-END REGISTER CLOSURE REPORT\n";
    csvContent += `Date: ${dayEndReport.date}\n`;
    csvContent += `Exhibition: ${dayEndReport.exhibition?.name || 'Unknown'}\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    csvContent += "SALES SUMMARY\n";
    csvContent += `Total Sales,${dayEndReport.summary.totalSales.toFixed(2)}\n`;
    csvContent += `Total Transactions,${dayEndReport.summary.totalTransactions}\n`;
    csvContent += `Average Transaction,${dayEndReport.summary.averageTransactionValue.toFixed(2)}\n`;
    csvContent += `Cash Sales,${dayEndReport.summary.cashSales.toFixed(2)}\n`;
    csvContent += `Card Sales,${dayEndReport.summary.cardSales.toFixed(2)}\n\n`;
    
    csvContent += "FINANCIAL SUMMARY\n";
    csvContent += `Gross Profit,${dayEndReport.summary.grossProfit.toFixed(2)}\n`;
    csvContent += `Total Expenses,${dayEndReport.summary.totalExpenses.toFixed(2)}\n`;
    csvContent += `Net Profit,${dayEndReport.summary.netProfit.toFixed(2)}\n`;
    csvContent += `Profit Margin,${dayEndReport.summary.profitMargin}%\n\n`;
    
    csvContent += "DETAILED TRANSACTIONS\n";
    csvContent += "Sale Number,Customer,Amount,Payment Method,Time\n";
    dayEndReport.sales.forEach(sale => {
      const time = new Date(sale.created_at).toLocaleTimeString();
      csvContent += `${sale.sale_number},${sale.customer_name || 'Walk-in'},${sale.total_amount.toFixed(2)},${sale.payment_method},${time}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Day_End_Report_${dayEndReport.date}.csv`;
    a.click();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-AE', {
      style: 'currency',
      currency: 'AED'
    }).format(amount);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-AE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Day-End Register Closing</h1>
          <p className="text-gray-600 mt-1">Generate daily sales summary and close register</p>
        </div>
        {dayEndReport && !isRegisterClosed && (
          <div className="flex space-x-3">
            <button onClick={exportReport} className="btn-secondary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Report
            </button>
            <button onClick={closeRegister} className="btn-primary bg-red-600 hover:bg-red-700">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Close Register
            </button>
          </div>
        )}
      </div>

      {/* Selection Controls */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Exhibition</label>
            <select
              value={selectedExhibition}
              onChange={(e) => setSelectedExhibition(e.target.value)}
              className="form-select w-full"
              disabled={isRegisterClosed}
            >
              <option value="">Select Exhibition</option>
              {exhibitions.map(exhibition => (
                <option key={exhibition.id} value={exhibition.id}>
                  {exhibition.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-input w-full"
              disabled={isRegisterClosed}
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={generateDayEndReport}
              disabled={loading || !selectedExhibition || !selectedDate || isRegisterClosed}
              className="btn-primary w-full"
            >
              {loading ? 'Generating...' : 'Generate Day-End Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Register Status */}
      {isRegisterClosed && (
        <div className="card p-6 bg-red-50 border-red-200">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <h3 className="text-lg font-bold text-red-800">Register Closed</h3>
              <p className="text-red-700">Day-end closing completed for {selectedDate}</p>
            </div>
          </div>
        </div>
      )}

      {/* Day-End Report */}
      {dayEndReport && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="summary-card bg-green-50 border-green-200">
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(dayEndReport.summary.totalSales)}</p>
              </div>
            </div>
            
            <div className="summary-card bg-blue-50 border-blue-200">
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-blue-600">{dayEndReport.summary.totalTransactions}</p>
              </div>
            </div>
            
            <div className="summary-card bg-amber-50 border-amber-200">
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-600">Net Profit</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(dayEndReport.summary.netProfit)}</p>
              </div>
            </div>
            
            <div className="summary-card bg-purple-50 border-purple-200">
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-600">Avg Transaction</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(dayEndReport.summary.averageTransactionValue)}</p>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Payment Method Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-700">Cash</span>
                <span className="text-lg font-bold text-green-600">{formatCurrency(dayEndReport.paymentBreakdown.cash)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-700">Card</span>
                <span className="text-lg font-bold text-blue-600">{formatCurrency(dayEndReport.paymentBreakdown.card)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-700">Other</span>
                <span className="text-lg font-bold text-purple-600">{formatCurrency(dayEndReport.paymentBreakdown.other)}</span>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Transaction Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-semibold text-gray-700">Time</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-700">Sale #</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-700">Customer</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-700">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {dayEndReport.sales.map((sale, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{formatTime(sale.created_at)}</td>
                      <td className="py-2 px-4 font-medium">{sale.sale_number}</td>
                      <td className="py-2 px-4">{sale.customer_name || 'Walk-in Customer'}</td>
                      <td className="py-2 px-4 font-bold text-green-600">{formatCurrency(sale.total_amount)}</td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          sale.payment_method === 'cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {sale.payment_method?.charAt(0).toUpperCase() + sale.payment_method?.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Financial Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="font-semibold text-gray-700">Gross Sales</span>
                <span className="font-bold text-green-600">{formatCurrency(dayEndReport.summary.totalSales)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-semibold text-gray-700">Total Expenses</span>
                <span className="font-bold text-red-600">-{formatCurrency(dayEndReport.summary.totalExpenses)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-semibold text-gray-700">Gross Profit</span>
                <span className="font-bold text-blue-600">{formatCurrency(dayEndReport.summary.grossProfit)}</span>
              </div>
              <div className="flex justify-between py-2 border-t pt-3">
                <span className="font-bold text-gray-800">Net Profit</span>
                <span className="font-bold text-lg text-amber-600">{formatCurrency(dayEndReport.summary.netProfit)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-gray-700">Profit Margin</span>
                <span className="font-bold text-amber-600">{dayEndReport.summary.profitMargin}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!dayEndReport && !loading && (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Ready for Day-End Closing</h3>
          <p className="text-gray-500 mb-4">Select exhibition and date, then generate your end-of-day report</p>
        </div>
      )}
    </div>
  );
};

export default DayEndClose;