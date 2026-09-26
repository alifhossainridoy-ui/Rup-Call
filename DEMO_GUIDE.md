# Rup Call CRM - Demo Guide (ডেমো গাইড)

## দ্রুত শুরু (Quick Start)

### 1. প্রয়োজনীয় প্যাকেজ ইনস্টল করুন
```bash
cd /home/user/Rup-Call
npm install
```

### 2. ডাটাবেস সেটআপ করুন (যদি এখনও সেটআপ না করা হয়)
```bash
# PostgreSQL চলাতে হবে localhost:5432-এ
npx prisma migrate dev
```

### 3. ডেমো ডাটা যোগ করুন
```bash
node scripts/demo-data.js
```

আউটপুট দেখুন:
```
✓ Created 3 demo employees
✓ Created 20 demo leads

📊 Demo Data Summary:
─────────────────────────────────
  NEW: 5
  CALLED_INTERESTED: 5
  CALLED_NO_ANSWER: 3
  FOLLOW_UP_LATER: 2
  CONFIRMED: 5
─────────────────────────────────

🎬 Demo data ready!

Login Credentials:
  Admin: admin@rupzone.local / ChangeMe123!
  Employee 1: demo1@test.local / demo123
  Employee 2: demo2@test.local / demo123
  Employee 3: demo3@test.local / demo123
```

### 4. ডেভেলপমেন্ট সার্ভার চালু করুন
```bash
npm run dev
```

ব্রাউজারে খুলুন: **http://localhost:3000**

---

## Demo Flow (ডেমো কর্মপ্রবাহ)

### **স্টেপ 1: Login (লগইন করুন)**

**অ্যাডমিন হিসাবে:**
- Email: `admin@rupzone.local`
- Password: `ChangeMe123!`
- ড্যাশবোর্ড দেখুন: মোট লিড, গ্রাহক, ডেলিভারি রেট

**কর্মচারী হিসাবে:**
- Email: `demo1@test.local`
- Password: `demo123`
- "আমার কল লিস্ট" পৃষ্ঠায় যান

---

### **স্টেপ 2: Admin - Upload পৃষ্ঠা (CSV আপলোড)**

পথ: `http://localhost:3000/admin/upload`

**কি করবেন:**
1. `test-data/demo-upload.csv` ফাইল ড্র্যাগ করুন
2. "আপলোড করুন" ক্লিক করুন
3. Progress bar দেখুন (সাধারণত ১-২ সেকেন্ড)
4. সাফল্য বার্তা দেখুন

**কি দেখতে পাবেন:**
- ফাইল নাম
- প্রসেস করা সারি সংখ্যা
- স্কিপ করা সারি (ডুপ্লিকেট ফোন)
- সম্পূর্ণ ব্যাচ তালিকা

---

### **স্টেপ 3: Employee - Lead Claiming (লিড দাবি করা)**

পথ: `http://localhost:3000/employee`

**কি করবেন:**
1. "পরবর্তী লিড দিন" বাটন ক্লিক করুন
2. Lead Card দেখুন:
   - নাম, ফোন
   - পূর্ববর্তী পণ্য ও তারিখ
   - পূর্ববর্তী পরিমাণ
   - স্ট্যাটাস ব্যাজ
   - লক সময় (মিনিটে)

3. "কল স্ট্যাটাস দিন" ক্লিক করুন

---

### **স্টেপ 4: Call Status Update (কল স্ট্যাটাস আপডেট করুন)**

একটি লিড খোলার পর, স্ট্যাটাস প্যানেল দেখুন:

**অপশন নির্বাচন করুন:**
- **রিসিভ হয়নি** (CALLED_NO_ANSWER)
- **আগ্রহী** (CALLED_INTERESTED)
- **আগ্রহী না** (CALLED_NOT_INTERESTED)
- **পরে ফলোআপ** (FOLLOW_UP_LATER) - তারিখ চয়ন করুন
- **কনফার্ম** (CONFIRMED) - দাম প্রবেश করুন

**উদাহরণ:**
1. "আগ্রহী" নির্বাচন করুন
2. পণ্য: "নতুন মোটরসাইকেল"
3. নোট: "পরশু সিদ্ধান্ত নেবে"
4. "সেভ করুন" ক্লিক করুন

---

### **স্টেপ 5: Price Management (দাম ব্যবস্থাপনা)**

Lead Card-এ "দাম" সেকশন:

**ইনলাইন এডিট:**
1. ✏️ আইকন ক্লিক করুন
2. নতুন পরিমাণ লিখুন (যেমন: ৩৫০০০)
3. ✓ চেকমার্ক ক্লিক করুন
4. সাফল্য বার্তা দেখুন

---

