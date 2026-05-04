import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { showError, showSuccess } from '../services/toastService';

interface Client {
  id: string;
  company_name: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'enterprise';
  status: 'lead' | 'prospect' | 'active' | 'inactive' | 'lost';
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  annual_revenue: number;
  contract_value: number;
  currency: string;
  created_at: string;
}

const Clients: React.FC = () => {
  const { profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  interface ClientFormData {
    company_name: string;
    industry: string;
    size: Client['size'];
    status: Client['status'];
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    annual_revenue: string;
    contract_value: string;
    currency: string;
  }

  const [formData, setFormData] = useState<ClientFormData>({
    company_name: '',
    industry: '',
    size: 'small',
    status: 'lead',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    annual_revenue: '',
    contract_value: '',
    currency: 'ZMW'
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      showError('Failed to load clients: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const clientData = {
        company_name: formData.company_name,
        industry: formData.industry,
        size: formData.size,
        status: formData.status,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        annual_revenue: parseFloat(formData.annual_revenue) || null,
        contract_value: parseFloat(formData.contract_value) || null,
        currency: formData.currency,
        created_by: profile?.id
      };

      if (editingId) {
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', editingId);

        if (error) throw error;
        showSuccess('Client updated successfully!');
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([clientData]);

        if (error) throw error;
        showSuccess('Client created successfully!');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        company_name: '',
        industry: '',
        size: 'small',
        status: 'lead',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        annual_revenue: '',
        contract_value: '',
        currency: 'ZMW'
      });
      fetchClients();
    } catch (error: any) {
      showError(`Failed to ${editingId ? 'update' : 'create'} client: ` + error.message);
    }
  };

  const handleEdit = (client: Client) => {
    setFormData({
      company_name: client.company_name,
      industry: client.industry,
      size: client.size,
      status: client.status,
      contact_name: client.contact_name,
      contact_email: client.contact_email,
      contact_phone: client.contact_phone,
      annual_revenue: client.annual_revenue.toString(),
      contract_value: client.contract_value.toString(),
      currency: client.currency
    });
    setEditingId(client.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showSuccess('Client deleted successfully!');
      fetchClients();
    } catch (error: any) {
      showError('Failed to delete client: ' + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      lead: 'bg-gray-100 text-gray-800',
      prospect: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-yellow-100 text-yellow-800',
      lost: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.lead;
  };

  const getSizeColor = (size: string) => {
    const colors = {
      startup: 'bg-purple-100 text-purple-800',
      small: 'bg-blue-100 text-blue-800',
      medium: 'bg-green-100 text-green-800',
      enterprise: 'bg-orange-100 text-orange-800'
    };
    return colors[size as keyof typeof colors] || colors.small;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading clients...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Clients</h1>
            <p className="subtitle">Manage and track all client relationships</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            {showForm ? 'Cancel' : '+ New Client'}
          </button>
        </div>

      {showForm && (
        <div className="analytics-card">
          <div className="card-header">
            <h3>{editingId ? 'Edit Client' : 'Create New Client'}</h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  placeholder="Technology, Healthcare, Finance..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company Size
                </label>
                <select
                  value={formData.size}
                  onChange={(e) => setFormData({...formData, size: e.target.value as any})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                >
                  <option value="startup">Startup (1-10 employees)</option>
                  <option value="small">Small (11-50 employees)</option>
                  <option value="medium">Medium (51-200 employees)</option>
                  <option value="enterprise">Enterprise (200+ employees)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                >
                  <option value="lead">Lead</option>
                  <option value="prospect">Prospect</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Annual Revenue
                </label>
                <input
                  type="number"
                  step="1000"
                  value={formData.annual_revenue}
                  onChange={(e) => setFormData({...formData, annual_revenue: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contract Value
                </label>
                <input
                  type="number"
                  step="1000"
                  value={formData.contract_value}
                  onChange={(e) => setFormData({...formData, contract_value: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({...formData, currency: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                >
                  <option value="ZMW">ZMW</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
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
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                {editingId ? 'Update Client' : 'Create Client'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="analytics-card">
        <div className="card-header">
          <h3>All Clients</h3>
        </div>
        {clients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <h4>No clients found</h4>
            <p>Create your first client to get started.</p>
          </div>
        ) : (
          <div className="clients-grid">
            {clients.map((client) => (
              <div key={client.id} className="client-card">
                <div className="client-header">
                  <h4 className="client-title">{client.company_name}</h4>
                  <div className="client-badges">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(client.status)}`}>
                      {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getSizeColor(client.size)}`}>
                      {client.size.charAt(0).toUpperCase() + client.size.slice(1)}
                    </span>
                  </div>
                </div>

                {client.industry && (
                  <p className="client-industry">{client.industry}</p>
                )}

                <div className="client-contact">
                  {client.contact_name && (
                    <div className="contact-item">
                      <span className="contact-icon">👤</span>
                      <span className="contact-text">{client.contact_name}</span>
                    </div>
                  )}
                  {client.contact_email && (
                    <div className="contact-item">
                      <span className="contact-icon">📧</span>
                      <span className="contact-text">{client.contact_email}</span>
                    </div>
                  )}
                  {client.contact_phone && (
                    <div className="contact-item">
                      <span className="contact-icon">📞</span>
                      <span className="contact-text">{client.contact_phone}</span>
                    </div>
                  )}
                </div>

                {(client.annual_revenue || client.contract_value) && (
                  <div className="client-financial">
                    {client.annual_revenue && (
                      <div className="financial-item">
                        <span className="financial-label">Annual Revenue</span>
                        <span className="financial-value">
                          {client.currency} {client.annual_revenue.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {client.contract_value && (
                      <div className="financial-item">
                        <span className="financial-label">Contract Value</span>
                        <span className="financial-value">
                          {client.currency} {client.contract_value.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => handleEdit(client)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
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

export default Clients;
