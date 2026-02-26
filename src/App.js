import React, { useState, useEffect } from 'react';
import { PlusCircle, TrendingDown, TrendingUp, Wallet, PieChart, Calendar, DollarSign, Trash2, Download } from 'lucide-react';

// Transaction Class
class Transaction {
  constructor(id, date, category, amount, description, type) {
    this.id = id;
    this.date = date;
    this.category = category;
    this.amount = parseFloat(amount);
    this.description = description;
    this.type = type; // 'expense' or 'income'
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
}

const ExpenseTracker = () => {
  const [manager] = useState(() => new ExpenseManager());
  const [transactions, setTransactions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  
  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Food',
    amount: '',
    description: '',
    type: 'expense'
  });

  const categories = {
    expense: ['Food', 'Transportation', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Makeup Artist Education', 'Other'],
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

  const filteredTransactions = transactions.filter(t => {
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

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
            <div className="flex gap-4 px-6">
              {['dashboard', 'transactions'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-6 font-medium capitalize transition-all ${
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
                  {/* Expense Breakdown */}
                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <PieChart className="text-indigo-600" />
                      Expense Breakdown
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(expenseBreakdown).map(([category, amount]) => {
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
                      })}
                    </div>
                  </div>

                  {/* Income Breakdown */}
                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <DollarSign className="text-green-600" />
                      Income Sources
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(incomeBreakdown).map(([category, amount]) => {
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
                      })}
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
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
