'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { getServerSession } from 'next-auth/next';

export default function UploadPage() {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [batchId, setBatchId] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [recentBatches, setRecentBatches] = useState([]);

  // Load recent batches on mount
  useEffect(() => {
    loadRecentBatches();
  }, []);

  // Poll for progress
  useEffect(() => {
    if (!batchId || !uploading) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/upload/${batchId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(`Error: ${data.error}`);
          setUploading(false);
          return;
        }

        setProgress(data);

        if (data.status === 'DONE' || data.status === 'FAILED') {
          setUploading(false);
          clearInterval(interval);
          loadRecentBatches();
        }
      } catch (err) {
        setError(`Polling error: ${err.message}`);
        setUploading(false);
        clearInterval(interval);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [batchId, uploading]);

  async function loadRecentBatches() {
    try {
      // This would be a real API endpoint in production
      // For now, we'll skip it or create a separate endpoint
    } catch (err) {
      console.error('Error loading batches:', err);
    }
  }

  async function handleUpload(file) {
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];

    if (!validTypes.includes(file.type)) {
      setError('দয়করে .xlsx, .xls অথবা .csv ফাইল আপলোড করুন');
      return;
    }

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      setError(`ফাইল খুব বড়। সর্বোচ্চ ১০MB (আপনার ফাইল ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      return;
    }

    setUploading(true);
    setError('');
    setProgress(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(`আপলোড ব্যর্থ হয়েছে: ${data.error}`);
        setUploading(false);
        return;
      }

      setBatchId(data.batchId);
      setProgress({
        status: 'PROCESSING',
        totalRows: 0,
        processedRows: 0,
        skippedRows: 0,
      });
    } catch (err) {
      setError(`আপলোড ত্রুটি: ${err.message}`);
      setUploading(false);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUpload(files[0]);
    }
  }

  function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      handleUpload(files[0]);
    }
  }

  const progressPercent = progress && progress.totalRows > 0
    ? Math.round((progress.processedRows / progress.totalRows) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Rup Call CRM</h1>
          <span className="text-gray-700">এডমিন</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-8">ফাইল আপলোড করুন</h2>

        {/* Upload Zone */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />

            <Upload className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">ফাইল টেনে আনুন অথবা ক্লিক করুন</h3>
            <p className="text-gray-600 mb-4">.xlsx, .xls বা .csv ফাইল (সর্বোচ্চ ১০MB)</p>

            {uploading && (
              <div className="mt-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-blue-600 font-medium">প্রসেস হচ্ছে...</span>
                </div>

                {progress && (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {progress.processedRows} / {progress.totalRows} রো প্রসেস হয়েছে
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-8">
            {error}
          </div>
        )}

        {/* Success Summary */}
        {progress && !uploading && progress.status === 'DONE' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-green-900 mb-4">সফলভাবে যোগ হয়েছে</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded p-3">
                <p className="text-sm text-gray-600">মোট রো</p>
                <p className="text-2xl font-bold text-gray-900">{progress.totalRows}</p>
              </div>
              <div className="bg-white rounded p-3">
                <p className="text-sm text-gray-600">আমদানি</p>
                <p className="text-2xl font-bold text-green-600">{progress.processedRows}</p>
              </div>
              <div className="bg-white rounded p-3">
                <p className="text-sm text-gray-600">বাদ পড়েছে</p>
                <p className="text-2xl font-bold text-orange-600">{progress.skippedRows}</p>
              </div>
              <div className="bg-white rounded p-3">
                <p className="text-sm text-gray-600">সাফল্যের হার</p>
                <p className="text-2xl font-bold text-blue-600">{progressPercent}%</p>
              </div>
            </div>

            {progress.errorLog && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm font-medium text-yellow-900">সতর্কতা:</p>
                <p className="text-sm text-yellow-800">{progress.errorLog}</p>
              </div>
            )}
          </div>
        )}

        {progress && !uploading && progress.status === 'FAILED' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-red-900 mb-2">আপলোড ব্যর্থ হয়েছে</h3>
            {progress.errorLog && (
              <p className="text-sm text-red-800">{progress.errorLog}</p>
            )}
          </div>
        )}

        {/* File Format Help */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <FileSpreadsheet className="mr-2" size={20} />
            ফাইল ফরম্যাট নির্দেশিকা
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>সমর্থিত কলাম:</strong> নাম, ফোন/মোবাইল, ঠিকানা, পণ্য, অর্ডার তারিখ, দাম/মূল্য, পরিমাণ, নোট
            </p>
            <p>
              <strong>তারিখ ফরম্যাট:</strong> DD/MM/YYYY বা DD-MM-YYYY (যেমন: 15/07/2024)
            </p>
            <p>
              <strong>ফোন ফরম্যাট:</strong> যেকোনো বাংলাদেশী নম্বর (01712345678, +8801712345678, ইত্যাদি)
            </p>
            <p>
              <strong>সীমাবদ্ধতা:</strong> ডুপ্লিকেট গ্রাহক এবং খোলা লিড স্বয়ংক্রিয়ভাবে বাদ দেওয়া হয়
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
