'use client';

import { useState } from 'react';
import { Phone, Pencil, Check, Clock, Trash2 } from 'lucide-react';

const STATUS_COLORS = {
  NEW: { text: '#8B7480', bg: '#F1EBEE', ring: '#D9CBD1' },
  CALLED_NO_ANSWER: { text: '#8A5A00', bg: '#FBEBD0', ring: '#EFCB86' },
  CALLED_INTERESTED: { text: '#1F6D6D', bg: '#DDF0EF', ring: '#8FCFCC' },
  CALLED_NOT_INTERESTED: { text: '#99323B', bg: '#FBE1E3', ring: '#E9A4AA' },
  FOLLOW_UP_LATER: { text: '#4B3B86', bg: '#EBE6F9', ring: '#B7A8E8' },
  CONFIRMED: { text: '#1F6D46', bg: '#DCF3E6', ring: '#7FCBA3' },
  CANCELLED: { text: '#6b6b6b', bg: '#ECECEC', ring: '#cccccc' },
};

const STATUS_LABELS = {
  NEW: 'নতুন',
  CALLED_NO_ANSWER: 'রিসিভ হয়নি',
  CALLED_INTERESTED: 'আগ্রহী',
  CALLED_NOT_INTERESTED: 'আগ্রহী না',
  FOLLOW_UP_LATER: 'পরে ফলোআপ',
  CONFIRMED: 'কনফার্ম',
  CANCELLED: 'বাতিল',
};

