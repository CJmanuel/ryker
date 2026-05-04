import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { showError, showSuccess } from '../services/toastService';

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'planning' | 'creative' | 'approval' | 'active' | 'completed' | 'paused';
  budget_total: number;
  budget_spent: number;
  budget_currency: string;
  start_date: string;
  end_date: string;
  channels: string[];
  created_at: string;
}

const Campaigns: React.FC = () => {
  const { profile } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  interface CampaignFormData {
    name: string;
    description: string;
    status: Campaign['status'];
    budget_total: string;
    budget_currency: string;
    start_date: string;
    end_date: string;
    channels: string;
  }

  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    status: 'draft',
    budget_total: '',
    budget_currency: 'ZMW',
    start_date: '',
    end_date: '',
    channels: ''
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      showError('Failed to load campaigns: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const campaignData = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        budget_total: parseFloat(formData.budget_total) || 0,
        budget_currency: formData.budget_currency,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        channels: formData.channels ? formData.channels.split(',').map(c => c.trim()) : [],
        created_by: profile?.id
      };

      if (editingId) {
        // Update existing campaign
        const { error } = await supabase
          .from('campaigns')
          .update(campaignData)
          .eq('id', editingId);

        if (error) throw error;
        showSuccess('Campaign updated successfully!');
      } else {
        // Create new campaign
        const { error } = await supabase
          .from('campaigns')
          .insert([campaignData]);

        if (error) throw error;
        showSuccess('Campaign created successfully!');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        status: 'draft',
        budget_total: '',
        budget_currency: 'ZMW',
        start_date: '',
        end_date: '',
        channels: ''
      });
      fetchCampaigns();
    } catch (error: any) {
      showError(`Failed to ${editingId ? 'update' : 'create'} campaign: ` + error.message);
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setFormData({
      name: campaign.name,
      description: campaign.description,
      status: campaign.status,
      budget_total: campaign.budget_total.toString(),
      budget_currency: campaign.budget_currency,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      channels: campaign.channels.join(', ')
    });
    setEditingId(campaign.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showSuccess('Campaign deleted successfully!');
      fetchCampaigns();
    } catch (error: any) {
      showError('Failed to delete campaign: ' + error.message);
    }
  };



  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading campaigns...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Campaigns</h1>
            <p className="subtitle">Manage and track all marketing campaigns</p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) {
                setEditingId(null);
                setFormData({
                  name: '',
                  description: '',
                  status: 'draft',
                  budget_total: '',
                  budget_currency: 'ZMW',
                  start_date: '',
                  end_date: '',
                  channels: ''
                });
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            {showForm ? 'Cancel' : '+ New Campaign'}
          </button>
        </div>

      {showForm && (
        <div className="analytics-card">
          <div className="card-header">
            <h3>{editingId ? 'Edit Campaign' : 'Create New Campaign'}</h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="planning">Planning</option>
                  <option value="creative">Creative</option>
                  <option value="approval">Approval</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Budget Total
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.budget_total}
                  onChange={(e) => setFormData({...formData, budget_total: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Currency
                </label>
                <select
                  value={formData.budget_currency}
                  onChange={(e) => setFormData({...formData, budget_currency: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="ZMW">ZMW</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Channels (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.channels}
                  onChange={(e) => setFormData({...formData, channels: e.target.value})}
                  placeholder="Facebook, Google, Instagram"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    name: '',
                    description: '',
                    status: 'draft',
                    budget_total: '',
                    budget_currency: 'ZMW',
                    start_date: '',
                    end_date: '',
                    channels: ''
                  });
                }}
                className="px-6 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                {editingId ? 'Update Campaign' : 'Create Campaign'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="analytics-card">
        <div className="card-header">
          <h3>All Campaigns</h3>
        </div>
        {campaigns.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h4>No campaigns found</h4>
            <p>Create your first campaign to get started.</p>
          </div>
        ) : (
          <div className="campaigns-grid">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="campaign-card">
                <div className="campaign-header">
                  <h4 className="campaign-title">{campaign.name}</h4>
                  <span className={`campaign-status ${campaign.status}`}>
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </span>
                </div>

                {campaign.description && (
                  <p className="campaign-client">{campaign.description}</p>
                )}

                <div className="campaign-budget">
                  <div>
                    <span className="text-sm text-gray-400">Budget</span>
                    <div className="text-lg font-semibold text-white">
                      {campaign.budget_currency} {campaign.budget_total.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">Spent</span>
                    <div className="text-lg font-semibold text-green-400">
                      {campaign.budget_currency} {campaign.budget_spent.toLocaleString()}
                    </div>
                  </div>
                </div>

                {campaign.channels && campaign.channels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {campaign.channels.slice(0, 3).map((channel, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-900 text-blue-200">
                        {channel}
                      </span>
                    ))}
                    {campaign.channels.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-700 text-gray-300">
                        +{campaign.channels.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="text-xs text-gray-400 mt-4">
                  {campaign.start_date && campaign.end_date
                    ? `${new Date(campaign.start_date).toLocaleDateString()} - ${new Date(campaign.end_date).toLocaleDateString()}`
                    : campaign.start_date
                    ? `Started: ${new Date(campaign.start_date).toLocaleDateString()}`
                    : 'No dates set'
                  }
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => handleEdit(campaign)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(campaign.id)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default Campaigns;