### **স্টেপ 6: Courier Send (কুরিয়ারে পাঠান)**

Status = **CONFIRMED** হলে:

1. "কুরিয়ারে পাঠান" বাটন দেখা যাবে (🚚 ট্রাক আইকন)
2. ক্লিক করলে:
   - Courier স্ট্যাটাস → SENDING
   - Invoice তৈরি হয় (যেমন: `lead-id-1`)
   - **Test Mode** (যখন Steadfast configured না):
     - সাফল্য: `SIM-{invoice}` সিমুলেটেড প্যাকেল
     - UI দেখায়: "কুরিয়ারে পাঠানো হয়েছে (টেস্ট মোড)"
   - **Real Mode** (যখন API credentials আছে):
     - Steadfast API তে অর্ডার পাঠায়
     - Consignment ID পায়
     - ট্র্যাকিং কোড সংরক্ষণ করে

3. কনসাইনমেন্ট ID দেখুন (কপি করুন বাটন সহ)
4. অ্যাডমিন ড্যাশবোর্ডে courier status দেখুন

---

### **স্টেপ 7: Follow-ups (ফলোআপ কিউ)**

পথ: `http://localhost:3000/employee/followups`

**কি দেখতে পাবেন:**
1. **মিসড ফলোআপ** (লাল) - অতীতের তারিখ
2. **আজকের ফলোআপ** (নীল) - আজকের কাজ

**কি করবেন:**
- প্রতিটি ফলোআপ কার্ড দেখুন
- অগ্রাধিকার অনুযায়ী সাজানো
- "কল স্ট্যাটাস দিন" বা "ছেড়ে দিন"

---

### **স্টেপ 8: Admin Dashboard (অ্যাডমিন ড্যাশবোর্ড)**

পথ: `http://localhost:3000/admin`

**Stat Cards দেখুন:**
1. **মোট লিড** - সব লিড সংখ্যা
2. **গ্রাহক** - অনন্য গ্রাহক
3. **নতুন** - NEW স্ট্যাটাস লিড
4. **নিশ্চিত** - CONFIRMED লিড
5. **ডেলিভার্ড** - ডেলিভার হওয়া প্যাকেল
6. **রিটার্ন** - রিটার্ন হওয়া প্যাকেল
7. **ডেলিভারি রেট** - % (delivered ÷ (delivered + returned) × 100)

**Lead তালিকা ফিল্টার করুন:**
1. **নাম/ফোন সার্চ**: "সালমান" লিখুন
2. **লিড স্ট্যাটাস**: "আগ্রহী" ক্লিক করুন
3. **কুরিয়ার স্ট্যাটাস**: "পাঠানো হয়েছে" ক্লিক করুন
4. **কর্মচারী ফিল্টার**: ড্রপডাউন থেকে নির্বাচন করুন

**Bulk Assign (একসাথে বরাদ্দ করুন):**
1. একাধিক লিড চেকবক্স নির্বাচন করুন
2. কর্মচারী ড্রপডাউনে নাম বেছে নিন
3. "বরাদ্দ" বাটন ক্লিক করুন
4. সাফল্য বার্তা দেখুন (যেমন: "5 লিড বরাদ্দ করা হয়েছে")

**Manual Courier Sync:**
1. "সিঙ্ক করুন" বাটন ক্লিক করুন
2. Steadfast এ SENT/PENDING লিড স্ট্যাটাস আপডেট হয়
3. টোস্ট: "X লিড আপডেট হয়েছে"

**Employee Management Tab:**
পথ: Admin Dashboard → কর্মচারী ট্যাব
1. সব কর্মচারী তালিকা দেখুন
2. প্রতিটির লিড সংখ্যা দেখুন
3. "নতুন কর্মচারী" যোগ করুন:
   - নাম, ইমেইল, পাসওয়ার্ড লিখুন
   - "সেভ করুন" ক্লিক করুন
   - নতুন লিড গণনা = 0 থেকে শুরু

---

## Demo Scenarios (ডেমো সিনারিও)

### **Scenario 1: পূর্ণ Order-to-Delivery Flow (৫ মিনিট)**

```
1. Admin → CSV আপলোড করুন
   ↓
2. Employee 1 → লিড দাবি করুন
   ↓
3. Employee 1 → স্ট্যাটাস: "আগ্রহী" → দাম: 50,000
   ↓
4. Employee 1 → কুরিয়ারে পাঠান (Test মোড: SIM-lead-1)
   ↓
5. Admin → সিঙ্ক করুন (স্ট্যাটাস: SENT → ডাটাবেসে আপডেট)
   ↓
6. Admin ড্যাশবোর্ড → ডেলিভারি রেট: 50% (1 sent, 0 returned)
```

### **Scenario 2: Bulk Assignment (৩ মিনিট)**

```
1. Admin ড্যাশবোর্ড → লিড তালিকা খুলুন
   ↓
2. স্ট্যাটাস ফিল্টার: "নতুন"
   ↓
3. 5টি লিড চেক করুন
   ↓
4. Employee 2 নির্বাচন করুন
   ↓
5. "বরাদ্দ (5)" ক্লিক করুন
   ↓
6. পুনরায় লোড করুন → Employee 2 লিড কাউন্ট বৃদ্ধি পেয়েছে
```

### **Scenario 3: Follow-up Queue Management (২ মিনিট)**

```
1. Employee 1 → ফলোআপ পৃষ্ঠা খুলুন
   ↓
2. "মিসড ফলোআপ" দেখুন (লাল)
   ↓
3. প্রথম কার্ড খুলুন → "কল স্ট্যাটাস দিন"
   ↓
4. স্ট্যাটাস: "আগ্রহী" → দাম: 75,000
   ↓
5. সেভ করুন → লিস্ট থেকে অপসরণ
   ↓
6. "আজকের ফলোআপ" দেখুন (নীল)
```

---

## Key Features Demo (মূল বৈশিষ্ট্য ডেমো)

| ফিচার | পথ | সময় | হাইলাইট |
|--------|-----|------|----------|
| **CSV Upload** | `/admin/upload` | 1 মিনিট | কলাম ম্যাপিং, ডুপ্লিকেট হ্যান্ডলিং |
| **Lead Claiming** | `/employee` | 2 মিনিট | Atomic FOR UPDATE SKIP LOCKED |
| **Status Tracking** | Lead Card | 1 মিনিট | কল লগ, মূল্য ট্র্যাকিং |
| **Courier Send** | Lead Card | 1 মিনিট | Test/Real মোড, Invoice generation |
| **Follow-ups** | `/employee/followups` | 2 মিনিট | Overdue/Today separation |
| **Admin Dashboard** | `/admin` | 3 মিনিট | Stats, Filters, Bulk Assign, Courier Sync |
| **Employee Mgmt** | `/admin` (Tab) | 1 মিনিট | Add/Edit employees, Lead count |

**মোট সময়: ১১ মিনিট**

---

## Credentials (প্রমাণপত্র)

### Admin Account
- **Email:** `admin@rupzone.local`
- **Password:** `ChangeMe123!`
- **Access:** সম্পূর্ণ সিস্টেম

### Demo Employees
| নাম | ইমেইল | পাসওয়ার্ড | লিড |
|-----|--------|-----------|-----|
| রহিম আহমেদ | demo1@test.local | demo123 | 7 |
| সুমাইয়া বেগম | demo2@test.local | demo123 | 6 |
| করিম খান | demo3@test.local | demo123 | 7 |

---

## Troubleshooting (সমস্যা সমাধান)

### "ডাটাবেস সংযোগ ব্যর্থ"
```bash
# PostgreSQL চলছে কিনা চেক করুন
psql -U postgres -d rupzone_crm -c "SELECT 1"
```

### "মডিউল পাওয়া যায়নি"
```bash
npm install
npx prisma generate
```

### "Port 3000 ব্যবহারে আছে"
```bash
PORT=3001 npm run dev
```

### "ডেমো ডাটা নেই"
```bash
node scripts/demo-data.js
```

---

## Performance Tips (কর্মক্ষমতা টিপস)

1. **Firefox/Chrome-এ ডেভেলপার টুলস খুলবেন না** (ধীর হয়)
2. **নেটওয়ার্ক ট্যাব বন্ধ রাখুন** দ্রুত প্রতিক্রিয়ার জন্য
3. **ডাটাবেস সংযোগ পুল**: Prisma স্বয়ংক্রিয়ভাবে পরিচালনা করে
4. **Cursor pagination** লক্ষ্য: 1000+ লিড দক্ষতার সাথে

---

## Next Steps (পরবর্তী পদক্ষেপ)

পণ্য চালু করার জন্য:

1. ✅ স্থানীয় ডেমো সম্পূর্ণ করুন
2. ☐ Real Steadfast API credentials যোগ করুন
3. ☐ Production ডাটাবেস সেটআপ করুন (AWS RDS)
4. ☐ Vercel-এ ডিপ্লয় করুন
5. ☐ কাস্টম ডোমেইন সেটআপ করুন
6. ☐ SSL/HTTPS সক্ষম করুন
7. ☐ ব্যাকআপ নীতি সেটআপ করুন

---

**প্রশ্ন? Issues?** GitHub repository দেখুন বা লগ চেক করুন।

Happy Demoing! 🎬
