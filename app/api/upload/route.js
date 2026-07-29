import { NextResponse } from 'next/server';
import { createWriteStream, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import XLSX from 'xlsx';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const CHUNK_SIZE = 500;

// Utility functions (inlined to avoid import issues)
function normalizePhone(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let normalized = raw.trim();

  for (let i = 0; i < 10; i++) {
    normalized = normalized.replace(new RegExp(String.fromCharCode(0x09e6 + i), 'g'), String(i));
  }
  for (let i = 0; i < 10; i++) {
    normalized = normalized.replace(new RegExp(String.fromCharCode(0x0966 + i), 'g'), String(i));
  }

  normalized = normalized.replace(/\D/g, '');
  if (!normalized) return null;

  if (normalized.startsWith('880') && normalized.length === 13) {
    normalized = '0' + normalized.slice(3);
  } else if (normalized.startsWith('88') && normalized.length === 13) {
    normalized = '0' + normalized.slice(2);
  } else if (normalized.length === 10 && normalized.startsWith('1')) {
    normalized = '0' + normalized;
  } else if (!(normalized.length === 11 && normalized.startsWith('01'))) {
    return null;
  }

  if (!/^01[3-9]\d{8}$/.test(normalized)) return null;
  return normalized;
}

function parseDate(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return raw;

  const str = String(raw).trim();
  if (/^\d+$/.test(str)) {
    const serial = parseInt(str, 10);
    if (serial > 0) {
      const date = new Date((serial - 1) * 86400000 + Date.UTC(1900, 0, 1));
      const year = date.getUTCFullYear();
      if (year >= 1900 && year <= 2100) return date;
    }
    return null;
  }

  const match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const date = new Date(year, month - 1, day);
    if (date.getDate() !== day || date.getMonth() !== month - 1) return null;
    return date;
  }
  return null;
}

function parseAmount(raw) {
  if (raw === null || raw === undefined) return null;
  let str = String(raw).trim();

  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(String.fromCharCode(0x09e6 + i), 'g'), String(i));
  }
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(String.fromCharCode(0x0966 + i), 'g'), String(i));
  }

  str = str.replace(/[৳$€¥]/g, '').replace(/,/g, '').trim();
  const num = parseFloat(str);
  if (isNaN(num) || num <= 0) return null;
  return num;
}

function parseQty(raw) {
  if (raw === null || raw === undefined || raw === '') return 1;
  let str = String(raw).trim();

  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(String.fromCharCode(0x09e6 + i), 'g'), String(i));
  }

  const num = parseInt(str, 10);
  if (isNaN(num) || num <= 0) return 1;
  return num;
}

function computePriority({ amount, orderDate, qty }) {
  let score = 0;

  if (amount !== null && amount !== undefined) {
    if (amount >= 3000) score += 30;
    else if (amount >= 1500) score += 20;
    else if (amount >= 800) score += 10;
  }

  if (orderDate instanceof Date) {
    const daysAgo = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysAgo <= 90) score += 25;
    else if (daysAgo <= 180) score += 15;
    else if (daysAgo <= 365) score += 5;
  }

  if (qty !== null && qty !== undefined && qty >= 2) score += 10;
  return score;
}

const COLUMN_ALIASES = {
  name: ['name', 'customer', 'customer name', 'customername', 'নাম', 'গ্রাহক'],
  phone: ['phone', 'mobile', 'mobile no', 'contact', 'number', 'ফোন', 'মোবাইল'],
  address: ['address', 'location', 'ঠিকানা'],
  product: ['product', 'product name', 'item', 'order product', 'পণ্য'],
  date: ['order date', 'orderdate', 'date', 'তারিখ'],
  amount: ['amount', 'price', 'total', 'order amount', 'দাম', 'মূল্য'],
  qty: ['qty', 'quantity', 'pcs', 'পরিমাণ'],
  note: ['note', 'remarks', 'comment', 'নোট', 'মন্তব্য'],
};

function normalizeString(str) {
  if (!str) return '';
  return str.toLowerCase().trim().replace(/[\s_]+/g, '');
}

function buildColumnMap(headers) {
  const map = {};
  const unmappedColumns = [];

  headers.forEach((header, index) => {
    const normalized = normalizeString(header);
    if (!normalized) {
      unmappedColumns.push(header);
      return;
    }

    let found = false;
    for (const [fieldName, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.find(alias => normalizeString(alias) === normalized)) {
        map[fieldName] = index;
        found = true;
        break;
      }
    }
    if (!found) unmappedColumns.push(header);
  });

  return { map, unmappedColumns };
}