export default function LeadCard({
  lead,
  onStatusChange,
  onPriceChange,
  onRelease,
  showLockTime = true,
}) {
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState(lead.confirmedAmount || '');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [productPitched, setProductPitched] = useState('');
  const [note, setNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [loading, setLoading] = useState(false);

  const colors = STATUS_COLORS[lead.status] || STATUS_COLORS.NEW;
  const firstInitial = lead.customer?.name?.charAt(0).toUpperCase() || '?';

  const handleStatusSubmit = async () => {
    if (!selectedStatus) return;
    if (selectedStatus === 'FOLLOW_UP_LATER' && !followUpDate) {
      alert('অনুগ্রহ করে ফলোআপের তারিখ নির্বাচন করুন');
      return;
    }

    setLoading(true);
    try {
      await onStatusChange({
        status: selectedStatus,
        productPitched,
        note,
        followUpAt: selectedStatus === 'FOLLOW_UP_LATER' ? followUpDate : undefined,
      });
      setShowStatusPanel(false);
      setSelectedStatus('');
      setProductPitched('');
      setNote('');
      setFollowUpDate('');
    } finally {
      setLoading(false);
    }
  };

  const handlePriceSave = async () => {
    if (!newPrice || isNaN(newPrice)) {
      alert('সঠিক দাম প্রবেশ করুন');
      return;
    }

    setLoading(true);
    try {
      await onPriceChange({ amount: parseFloat(newPrice) });
      setEditingPrice(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async () => {
    if (confirm('এই লিডটি ছেড়ে দিতে চান?')) {
      setLoading(true);
      try {
        await onRelease();
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div
      className="rounded-2xl shadow-sm hover:shadow-md transition border-2 p-4 mb-4"
      style={{ borderColor: colors.ring, backgroundColor: '#FFFFFF' }}
    >
      {/* Header: Avatar + Name + Phone */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
          style={{ backgroundColor: colors.text, color: '#FFFFFF' }}
        >
          {firstInitial}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-lg truncate">
            {lead.customer?.name}
          </h3>
          <a
            href={`tel:${lead.customer?.phone}`}
            className="text-lg font-semibold hover:underline text-blue-600 block truncate"
          >
            {lead.customer?.phone}
          </a>

          {/* Status badge + Lock time */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ color: colors.text, backgroundColor: colors.bg }}
            >
              {STATUS_LABELS[lead.status] || lead.status}
            </span>

            {showLockTime && lead.lockedAt && (
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <Clock size={12} />
                লক হয়েছে
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
        {lead.customer?.oldOrderProduct && (
          <p className="text-gray-900">
            <span className="font-medium">পণ্য:</span> {lead.customer.oldOrderProduct}
          </p>
        )}
        {lead.customer?.oldOrderDate && (
          <p className="text-gray-900">
            <span className="font-medium">তারিখ:</span>{' '}
            {new Date(lead.customer.oldOrderDate).toLocaleDateString('bn-BD')}
          </p>
        )}
        {lead.customer?.oldOrderQty && (
          <p className="text-gray-900">
            <span className="font-medium">পরিমাণ:</span> {lead.customer.oldOrderQty}
          </p>
        )}

        {/* Price with inline edit */}
        <div className="mt-2 flex items-center justify-between">
          {editingPrice ? (
            <div className="flex gap-2 flex-1">
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="flex-1 px-2 py-1 border rounded text-sm"
                placeholder="দাম"
                disabled={loading}
              />
              <button
                onClick={handlePriceSave}
                disabled={loading}
                className="p-1 text-green-600 hover:text-green-800"
              >
                <Check size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between flex-1">
              <span className="text-gray-900 font-medium">
                দাম: {lead.confirmedAmount || 'নির্ধারিত নয়'} ৳
              </span>
              <button
                onClick={() => setEditingPrice(true)}
                disabled={loading}
                className="p-1 text-blue-600 hover:text-blue-800"
              >
                <Pencil size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Panel */}
      {showStatusPanel ? (
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          {/* Status Buttons */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">কল স্ট্যাটাস</p>
            <div className="flex flex-wrap gap-2">
              {['CALLED_NO_ANSWER', 'CALLED_INTERESTED', 'CALLED_NOT_INTERESTED', 'FOLLOW_UP_LATER', 'CONFIRMED'].map(
                (s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedStatus(s)}
                    className={`px-3 py-2 rounded-full text-xs font-medium transition ${
                      selectedStatus === s
                        ? 'ring-2'
                        : 'bg-white border'
                    }`}
                    style={
                      selectedStatus === s
                        ? {
                            backgroundColor: STATUS_COLORS[s].bg,
                            color: STATUS_COLORS[s].text,
                            borderColor: STATUS_COLORS[s].ring,
                            borderWidth: '2px',
                          }
                        : { borderColor: '#ddd' }
                    }
                    disabled={loading}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Follow-up date if selected */}
          {selectedStatus === 'FOLLOW_UP_LATER' && (
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-700 block mb-2">
                কবে ফলোআপ করবেন?
              </label>
              <input
                type="datetime-local"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm mb-2"
                disabled={loading}
              />
              <div className="flex gap-2 flex-wrap text-xs">
                {[1, 3, 7].map((days) => (
                  <button
                    key={days}
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + days);
                      d.setHours(10, 0, 0, 0);
                      setFollowUpDate(d.toISOString().slice(0, 16));
                    }}
                    className="px-2 py-1 bg-white border rounded text-gray-700"
                    disabled={loading}
                  >
                    {days === 1 ? 'আগামীকাল' : `${days} দিন পর`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product input */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              কোন প্রোডাক্ট অফার করেছেন?
            </label>
            <input
              type="text"
              value={productPitched}
              onChange={(e) => setProductPitched(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="পণ্যের নাম"
              disabled={loading}
            />
          </div>

          {/* Note input */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-700 block mb-1">নোট</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="কল থেকে কোন নোট"
              rows={2}
              disabled={loading}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleStatusSubmit}
              disabled={!selectedStatus || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              সেভ করুন
            </button>
            <button
              onClick={() => setShowStatusPanel(false)}
              disabled={loading}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium py-2 px-4 rounded-lg transition"
            >
              বাতিল
            </button>
          </div>
        </div>
      ) : (
        /* Primary button to open status panel */
        <div className="flex gap-2">
          <button
            onClick={() => setShowStatusPanel(true)}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition min-h-[48px] flex items-center justify-center gap-2"
          >
            <Phone size={18} />
            কল স্ট্যাটাস দিন
          </button>
          <button
            onClick={handleRelease}
            disabled={loading}
            className="px-4 py-3 text-gray-600 hover:text-gray-900 transition min-h-[48px]"
            title="ছেড়ে দিন"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
