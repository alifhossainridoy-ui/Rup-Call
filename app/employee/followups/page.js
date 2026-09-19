'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import LeadCard from '@/components/LeadCard';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

export default function FollowupsPage() {
  const { data: session, status } = useSession();
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const loadFollowups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leads/followups');
      if (!res.ok) throw new Error('Failed to load followups');
      const data = await res.json();
      setFollowups(data.followups || []);
    } catch (err) {
      toast('ফলোআপ লোড ব্যর্থ', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadFollowups();

    // Refresh every 30 seconds
    const interval = setInterval(loadFollowups, 30000);
    return () => clearInterval(interval);
  }, [loadFollowups]);

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

      setFollowups((prev) => prev.filter((l) => l.id !== leadId));
      toast('স্ট্যাটাস সেভ হয়েছে', 'success');
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
        toast('দাম আপডেট ব্যর্থ', 'error');
        return;
      }

      const data = await res.json();
      setFollowups((prev) => prev.map((l) => (l.id === leadId ? data.lead : l)));
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

      setFollowups((prev) => prev.filter((l) => l.id !== leadId));
      toast('লিড ছেড়ে দেওয়া হয়েছে', 'success');
    } catch (err) {
      toast('কিছু একটা ভুল হয়েছে', 'error');
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueFollowups = followups.filter(
    (f) => new Date(f.followUpAt) < today
  );
  const todayFollowups = followups.filter(
    (f) => new Date(f.followUpAt) >= today
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 bg-white shadow-sm z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/employee"
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">আজকের ফলোআপ</h1>
              <p className="text-sm text-gray-600">মোট {followups.length} টি ফলোআপ</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : followups.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto mb-4 text-green-400" size={48} />
            <p className="text-gray-600 text-lg">আজ কোনো ফলোআপ নেই</p>
            <p className="text-gray-500 text-sm mt-2">সব ফলোআপ সম্পন্ন হয়েছে</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overdue Section */}
            {overdueFollowups.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-red-200">
                  <AlertCircle size={18} className="text-red-600" />
                  <h2 className="font-bold text-gray-900">মিসড ফলোআপ ({overdueFollowups.length})</h2>
                </div>
                <div className="space-y-4">
                  {overdueFollowups.map((lead) => (
                    <div key={lead.id} className="opacity-75">
                      <LeadCard
                        lead={lead}
                        onStatusChange={(statusData) => handleStatusChange(lead.id, statusData)}
                        onPriceChange={(priceData) => handlePriceChange(lead.id, priceData)}
                        onRelease={() => handleRelease(lead.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Today's Follow-ups Section */}
            {todayFollowups.length > 0 && (
              <div>
                <h2 className="font-bold text-gray-900 mb-3 pb-2 border-b-2 border-blue-200">
                  আজকের ফলোআপ ({todayFollowups.length})
                </h2>
                <div className="space-y-4">
                  {todayFollowups.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onStatusChange={(statusData) => handleStatusChange(lead.id, statusData)}
                      onPriceChange={(priceData) => handlePriceChange(lead.id, priceData)}
                      onRelease={() => handleRelease(lead.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