async function saveFile(file) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const tmpPath = join(tmpdir(), `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  return new Promise((resolve, reject) => {
    const stream = createWriteStream(tmpPath);
    stream.on('finish', () => resolve(tmpPath));
    stream.on('error', reject);
    stream.write(buffer);
    stream.end();
  });
}

async function processUploadBackground(batchId, rows, columnMap) {
  try {
    const batch = await prisma.uploadBatch.findUnique({ where: { id: batchId } });
    if (!batch) return;

    let totalProcessed = 0;
    let totalSkipped = 0;

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const validatedRows = [];

      for (const row of chunk) {
        const name = row[columnMap.map.name]?.toString().trim() || '';
        if (!name) {
          totalSkipped++;
          continue;
        }

        const phone = normalizePhone(row[columnMap.map.phone]);
        if (!phone) {
          totalSkipped++;
          continue;
        }

        const amount = columnMap.map.amount !== undefined ? parseAmount(row[columnMap.map.amount]) : null;
        const orderDate = columnMap.map.date !== undefined ? parseDate(row[columnMap.map.date]) : null;
        const qty = columnMap.map.qty !== undefined ? parseQty(row[columnMap.map.qty]) : 1;

        validatedRows.push({
          name,
          phone,
          address: columnMap.map.address !== undefined ? (row[columnMap.map.address]?.toString().trim() || null) : null,
          product: columnMap.map.product !== undefined ? (row[columnMap.map.product]?.toString().trim() || null) : null,
          orderDate,
          amount,
          qty,
          note: columnMap.map.note !== undefined ? (row[columnMap.map.note]?.toString().trim() || null) : null,
          priority: computePriority({ amount, orderDate, qty }),
        });
      }

      if (validatedRows.length === 0) continue;

      const uniquePhones = [...new Set(validatedRows.map(r => r.phone))];
      const customersData = validatedRows
        .filter((r, idx, arr) => arr.findIndex(x => x.phone === r.phone) === idx)
        .map(r => ({
          name: r.name,
          phone: r.phone,
          address: r.address,
          oldOrderProduct: r.product,
          oldOrderDate: r.orderDate,
          oldOrderAmount: r.amount,
          oldOrderQty: r.qty,
          extraNote: r.note,
        }));

      if (customersData.length > 0) {
        try {
          await prisma.customer.createMany({ data: customersData, skipDuplicates: true });
        } catch (err) {
          console.error('Error creating customers:', err);
        }
      }

      const customers = await prisma.customer.findMany({
        where: { phone: { in: uniquePhones } },
        select: { id: true, phone: true },
      });

      const phoneToCustomerId = Object.fromEntries(customers.map(c => [c.phone, c.id]));
      const existingLeads = await prisma.lead.findMany({
        where: {
          customer: { phone: { in: uniquePhones } },
          status: { in: ['NEW', 'CALLED_NO_ANSWER', 'CALLED_INTERESTED', 'CALLED_NOT_INTERESTED'] },
        },
        select: { customer: { select: { phone: true } } },
      });

      const existingPhones = new Set(existingLeads.map(l => l.customer.phone));
      const leadsData = validatedRows
        .filter(r => !existingPhones.has(r.phone))
        .map(r => ({
          customerId: phoneToCustomerId[r.phone],
          status: 'NEW',
          priority: r.priority,
          productPitched: r.product,
          confirmedAmount: null,
          batchId: batch.id,
        }));

      if (leadsData.length > 0) {
        try {
          await prisma.lead.createMany({ data: leadsData });
        } catch (err) {
          console.error('Error creating leads:', err);
        }
      }

      totalProcessed += leadsData.length;

      await prisma.uploadBatch.update({
        where: { id: batchId },
        data: {
          processedRows: totalProcessed,
          skippedRows: totalSkipped + (validatedRows.length - leadsData.length),
        },
      });
    }

    await prisma.uploadBatch.update({
      where: { id: batchId },
      data: { status: 'DONE' },
    });
  } catch (err) {
    console.error('Upload error:', err);
    await prisma.uploadBatch.update({
      where: { id: batchId },
      data: { status: 'FAILED', errorLog: err.message },
    }).catch(() => {});
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload .xlsx, .xls, or .csv' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 10MB` },
        { status: 400 }
      );
    }

    const tmpPath = await saveFile(file);

    let rows = [];
    try {
      const workbook = XLSX.readFile(tmpPath, { cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    } catch (err) {
      unlinkSync(tmpPath);
      return NextResponse.json(
        { error: `Failed to parse file: ${err.message}` },
        { status: 400 }
      );
    }

    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    const { map: columnMap, unmappedColumns } = buildColumnMap(headers);

    const batch = await prisma.uploadBatch.create({
      data: {
        fileName: file.name,
        status: 'PROCESSING',
        totalRows: rows.length,
        uploadedById: session.user.id,
        errorLog: unmappedColumns.length > 0 ? `Unmapped columns: ${unmappedColumns.join(', ')}` : null,
      },
    });

    unlinkSync(tmpPath);

    processUploadBackground(batch.id, rows, { map: columnMap }).catch(err => {
      console.error('Background upload error:', err);
    });

    return NextResponse.json({ batchId: batch.id }, { status: 202 });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
