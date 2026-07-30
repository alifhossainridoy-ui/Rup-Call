'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Phone } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import LeadCard from '@/components/LeadCard';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

export default function EmployeeDesk() {
  const { data: session, status } = useSession();
  const [leads, setLeads] = useState([]);
  const [followupCount, setFollowupCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const toast = useToast();

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (session?.user?.role !== 'EMPLOYEE') {
    redirect('/login');
  }

  // Load employee's active leads
  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leads/mine');
      if (!res.ok) throw new Error('Failed to load leads');
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      toast('লিড লোড ব্যর্থ', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load followup count
  const loadFollowupCount = useCallback(async () => {
    try {
      const res = await fetch('/api/leads/followups');
      if (res.ok) {
        const data = await res.json();
        setFollowupCount(data.followups?.length || 0);
      }
    } catch (err) {
      console.error('Failed to load followup count:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadLeads();
    loadFollowupCount();

    // Refresh every 10 seconds
    const interval = setInterval(() => {
      loadLeads();
      loadFollowupCount();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadLeads, loadFollowupCount]);

  const handleClaimNext = async () => {
    setClaiming(true);
    try {
      const res = await fetch('/api/leads/claim', { method: 'POST' });
      const data = await res.json();

      if (res.status === 204 || !data.lead) {
        toast('আর কোনো লিড নেই', 'info');
      } else if (res.ok) {
        setLeads((prev) => [data.lead, ...prev]);
        toast('নতুন লিড ক্লেইম করা হয়েছে', 'success');
      } else {
        toast(data.error || 'লিড ক্লেইম ব্যর্থ', 'error');
      }
    } catch (err) {
      toast('কিছু একটা ভুল হয়েছে', 'error');
    } finally {
      setClaiming(false);
    }
  };

  const handleStatusChange = async (leadId, statusData) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusData),
      });

      if (!res.ok) {
        const data = await res.json();
        toast(data.error || 'স্ট্যাটাস আপডেট ব্যর্থ', 'error');
        return;
      }

      const data = await res.json();
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? data.lead : l)).filter((l) => l.status !== 'CONFIRMED' && l.status !== 'CANCELLED')
      );
      toast('স্ট্যাটাস সেভ হয়েছে', 'success');
      loadFollowupCount();
    } catch (err) {
      toast('কিছু একটা ভুল হয়েছে', 'error');
    }
  };

  const handlePriceChange = async (leadId, priceData) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(priceData),
      });

      if (!res.ok) {
        const data = await res.json();
        toast(data.error || 'দাম আপডেট ব্যর্থ', 'error');
        return;
      }

      const data = await res.json();
      setLeads((prev) => prev.map((l) => (l.id === leadId ? data.lead : l)));
      toast('প্রাইস আপডেট হয়েছে', 'success');
    } catch (err) {
      toast('কিছু একটা ভুল হয়েছে', 'error');
    }
  };

  const handleRelease = async (leadId) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/release`, {
        method: 'PATCH',
      });

      if (!res.ok) {
        toast('লিড রিলিজ ব্যর্থ', 'error');
        return;
      }

      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      toast('লিড ছেড়ে দেওয়া হয়েছে', 'success');
    } catch (err) {
      toast('কিছু একটা ভুল হয়েছে', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 bg-white shadow-sm z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">আমার কল লিস্ট</h1>
            <p className="text-sm text-gray-600">{session?.user?.name}</p>
          </div>
          <div className="flex items-center gap-4">
            {followupCount > 0 && (
              <Link
                href="/employee/followups"
                className="relative flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition"
              >
                <span className="text-sm font-medium">ফলোআপ</span>
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {followupCount}
                </span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Claim Button */}
        <button
          onClick={handleClaimNext}
          disabled={claiming}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-4 px-6 rounded-lg transition flex items-center justify-center gap-2 mb-6 text-lg min-h-[56px]"
        >
          {claiming ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              লিড ক্লেইম হচ্ছে...
            </>
          ) : (
            <>
              <Phone size={20} />
              পরবর্তী লিড দিন
            </>
          )}
        </button>

        {/* Leads List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12">
            <Phone className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600 text-lg">আর কোনো লিড নেই</p>
            <p className="text-gray-500 text-sm mt-2">ডেস্কের সকল লিড সম্পন্ন হয়েছে</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onStatusChange={(statusData) => handleStatusChange(lead.id, statusData)}
                onPriceChange={(priceData) => handlePriceChange(lead.id, priceData)}
                onRelease={() => handleRelease(lead.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
