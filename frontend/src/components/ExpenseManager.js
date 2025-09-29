import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';
import './styles.css';

const ExpenseManager = () => {
  const { API } = useContext(AuthContext);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Expense categories with default amounts
  const expenseCategories = [
    { id: 'travel', name: 'Travel & Transport', icon: '🚗', defaultAmount: 50, color: 'bg-blue-100 text-blue-800' },
    { id: 'hotel', name: 'Hotel & Accommodation', icon: '🏨', defaultAmount: 200, color: 'bg-purple-100 text-purple-800' },
    { id: 'staff_salary', name: 'Staff Salary', icon: '👥', defaultAmount: 300, color: 'bg-green-100 text-green-800' },
    { id: 'meals', name: 'Meals & Food', icon: '🍽️', defaultAmount: 75, color: 'bg-yellow-100 text-yellow-800' },
    { id: 'materials', name: 'Materials & Supplies', icon: '📦', defaultAmount: 100, color: 'bg-red-100 text-red-800' },
    { id: 'marketing', name: 'Marketing & Promotion', icon: '📢', defaultAmount: 150, color: 'bg-indigo-100 text-indigo-800' },
    { id: 'utilities', name: 'Utilities & Bills', icon: '💡', defaultAmount: 80, color: 'bg-gray-100 text-gray-800' },
    { id: 'other', name: 'Other Expenses', icon: '💰', defaultAmount: 50, color: 'bg-pink-100 text-pink-800' }
  ];

  // Daily expense amounts for current date
  const [dailyExpenses, setDailyExpenses] = useState(() => {
    const savedExpenses = localStorage.getItem(`expenses_${selectedDate}`);
    if (savedExpenses) {
      return JSON.parse(savedExpenses);
    }
    
    // Initialize with default amounts
    const defaultExpenses = {};
    expenseCategories.forEach(cat => {
      defaultExpenses[cat.id] = {
        amount: 0,
        note: '',
        logged: false
      };
    });
    return defaultExpenses;
  });

  // Quick amount buttons
  const quickAmounts = [25, 50, 75, 100, 150, 200, 300, 500];

  useEffect(() => {
    loadDailyExpenses();
  }, [selectedDate]);

  const loadDailyExpenses = () => {
    const savedExpenses = localStorage.getItem(`expenses_${selectedDate}`);
    if (savedExpenses) {
      setDailyExpenses(JSON.parse(savedExpenses));
    } else {
      // Initialize with zeros for new date
      const defaultExpenses = {};
      expenseCategories.forEach(cat => {
        defaultExpenses[cat.id] = {
          amount: 0,
          note: '',
          logged: false
        };
      });
      setDailyExpenses(defaultExpenses);
    }
  };

  const saveDailyExpenses = (newExpenses) => {
    localStorage.setItem(`expenses_${selectedDate}`, JSON.stringify(newExpenses));
    setDailyExpenses(newExpenses);
  };

  const updateExpenseAmount = (categoryId, amount) => {
    const updatedExpenses = {
      ...dailyExpenses,
      [categoryId]: {
        ...dailyExpenses[categoryId],
        amount: parseFloat(amount) || 0
      }
    };
    saveDailyExpenses(updatedExpenses);
  };

  const updateExpenseNote = (categoryId, note) => {
    const updatedExpenses = {
      ...dailyExpenses,
      [categoryId]: {
        ...dailyExpenses[categoryId],
        note: note
      }
    };
    saveDailyExpenses(updatedExpenses);
  };

  const setQuickAmount = (categoryId, amount) => {
    updateExpenseAmount(categoryId, amount);
  };

  const logExpense = async (categoryId) => {
    const expense = dailyExpenses[categoryId];
    const category = expenseCategories.find(c => c.id === categoryId);
    
    if (expense.amount <= 0) {
      alert('Please enter an amount greater than 0');
      return;
    }

    try {
      // Here you would typically save to backend
      // await axios.post(`${API}/expenses`, {
      //   category: category.name,
      //   amount: expense.amount,
      //   note: expense.note,
      //   date: selectedDate
      // });

      const updatedExpenses = {
        ...dailyExpenses,
        [categoryId]: {
          ...dailyExpenses[categoryId],
          logged: true
        }
      };
      saveDailyExpenses(updatedExpenses);
      
      // Show success message
      alert(`${category.name} expense of ${formatCurrency(expense.amount)} logged successfully!`);
      
    } catch (error) {
      console.error('Error logging expense:', error);
      alert('Error logging expense. Please try again.');
    }
  };

  const getTotalExpenses = () => {
    return Object.values(dailyExpenses).reduce((total, expense) => total + expense.amount, 0);
  };

  const getLoggedExpenses = () => {
    return Object.values(dailyExpenses).filter(expense => expense.logged).reduce((total, expense) => total + expense.amount, 0);
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

  const getExpenseHistory = () => {
    const history = [];
    const keys = Object.keys(localStorage).filter(key => key.startsWith('expenses_'));
    
    keys.forEach(key => {
      const date = key.replace('expenses_', '');
      const expenses = JSON.parse(localStorage.getItem(key) || '{}');
      const total = Object.values(expenses).reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const loggedTotal = Object.values(expenses).filter(exp => exp.logged).reduce((sum, exp) => sum + (exp.amount || 0), 0);
      
      if (total > 0) {
        history.push({ date, total, loggedTotal, expenses });
      }
    });
    
    return history.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Expense Manager</h1>
          <p className="text-gray-600 mt-1">Track daily expenses easily with quick input</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-3">
        <div className="summary-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Planned</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(getTotalExpenses())}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Logged Expenses</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(getLoggedExpenses())}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Remaining</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(getTotalExpenses() - getLoggedExpenses())}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('daily')}
          className={`tab-button ${
            activeTab === 'daily' ? 'active' : 'inactive'
          }`}
        >
          Daily Input
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`tab-button ${
            activeTab === 'history' ? 'active' : 'inactive'
          }`}
        >
          History
        </button>
      </div>

      {/* Daily Input Tab */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Expenses for {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
          </div>

          <div className="grid-2 gap-6">
            {expenseCategories.map((category) => {
              const expense = dailyExpenses[category.id] || { amount: 0, note: '', logged: false };
              
              return (
                <div key={category.id} className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-800">{category.name}</h3>
                        <span className={`status-badge ${category.color} text-xs`}>
                          Default: {formatCurrency(category.defaultAmount)}
                        </span>
                      </div>
                    </div>
                    {expense.logged && (
                      <span className="text-green-600 text-sm font-semibold">✓ Logged</span>
                    )}
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Quick amounts:</p>
                    <div className="flex flex-wrap gap-2">
                      {quickAmounts.map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setQuickAmount(category.id, amount)}
                          className={`amount-btn ${
                            expense.amount === amount ? 'selected' : ''
                          }`}
                        >
                          {formatCurrency(amount)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Amount Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                    <input
                      type="number"
                      value={expense.amount || ''}
                      onChange={(e) => updateExpenseAmount(category.id, e.target.value)}
                      className="form-input"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  {/* Note Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Note (Optional)</label>
                    <input
                      type="text"
                      value={expense.note || ''}
                      onChange={(e) => updateExpenseNote(category.id, e.target.value)}
                      className="form-input"
                      placeholder="Add a note..."
                    />
                  </div>

                  {/* Log Button */}
                  <button
                    onClick={() => logExpense(category.id)}
                    disabled={expense.logged || expense.amount <= 0}
                    className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                      expense.logged 
                        ? 'bg-green-100 text-green-600 cursor-not-allowed'
                        : expense.amount > 0
                        ? 'btn-primary'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {expense.logged 
                      ? `Logged ${formatCurrency(expense.amount)}` 
                      : expense.amount > 0 
                      ? `Log ${formatCurrency(expense.amount)}`
                      : 'Enter amount to log'
                    }
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Expense History</h2>
          
          {getExpenseHistory().length > 0 ? (
            <div className="space-y-4">
              {getExpenseHistory().slice(0, 10).map((day) => (
                <div key={day.date} className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Total: {formatCurrency(day.total)} | Logged: {formatCurrency(day.loggedTotal)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-800">{formatCurrency(day.total)}</p>
                      <p className="text-sm text-green-600">{formatCurrency(day.loggedTotal)} logged</p>
                    </div>
                  </div>
                  
                  {/* Breakdown */}
                  <div className="grid-3 gap-4">
                    {Object.entries(day.expenses).map(([categoryId, expense]) => {
                      if (expense.amount > 0) {
                        const category = expenseCategories.find(c => c.id === categoryId);
                        return (
                          <div key={categoryId} className="text-sm">
                            <span className="text-xs">{category?.icon}</span>
                            <span className="ml-1 text-gray-700">{category?.name}:</span>
                            <span className={`ml-1 font-semibold ${
                              expense.logged ? 'text-green-600' : 'text-gray-600'
                            }`}>
                              {formatCurrency(expense.amount)}
                            </span>
                            {expense.logged && <span className="text-green-600 text-xs ml-1">✓</span>}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <span className="text-6xl mb-4 block">📊</span>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Expense History</h3>
              <p className="text-gray-500">Start logging daily expenses to see your history here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpenseManager;