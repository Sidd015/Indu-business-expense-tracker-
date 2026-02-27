import React, { useState, useEffect } from 'react';
import { PlusCircle, TrendingDown, TrendingUp, Wallet, PieChart, Calendar, DollarSign, Trash2, Download, BarChart3, TrendingUp as TrendUp, Activity } from 'lucide-react';

// Transaction Class
class Transaction {
  constructor(id, date, category, amount, description, type) {
    this.id = id;
    this.date = date;
    this.category = category;
    this.amount = parseFloat(amount);
    this.description = description;
    this.type = type;
  }
}

// ExpenseManager Class
class ExpenseManager {
  constructor() {
    this.transactions = [];
  }

  addTransaction(transaction) {
    this.transactions.push(transaction);
  }

  deleteTransaction(id) {
    this.transactions = this.transactions.filter(t => t.id !== id);
  }

  getTransactionsByDateRange(startDate, endDate) {
    return this.transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= startDate && tDate <= endDate;
    });
  }

  getCategoryTotal(category, type = 'expense') {
    return this.transactions
      .filter(t => t.category === category && t.type === type)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getTotalByType(type) {
    return this.transactions
      .filter(t => t.type === type)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getCategoryBreakdown(type = 'expense') {
    const breakdown = {};
    this.transactions
      .filter(t => t.type === type)
      .forEach(t => {
        breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
      });
    return breakdown;
  }

  getMonthlyData() {
    const monthlyData = {};
    this.transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }
      monthlyData[monthKey][t.type] += t.amount;
    });
    return monthlyData;
  }

  getCategoryComparison() {
    const expenseBreakdown = this.getCategoryBreakdown('expense');
    const incomeBreakdown = this.getCategoryBreakdown('income');
    return { expenseBreakdown, incomeBreakdown };
  }

  getTopCategories(type = 'expense', limit = 5) {
    const breakdown = this.getCategoryBreakdown(type);
    return Object.entries(breakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);
  }

  getDailyAverage(type = 'expense') {
    if (this.transactions.length === 0) return 0;
    const dates = this.transactions
      .filter(t => t.type === type)
      .map(t => new Date(t.date).toDateString());
    const uniqueDays = new Set(dates).size;
    return uniqueDays > 0 ? this.getTotalByType(type) / uniqueDays : 0;
  }
}

const ExpenseTracker = () => {
  const [manager] = useState(() => new ExpenseManager());
  const [transactions, setTransactions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [analyticsFilter, setAnalyticsFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Food',
    amount: '',
    description: '',
    type: 'expense'
  });

  const categories = {
    expense: ['Food', 'Traveling', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Other'],
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other']
  };

  const categoryColors = {
    Food: '#FF6B6B',
    Transportation: '#4ECDC4',
    Shopping: '#FFE66D',
    Entertainment: '#95E1D3',
    Bills: '#F38181',
    Healthcare: '#AA96DA',
    Education: '#FCBAD3',
    Other: '#A8DADC',
    Salary: '#06D6A0',
    Freelance: '#118AB2',
    Investment: '#073B4C',
    Gift: '#EF476F'
  };

  useEffect(() => {
    const savedTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    savedTransactions.forEach(t => {
      manager.addTransaction(new Transaction(t.id, t.date, t.category, t.amount, t.description, t.type));
    });
    setTransactions(manager.transactions);
  }, [manager]);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newTransaction = new Transaction(
      Date.now(),
      formData.date,
      formData.category,
      formData.amount,
      formData.description,
      formData.type
    );
    manager.addTransaction(newTransaction);
    setTransactions([...manager.transactions]);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: formData.type === 'expense' ? 'Food' : 'Salary',
      amount: '',
      description: '',
      type: formData.type
    });
    setShowAddForm(false);
  };

  const handleDelete = (id) => {
    manager.deleteTransaction(id);
    setTransactions([...manager.transactions]);
  };

  const totalIncome = manager.getTotalByType('income');
  const totalExpense = manager.getTotalByType('expense');
  const balance = totalIncome - totalExpense;

  const expenseBreakdown = manager.getCategoryBreakdown('expense');
  const incomeBreakdown = manager.getCategoryBreakdown('income');
  const monthlyData = manager.getMonthlyData();
  const topExpenseCategories = manager.getTopCategories('expense', 5);
  const topIncomeCategories = manager.getTopCategories('income', 5);
  const dailyExpenseAvg = manager.getDailyAverage('expense');
  const dailyIncomeAvg = manager.getDailyAverage('income');

  const filteredTransactions = transactions.filter(t => {
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const getFilteredAnalytics = () => {
    if (analyticsFilter === 'all') return transactions;
    const now = new Date();
    const filtered = transactions.filter(t => {
      const tDate = new Date(t.date);
      if (analyticsFilter === '7days') {
        return (now - tDate) / (1000 * 60 * 60 * 24) <= 7;
      } else if (analyticsFilter === '30days') {
        return (now - tDate) / (1000 * 60 * 60 * 24) <= 30;
      } else if (analyticsFilter === '90days') {
        return (now - tDate) / (1000 * 60 * 60 * 24) <= 90;
      }
      return true;
    });
    return filtered;
  };

  const exportData = () => {
    const csv = [
      ['Date', 'Type', 'Category', 'Amount', 'Description'],
      ...transactions.map(t => [t.date, t.type, t.category, t.amount, t.description])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Expense Tracker
              </h1>
              <p className="text-gray-600 mt-1">Track your finances with ease</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-lg transition-all"
            >
              <PlusCircle size={20} />
              Add Transaction
            </button>
          </div>
        </div>

        {/* Add Transaction Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">New Transaction</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({
                    ...formData,
                    type: e.target.value,
                    category: e.target.value === 'expense' ? 'Food' : 'Salary'
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {categories[formData.type].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter description..."
                />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-lg hover:shadow-lg transition-all"
                >
                  Add Transaction
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-100 mb-1">Total Income</p>
                <p className="text-3xl font-bold">${totalIncome.toFixed(2)}</p>
              </div>
              <TrendingUp className="text-green-100" size={32} />
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-400 to-red-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-red-100 mb-1">Total Expenses</p>
                <p className="text-3xl font-bold">${totalExpense.toFixed(2)}</p>
              </div>
              <TrendingDown className="text-red-100" size={32} />
            </div>
          </div>
          <div className={`bg-gradient-to-br ${balance >= 0 ? 'from-blue-400 to-blue-600' : 'from-orange-400 to-orange-600'} rounded-2xl shadow-xl p-6 text-white`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 mb-1">Balance</p>
                <p className="text-3xl font-bold">${balance.toFixed(2)}</p>
              </div>
              <Wallet className="text-blue-100" size={32} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl mb-6">
          <div className="border-b border-gray-200">
            <div className="flex gap-4 px-6 overflow-x-auto">
              {['dashboard', 'analytics', 'transactions'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-6 font-medium capitalize transition-all whitespace-nowrap ${
                    activeTab === tab
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <PieChart className="text-indigo-600" />
                      Expense Breakdown
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(expenseBreakdown).length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No expense data yet</p>
                      ) : (
                        Object.entries(expenseBreakdown).map(([category, amount]) => {
                          const percentage = ((amount / totalExpense) * 100).toFixed(1);
                          return (
                            <div key={category}>
                              <div className="flex justify-between mb-1">
                                <span className="font-medium">{category}</span>
                                <span className="text-gray-600">${amount.toFixed(2)} ({percentage}%)</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                  className="h-3 rounded-full transition-all"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: categoryColors[category]
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <DollarSign className="text-green-600" />
                      Income Sources
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(incomeBreakdown).length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No income data yet</p>
                      ) : (
                        Object.entries(incomeBreakdown).map(([category, amount]) => {
                          const percentage = ((amount / totalIncome) * 100).toFixed(1);
                          return (
                            <div key={category}>
                              <div className="flex justify-between mb-1">
                                <span className="font-medium">{category}</span>
                                <span className="text-gray-600">${amount.toFixed(2)} ({percentage}%)</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                  className="h-3 rounded-full transition-all"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: categoryColors[category]
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-xl">
                    <p className="text-sm text-purple-700">Total Transactions</p>
                    <p className="text-2xl font-bold text-purple-900">{transactions.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-xl">
                    <p className="text-sm text-blue-700">Avg. Expense</p>
                    <p className="text-2xl font-bold text-blue-900">
                      ${transactions.filter(t => t.type === 'expense').length > 0
                        ? (totalExpense / transactions.filter(t => t.type === 'expense').length).toFixed(2)
                        : '0.00'}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-xl">
                    <p className="text-sm text-green-700">Categories</p>
                    <p className="text-2xl font-bold text-green-900">{Object.keys(expenseBreakdown).length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-pink-100 to-pink-200 p-4 rounded-xl">
                    <p className="text-sm text-pink-700">Savings Rate</p>
                    <p className="text-2xl font-bold text-pink-900">
                      {totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : '0'}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Filter Options */}
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <BarChart3 className="text-indigo-600" />
                    Advanced Analytics
                  </h3>
                  <select
                    value={analyticsFilter}
                    onChange={(e) => setAnalyticsFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Time</option>
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                  </select>
                </div>

                {/* Income vs Expense Comparison */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6">
                  <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Activity className="text-indigo-600" />
                    Income vs Expense Comparison
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl p-4 shadow-md">
                      <p className="text-sm text-gray-600 mb-2">Total Income</p>
                      <p className="text-3xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
                      <p className="text-sm text-gray-500 mt-2">Daily Avg: ${dailyIncomeAvg.toFixed(2)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-md">
                      <p className="text-sm text-gray-600 mb-2">Total Expense</p>
                      <p className="text-3xl font-bold text-red-600">${totalExpense.toFixed(2)}</p>
                      <p className="text-sm text-gray-500 mt-2">Daily Avg: ${dailyExpenseAvg.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {/* Visual Comparison Bar */}
                  <div className="mt-6">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-sm font-medium text-gray-600 w-20">Income</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-8 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-green-600 h-full flex items-center justify-end pr-3 text-white text-sm font-bold transition-all"
                          style={{ width: `${totalIncome > 0 ? 100 : 0}%` }}
                        >
                          100%
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-600 w-20">Expense</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-8 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-red-400 to-red-600 h-full flex items-center justify-end pr-3 text-white text-sm font-bold transition-all"
                          style={{ width: `${totalIncome > 0 ? (totalExpense / totalIncome * 100) : 0}%` }}
                        >
                          {totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Net Savings */}
                  <div className="mt-6 bg-white rounded-xl p-4 shadow-md">
                    <p className="text-sm text-gray-600 mb-2">Net Savings</p>
                    <p className={`text-3xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      ${balance.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {balance >= 0 ? '✅ Positive cash flow' : '⚠️ Spending more than earning'}
                    </p>
                  </div>
                </div>

                {/* Top Expense Categories */}
                <div className="bg-white rounded-2xl p-6 shadow-md">
                  <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <TrendDown className="text-red-600" />
                    Top 5 Expense Categories
                  </h4>
                  <div className="space-y-4">
                    {topExpenseCategories.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No expense data available</p>
                    ) : (
                      topExpenseCategories.map(([category, amount], index) => (
                        <div key={category} className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">{category}</span>
                              <span className="text-gray-600 font-bold">${amount.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="h-3 rounded-full transition-all"
                                style={{
                                  width: `${(amount / totalExpense * 100).toFixed(1)}%`,
                                  backgroundColor: categoryColors[category]
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-gray-500 w-16 text-right">
                            {((amount / totalExpense) * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Top Income Categories */}
                <div className="bg-white rounded-2xl p-6 shadow-md">
                  <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <TrendUp className="text-green-600" />
                    Top 5 Income Sources
                  </h4>
                  <div className="space-y-4">
                    {topIncomeCategories.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No income data available</p>
                    ) : (
                      topIncomeCategories.map(([category, amount], index) => (
                        <div key={category} className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">{category}</span>
                              <span className="text-gray-600 font-bold">${amount.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="h-3 rounded-full transition-all"
                                style={{
                                  width: `${(amount / totalIncome * 100).toFixed(1)}%`,
                                  backgroundColor: categoryColors[category]
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-gray-500 w-16 text-right">
                            {((amount / totalIncome) * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Category-wise Detailed Analysis */}
                <div className="bg-white rounded-2xl p-6 shadow-md">
                  <h4 className="text-xl font-bold mb-4">Category-wise Detailed Breakdown</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* All Expense Categories */}
                    <div>
                      <h5 className="font-semibold text-lg mb-3 text-red-600">All Expense Categories</h5>
                      <div className="space-y-3">
                        {Object.entries(expenseBreakdown).length === 0 ? (
                          <p className="text-gray-500 text-center py-4">No expenses yet</p>
                        ) : (
                          Object.entries(expenseBreakdown)
                            .sort(([, a], [, b]) => b - a)
                            .map(([category, amount]) => (
                              <div key={category} className="bg-red-50 p-3 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium flex items-center gap-2">
                                    <div 
                                      className="w-4 h-4 rounded-full" 
                                      style={{ backgroundColor: categoryColors[category] }}
                                    />
                                    {category}
                                  </span>
                                  <span className="font-bold text-red-600">${amount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                  <span>{transactions.filter(t => t.category === category && t.type === 'expense').length} transactions</span>
                                  <span>{((amount / totalExpense) * 100).toFixed(1)}% of total</span>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>

                    {/* All Income Categories */}
                    <div>
                      <h5 className="font-semibold text-lg mb-3 text-green-600">All Income Categories</h5>
                      <div className="space-y-3">
                        {Object.entries(incomeBreakdown).length === 0 ? (
                          <p className="text-gray-500 text-center py-4">No income yet</p>
                        ) : (
                          Object.entries(incomeBreakdown)
                            .sort(([, a], [, b]) => b - a)
                            .map(([category, amount]) => (
                              <div key={category} className="bg-green-50 p-3 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium flex items-center gap-2">
                                    <div 
                                      className="w-4 h-4 rounded-full" 
                                      style={{ backgroundColor: categoryColors[category] }}
                                    />
                                    {category}
                                  </span>
                                  <span className="font-bold text-green-600">${amount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                  <span>{transactions.filter(t => t.category === category && t.type === 'income').length} transactions</span>
                                  <span>{((amount / totalIncome) * 100).toFixed(1)}% of total</span>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Monthly Trends */}
                <div className="bg-white rounded-2xl p-6 shadow-md">
                  <h4 className="text-xl font-bold mb-4">Monthly Trends</h4>
                  <div className="space-y-4">
                    {Object.keys(monthlyData).length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No transaction data available</p>
                    ) : (
                      Object.entries(monthlyData)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .slice(0, 6)
                        .map(([month, data]) => {
                          const monthName = new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                          const netSavings = data.income - data.expense;
                          return (
                            <div key={month} className="bg-gray-50 p-4 rounded-xl">
                              <h5 className="font-semibold mb-3">{monthName}</h5>
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <p className="text-sm text-gray-600">Income</p>
                                  <p className="text-lg font-bold text-green-600">${data.income.toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Expense</p>
                                  <p className="text-lg font-bold text-red-600">${data.expense.toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Net</p>
                                  <p className={`text-lg font-bold ${netSavings >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                    ${netSavings.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* Key Insights */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
                  <h4 className="text-xl font-bold mb-4">💡 Key Insights</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">Expense-to-Income Ratio</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : 0}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {totalIncome > 0 && (totalExpense / totalIncome) < 0.7 
                          ? '✅ Great! You\'re saving well' 
                          : '⚠️ Try to reduce expenses'}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">Most Expensive Category</p>
                      <p className="text-2xl font-bold text-red-600">
                        {topExpenseCategories.length > 0 ? topExpenseCategories[0][0] : 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {topExpenseCategories.length > 0 
                          ? `$${topExpenseCategories[0][1].toFixed(2)} spent` 
                          : 'No data'}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">Primary Income Source</p>
                      <p className="text-2xl font-bold text-green-600">
                        {topIncomeCategories.length > 0 ? topIncomeCategories[0][0] : 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {topIncomeCategories.length > 0 
                          ? `$${topIncomeCategories[0][1].toFixed(2)} earned` 
                          : 'No data'}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">Average Transaction</p>
                      <p className="text-2xl font-bold text-purple-600">
                        ${transactions.length > 0 
                          ? ((totalIncome + totalExpense) / transactions.length).toFixed(2) 
                          : '0.00'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Per transaction value</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-3">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">All Types</option>
                      <option value="expense">Expenses</option>
                      <option value="income">Income</option>
                    </select>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">All Categories</option>
                      {[...categories.expense, ...categories.income].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={exportData}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                  >
                    <Download size={18} />
                    Export CSV
                  </button>
                </div>

                <div className="space-y-3">
                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
                      <p>No transactions yet. Start tracking your finances!</p>
                    </div>
                  ) : (
                    filteredTransactions.map(transaction => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: categoryColors[transaction.category] }}
                          >
                            {transaction.category[0]}
                          </div>
                          <div>
                            <p className="font-semibold">{transaction.category}</p>
                            <p className="text-sm text-gray-500">{transaction.description || 'No description'}</p>
                            <p className="text-xs text-gray-400">{transaction.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className={`text-xl font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                          </p>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;
