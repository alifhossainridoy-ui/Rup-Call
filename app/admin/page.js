'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import {
  Loader2,
  Search,
  ChevronRight,
  Briefcase,
  Users,
  BarChart3,
  ArrowUpDown,
  Plus,
  X,
} from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';
import { useToast } from '@/components/Toast';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const toast = useToast();

  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', password: '' });
  const [activeTab, setActiveTab] = useState('leads');

  const [filters, setFilters] = useState({
    status: null,
    employeeId: null,
    courierStatus: null,
    q: '',
  });

  const [pagination, setPagination] = useState({
    cursor: null,
    hasMore: false,
  });

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (session?.user?.role !== 'ADMIN') {
    redirect('/login');
  }

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Failed to load stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Stats load error:', err);
    }
  }, []);

  // Load leads
  const loadLeads = useCallback(async (cursor = null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cursor) params.set('cursor', cursor);
      if (filters.status) params.set('status', filters.status);
      if (filters.employeeId) params.set('employeeId', filters.employeeId);
      if (filters.courierStatus) params.set('courierStatus', filters.courierStatus);
      if (filters.q) params.set('q', filters.q);

      const res = await fetch(`/api/admin/leads?${params}`);
      if (!res.ok) throw new Error('Failed to load leads');
      const data = await res.json();
      setLeads(data.leads);
      setPagination({ cursor: data.nextCursor, hasMore: data.hasMore });
      setSelectedLeads(new Set());
    } catch (err) {
      toast('লিড লোড ব্যর্থ', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  // Load employees
  const loadEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/employees');
      if (!res.ok) throw new Error('Failed to load employees');
      const data = await res.json();
      setEmployees(data.employees);
    } catch (err) {
      toast('কর্মচারী লোড ব্যর্থ', 'error');
    }
  }, [toast]);

  useEffect(() => {
    loadStats();
    loadEmployees();
  }, [loadStats, loadEmployees]);

  useEffect(() => {
    setPagination({ cursor: null, hasMore: false });
    loadLeads(null);
  }, [filters, loadLeads]);

  const handleBulkAssign = async () => {
    if (selectedLeads.size === 0 || !selectedEmployee) {
      toast('কোন লিড নির্বাচন করুন', 'error');
      return;
    }

    try {
      const res = await fetch('/api/admin/leads/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: Array.from(selectedLeads),
          employeeId: selectedEmployee,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Assign failed');
      }

      const data = await res.json();
      toast(`${data.assigned} লিড বরাদ্দ করা হয়েছে`, 'success');
      setSelectedLeads(new Set());
      loadLeads(null);
    } catch (err) {
      toast(err.message || 'বরাদ্দ ব্যর্থ', 'error');
    }
  };

  const handleCreateEmployee = async () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.password) {
      toast('সব তথ্য পূরণ করুন', 'error');
      return;
    }

    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployee),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Creation failed');
      }

      toast('কর্মচারী তৈরি হয়েছে', 'success');
      setNewEmployee({ name: '', email: '', password: '' });
      setShowEmployeeForm(false);
      loadEmployees();
    } catch (err) {
      toast(err.message || 'তৈরি ব্যর্থ', 'error');
    }
  };

  const statusColors = {
    NEW: { text: '#8B7480', bg: '#F1EBEE' },
    CALLED_NO_ANSWER: { text: '#8A5A00', bg: '#FBEBD0' },
    CALLED_INTERESTED: { text: '#1F6D6D', bg: '#DDF0EF' },
    CALLED_NOT_INTERESTED: { text: '#99323B', bg: '#FBE1E3' },
    FOLLOW_UP_LATER: { text: '#4B3B86', bg: '#EBE6F9' },
    CONFIRMED: { text: '#1F6D46', bg: '#DCF3E6' },
    CANCELLED: { text: '#6b6b6b', bg: '#ECECEC' },
  };

  const courierColors = {
    NOT_SENT: { text: '#8B7480', bg: '#F1EBEE' },
    PENDING: { text: '#8A5A00', bg: '#FBEBD0' },
    SENDING: { text: '#8A5A00', bg: '#FBEBD0' },
    SENT: { text: '#1F6D6D', bg: '#DDF0EF' },
    DELIVERED: { text: '#1F6D46', bg: '#DCF3E6' },
    FAILED: { text: '#99323B', bg: '#FBE1E3' },
    RETURNED: { text: '#99323B', bg: '#FBE1E3' },
  };

  const courierLabels = {
    NOT_SENT: 'পাঠানো হয়নি',
    PENDING: 'অপেক্ষমাণ',
    SENDING: 'পাঠানো হচ্ছে',
    SENT: 'পাঠানো হয়েছে',
    DELIVERED: 'ডেলিভার্ড',
    FAILED: 'ব্যর্থ',
    RETURNED: 'রিটার্ন',
  };

  const handleCourierSync = async () => {
    toast('সিঙ্ক শুরু হচ্ছে...', 'info');
    try {
      const res = await fetch('/api/admin/courier-sync', { method: 'POST' });
      if (!res.ok) throw new Error('Sync failed');
      const data = await res.json();
      toast(`${data.updated} লিড আপডেট হয়েছে`, 'success');
      loadStats();
    } catch (err) {
      toast('সিঙ্ক ব্যর্থ', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Rup Call CRM</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{session?.user?.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">এডমিন ড্যাশবোর্ড</h2>

        {/* Stats Cards */}
        {stats && (
          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">মোট লিড</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalLeads}</p>
                  </div>
                  <BarChart3 className="text-blue-600" size={28} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">গ্রাহক</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalCustomers}</p>
                  </div>
                  <Users className="text-green-600" size={28} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">নতুন</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.leadsByStatus.NEW || 0}</p>
                  </div>
                  <Briefcase className="text-purple-600" size={28} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">নিশ্চিত</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.leadsByStatus.CONFIRMED || 0}
                    </p>
                  </div>
                  <Briefcase className="text-green-600" size={28} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">ডেলিভার্ড</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.leadsByStatus.DELIVERED || 0}</p>
                  </div>
                  <Briefcase className="text-green-600" size={28} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">রিটার্ন</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.leadsByStatus.RETURNED || 0}</p>
                  </div>
                  <Briefcase className="text-red-600" size={28} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">ডেলিভারি রেট</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {(() => {
                        const delivered = stats.leadsByStatus.DELIVERED || 0;
                        const returned = stats.leadsByStatus.RETURNED || 0;
                        const total = delivered + returned;
                        return total === 0 ? '0%' : `${Math.round((delivered / total) * 100)}%`;
                      })()}
                    </p>
                  </div>
                  <BarChart3 className="text-orange-600" size={28} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-2 font-medium border-b-2 ${
              activeTab === 'leads'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            লিড তালিকা
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-4 py-2 font-medium border-b-2 ${
              activeTab === 'employees'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            কর্মচারী
          </button>
        </div>

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
              <div className="flex gap-2 items-center">
                <Search size={20} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="নাম বা ফোন খুঁজুন..."
                  value={filters.q}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, q: e.target.value }))
                  }
                  className="flex-1 outline-none text-sm"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">লিড স্ট্যাটাস</p>
                <div className="flex flex-wrap gap-2">
                  {['NEW', 'CALLED_NO_ANSWER', 'CALLED_INTERESTED', 'FOLLOW_UP_LATER', 'CONFIRMED'].map((status) => (
                    <button
                      key={status}
                      onClick={() =>
                        setFilters((p) => ({
                          ...p,
                          status: p.status === status ? null : status,
                        }))
                      }
                      className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                        filters.status === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">কুরিয়ার স্ট্যাটাস</p>
                <div className="flex flex-wrap gap-2">
                  {['SENT', 'DELIVERED', 'FAILED', 'RETURNED'].map((status) => (
                    <button
                      key={status}
                      onClick={() =>
                        setFilters((p) => ({
                          ...p,
                          courierStatus: p.courierStatus === status ? null : status,
                        }))
                      }
                      className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                        filters.courierStatus === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {courierLabels[status]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Employee Filter and Bulk Assign */}
              <div className="flex gap-2 items-center flex-wrap">
                <select
                  value={filters.employeeId || ''}
                  onChange={(e) =>
                    setFilters((p) => ({
                      ...p,
                      employeeId: e.target.value || null,
                    }))
                  }
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg outline-none"
                >
                  <option value="">সব কর্মচারী</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.leadCount})
                    </option>
                  ))}
                </select>

                <select
                  value={selectedEmployee || ''}
                  onChange={(e) => setSelectedEmployee(e.target.value || null)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg outline-none"
                >
                  <option value="">বরাদ্দ করুন...</option>
                  {employees.filter((e) => e.active).map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleBulkAssign}
                  disabled={selectedLeads.size === 0}
                  className="px-4 py-1 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {selectedLeads.size > 0 ? `বরাদ্দ (${selectedLeads.size})` : 'বরাদ্দ'}
                </button>

                <button
                  onClick={handleCourierSync}
                  className="px-4 py-1 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  সিঙ্ক করুন
                </button>
              </div>
            </div>

            {/* Leads Table */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-blue-600" size={32} />
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12 text-gray-500">কোন লিড পাওয়া যায়নি</div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedLeads.size === leads.length && leads.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLeads(new Set(leads.map((l) => l.id)));
                            } else {
                              setSelectedLeads(new Set());
                            }
                          }}
                          className="rounded"
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">নাম</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">ফোন</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">স্ট্যাটাস</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">কুরিয়ার</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">বরাদ্দ</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">পরিমাণ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => {
                      const colors = statusColors[lead.status] || { text: '#666', bg: '#f0f0f0' };
                      return (
                        <tr key={lead.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedLeads.has(lead.id)}
                              onChange={(e) => {
                                const newSet = new Set(selectedLeads);
                                if (e.target.checked) {
                                  newSet.add(lead.id);
                                } else {
                                  newSet.delete(lead.id);
                                }
                                setSelectedLeads(newSet);
                              }}
                              className="rounded"
                            />
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {lead.customer.name}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{lead.customer.phone}</td>
                          <td className="px-4 py-3">
                            <span
                              style={{
                                color: colors.text,
                                backgroundColor: colors.bg,
                              }}
                              className="px-2 py-1 rounded-full text-xs font-medium"
                            >
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {(() => {
                              const courierStatus = lead.courierStatus || 'NOT_SENT';
                              const courierColor = courierColors[courierStatus];
                              return (
                                <div title={lead.courierError ? `Error: ${lead.courierError}` : ''}>
                                  <span
                                    style={{
                                      color: courierColor.text,
                                      backgroundColor: courierColor.bg,
                                    }}
                                    className="px-2 py-1 rounded-full text-xs font-medium"
                                  >
                                    {courierLabels[courierStatus] || courierStatus}
                                  </span>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {lead.assignedTo?.name || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-600">৳{lead.confirmedAmount || 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.hasMore && (
              <div className="flex justify-center">
                <button
                  onClick={() => loadLeads(pagination.cursor)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  আরও লোড করুন
                </button>
              </div>
            )}
          </div>
        )}

        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <div className="space-y-6">
            <button
              onClick={() => setShowEmployeeForm(!showEmployeeForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              নতুন কর্মচারী
            </button>

            {showEmployeeForm && (
              <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
                <input
                  type="text"
                  placeholder="নাম"
                  value={newEmployee.name}
                  onChange={(e) =>
                    setNewEmployee((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                />
                <input
                  type="email"
                  placeholder="ইমেইল"
                  value={newEmployee.email}
                  onChange={(e) =>
                    setNewEmployee((p) => ({ ...p, email: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                />
                <input
                  type="password"
                  placeholder="পাসওয়ার্ড"
                  value={newEmployee.password}
                  onChange={(e) =>
                    setNewEmployee((p) => ({ ...p, password: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateEmployee}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    সেভ করুন
                  </button>
                  <button
                    onClick={() => {
                      setShowEmployeeForm(false);
                      setNewEmployee({ name: '', email: '', password: '' });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400"
                  >
                    বাতিল
                  </button>
                </div>
              </div>
            )}

            {/* Employees List */}
            <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">নাম</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">ইমেইল</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">লিড সংখ্যা</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">স্ট্যাটাস</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{emp.name}</td>
                      <td className="px-4 py-3 text-gray-600">{emp.email}</td>
                      <td className="px-4 py-3 text-gray-600">{emp.leadCount || 0}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            emp.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {emp.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-blue-600 hover:text-blue-900">সম্পাদন</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
