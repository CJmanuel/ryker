import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { showError, showSuccess } from '../services/toastService';

interface Budget {
  id: string;
  name: string;
  type: 'client' | 'campaign' | 'department' | 'project';
  total_amount: number;
  currency: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'approved' | 'active' | 'completed';
  created_at: string;
}

const Budgets: React.FC = () => {
  const { profile } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  interface BudgetFormData {
    name: string;
    type: Budget['type'];
    total_amount: string;
    currency: string;
    start_date: string;
    end_date: string;
    status: Budget['status'];
  }

  const [formData, setFormData] = useState<BudgetFormData>({
    name: '',
    type: 'department',
    total_amount: '',
    currency: 'ZMW',
    start_date: '',
    end_date: '',
    status: 'draft'
  });

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBudgets(data || []);
    } catch (error: any) {
      showError('Failed to load budgets: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const budgetData = {
        name: formData.name,
        type: formData.type,
        total_amount: parseFloat(formData.total_amount),
        currency: formData.currency,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: formData.status,
        created_by: profile?.id
      };

      if (editingId) {
        const { error } = await supabase
          .from('budgets')
          .update(budgetData)
          .eq('id', editingId);

        if (error) throw error;
        showSuccess('Budget updated successfully!');
      } else {
        const { error } = await supabase
          .from('budgets')
          .insert([budgetData]);

        if (error) throw error;
        showSuccess('Budget created successfully!');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: '',
        type: 'department',
        total_amount: '',
        currency: 'ZMW',
        start_date: '',
        end_date: '',
        status: 'draft'
      });
      fetchBudgets();
    } catch (error: any) {
      showError(`Failed to ${editingId ? 'update' : 'create'} budget: ` + error.message);
    }
  };

  const handleEdit = (budget: Budget) => {
    setFormData({
      name: budget.name,
      type: budget.type,
      total_amount: budget.total_amount.toString(),
      currency: budget.currency,
      start_date: budget.start_date,
      end_date: budget.end_date,
      status: budget.status
    });
    setEditingId(budget.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showSuccess('Budget deleted successfully!');
      fetchBudgets();
    } catch (error: any) {
      showError('Failed to delete budget: ' + error.message);
    }
  };



  const calculateProgress = () => {
    // For now, we'll show a random progress. In a real app, this would be calculated from expenses
    const progress = Math.floor(Math.random() * 100);
    return progress;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading budgets...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Budgets</h1>
            <p className="subtitle">Manage and track all budget allocations</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            {showForm ? 'Cancel' : '+ New Budget'}
          </button>
        </div>

      {showForm && (
        <div className="analytics-card">
          <div className="card-header">
            <h3>{editingId ? 'Edit Budget' : 'Create New Budget'}</h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Budget Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Budget Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                >
                  <option value="department">Department</option>
                  <option value="client">Client</option>
                  <option value="campaign">Campaign</option>
                  <option value="project">Project</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Total Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({...formData, currency: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                >
                  <option value="ZMW">ZMW</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                {editingId ? 'Update Budget' : 'Create Budget'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="analytics-card">
        <div className="card-header">
          <h3>All Budgets</h3>
        </div>
        {budgets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <h4>No budgets found</h4>
            <p>Create your first budget to get started.</p>
          </div>
        ) : (
          <div className="budgets-grid">
            {budgets.map((budget) => {
              const progress = calculateProgress();
              return (
                <div key={budget.id} className="budget-card">
                  <div className="budget-header">
                    <h4 className="budget-title">{budget.name}</h4>
                    <div className="budget-badges">
                      <span className={`budget-type ${budget.type}`}>
                        {budget.type.charAt(0).toUpperCase() + budget.type.slice(1)}
                      </span>
                      <span className={`budget-status ${budget.status}`}>
                        {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="budget-amount">
                    {budget.currency} {budget.total_amount.toLocaleString()}
                  </div>

                  <div className="budget-progress">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Spent</span>
                      <span className="text-sm font-medium text-white">
                        {budget.currency} {(budget.total_amount * progress / 100).toLocaleString()} ({progress}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progress > 90 ? 'bg-red-500' :
                          progress > 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="budget-dates">
                    {new Date(budget.start_date).toLocaleDateString()} - {new Date(budget.end_date).toLocaleDateString()}
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
                    <button
                      onClick={() => handleEdit(budget)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 rounded transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default Budgets;
