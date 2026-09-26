# Rup Call CRM - Demo Script (স্ক্রিপ্ট)

## 11-Minute Demo Script

---

## **PART 1: Login & Overview (2 মিনিট)**

### Screen 1: Login Page
```
📍 URL: http://localhost:3000/login
📸 Show: Bangla login form with "Rup Call CRM" header

Script:
"আমরা Rup Call CRM সিস্টেম দেখছি - একটি কল সেন্টার 
CRM যা Order-to-Delivery পূর্ণ কর্মপ্রবাহ পরিচালনা করে।

আমি Admin হিসাবে লগইন করছি..."

Action: 
- Email: admin@rupzone.local
- Password: ChangeMe123!
- Click: "প্রবেশ করুন"
```

### Screen 2: Admin Dashboard
```
📍 URL: http://localhost:3000/admin
📸 Show: Dashboard with stat cards, filters, lead table

Script:
"এই হল Admin Dashboard। আমরা দেখতে পাচ্ছি:

✓ মোট লিড: 20
✓ গ্রাহক: 20  
✓ নতুন লিড: 5
✓ নিশ্চিত অর্ডার: 5
✓ ডেলিভারি রেট: 50% (5 ডেলিভার্ড, 0 রিটার্ন)

এখানে আমরা সব লিড পরিচালনা করি, কর্মচারী বরাদ্দ করি, 
এবং কুরিয়ার স্ট্যাটাস ট্র্যাক করি।"

Point out:
- Lead count stat cards
- Delivery rate percentage
- Lead table with courier status chips
```

---

## **PART 2: CSV Upload Demo (2 মিনিট)**

### Screen 3: Upload Page
```
📍 URL: http://localhost:3000/admin/upload
📸 Show: Drag-drop upload area, empty state

Script:
"Phase 1: CSV আপলোড। আমরা নতুন গ্রাহক তালিকা আমদানি করছি।

আমাদের সিস্টেম সমর্থন করে:
✓ Excel (.xlsx) এবং CSV ফরম্যাট
✓ স্বয়ংক্রিয় কলাম ম্যাপিং (নাম, ফোন, পণ্য, পরিমাণ)
✓ ফোন নম্বর নর্মালাইজেশন (Bengali, Devanagari, International)
✓ প্রাধান্য স্কোরিং (পরিমাণ, পুনরাবৃত্তি, তারিখ ভিত্তিক)

এখানে আমি demo-upload.csv ড্র্যাগ করছি..."

Action:
- Drag demo-upload.csv into upload area
- Show file selected
- Click: "আপলোড করুন"
- Wait for processing...
```

### Screen 4: Upload Progress
```
📍 Still on /admin/upload
📸 Show: Progress bar at ~50%, processing

Script:
"ফাইল প্রক্রিয়া হচ্ছে। সিস্টেম:
- প্রতিটি সারি পার্স করছে
- ফোন নম্বর যাচাই ও নর্মালাইজ করছে
- অনন্যতা চেক করছে (ডুপ্লিকেট এড়ানো)
- গ্রাহক ও লিড তৈরি করছে
- প্রাধান্য স্কোর গণনা করছে"

Wait for: Processing complete
```

### Screen 5: Upload Complete
```
📍 Still on /admin/upload
📸 Show: Success message, summary card, recent batches

Script:
"সম্পূর্ণ! 10টি নতুন লিড যোগ হয়েছে।

সারসংক্ষেপ:
✓ প্রক্রিয়াকৃত: 10
✓ স্কিপ করা: 0 (কোন ডুপ্লিকেট নেই)
✓ ত্রুটি: 0

এখন এই লিডগুলি কর্মচারীদের জন্য দাবির জন্য প্রস্তুত।"

Scroll down to show:
- Recent batches list
- File names, row counts, status
```

---

## **PART 3: Employee - Lead Claiming (2 মিনিট)**

### Screen 6: Employee Login
```
📍 URL: http://localhost:3000/login
📸 Show: Login form again

Script:
"এখন Employee দৃষ্টিকোণ থেকে দেখি। 
একজন কল সেন্টার এজেন্ট হিসাবে লগইন করছি..."

Action:
- Email: demo1@test.local
- Password: demo123
- Click: "প্রবেশ করুন"
```

### Screen 7: Employee Dashboard
```
📍 URL: http://localhost:3000/employee
📸 Show: "পরবর্তী লিড দিন" button, no leads yet

Script:
"এই হল Employee ড্যাশবোর্ড। 

'পরবর্তী লিড দিন' বাটন ক্লিক করলে:
✓ অগ্রাধিকার অনুযায়ী সর্বোচ্চ লিড বেছে নেয়
✓ Atomic database lock ব্যবহার করে (FOR UPDATE SKIP LOCKED)
✓ কোন duplicate assignment হয় না এমনকি concurrent access-এ
✓ 30 মিনিটের পর স্বয়ংক্রিয় আনলক

আগে যা চাই তার জন্য পণ্য নেই।"

Point: Stress the atomic nature
```

### Screen 8: Claim First Lead
```
📍 Still on /employee
📸 Show: First lead card after clicking button

Script:
"প্রথম লিড এসেছে! দেখুন কী তথ্য আমরা পাচ্ছি:

🔹 নাম: সালমান হোসেন
🔹 ফোন: 01713456701 (ক্লিকযোগ্য tel: লিংক)
🔹 স্ট্যাটাস: নতুন (নীল ব্যাজ)
🔹 লক সময়: এখনই লক করা হয়েছে
🔹 পূর্ববর্তী অর্ডার:
   - পণ্য: মোটরসাইকেল
   - তারিখ: 01/09/2026
   - পরিমাণ: ৳3,50,000
   - পরিমাণ: 2 ইউনিট

ক্রেতা এখন লক। কোন অন্য এজেন্ট এটি পাবে না।"

Point out:
- Lock mechanism
- Previous order context
- Phone is callable
```

---

## **PART 4: Status Update & Pricing (2 মিনিট)**

### Screen 9: Open Status Panel
```
📍 Still on Lead Card
📸 Show: Status panel opening

Script:
"এখন 'কল স্ট্যাটাস দিন' বাটন ক্লিক করছি..."

Action:
- Click: "কল স্ট্যাটাস দিন" button
- Wait for panel to expand
```

### Screen 10: Fill Status Form
```
📍 Lead Card status panel expanded
📸 Show: All status options, product field, note field

Script:
"Status পছন্দ করি। অপশন:

1️⃣ রিসিভ হয়নি (সাধারণ - নেটওয়ার্ক সমস্যা)
2️⃣ আগ্রহী (গরম লিড - এখনই করতে পারি)
3️⃣ আগ্রহী না (বাদ - সময় নষ্ট নয়)
4️⃣ পরে ফলোআপ (গরম - ৩/৭ দিন)
5️⃣ কনফার্ম (বন্ধ - ডেলিভারির জন্য প্রস্তুত)

এই লিডটি আগ্রহী লাগছে। 'আগ্রহী' নির্বাচন করছি।"

Action:
- Click: "আগ্রহী" button
- Point: Status buttons highlight
```

### Screen 11: Fill Product & Note
```
📍 Still in status panel
📸 Show: Product and note fields

Script:
"পণ্য এবং নোট যোগ করছি:

পণ্য: নতুন স্টুডেন্ট মডেল
নোট: আগামীকাল সিদ্ধান্ত নেবে"

Action:
- Click product input: "নতুন স্টুডেন্ট মডেল" টাইপ করুন
- Click note: "আগামীকাল সিদ্ধান্ত নেবে" টাইপ করুন
- Click: "সেভ করুন"
- Wait for success toast
```

### Screen 12: Price Update
```
📍 Back to Lead Card
📸 Show: Price section

Script:
"দাম আপডেট করছি। Inline edit:

পুরাতন দাম: নির্ধারিত নয়
নতুন দাম: ৳2,50,000 (এই ক্রেতার জন্য বিশেষ)"

Action:
- Click: ✏️ পেন্সিল আইকন
- Type: "250000"
- Click: ✓ চেকমার্ক
- Wait for success
```

---

## **PART 5: Courier Send (2 মিনিট)**

### Screen 13: Status = CONFIRMED
```
📍 Change lead status to CONFIRMED
📸 Show: Lead after status change

Script:
"এখন এই লিড একটি নিশ্চিত অর্ডার হয়ে গেছে।
কুরিয়ার বিভাগে পাঠানোর প্রস্তুতি।"

Action:
- Click "কল স্ট্যাটাস দিন" again
- Select "কনফার্ম"
- Save
- Wait for update
```

### Screen 14: Courier Send Button
```
📍 Lead Card updated
📸 Show: Green "কুরিয়ারে পাঠান" button

Script:
"Status = CONFIRMED এর পর:

✓ কুরিয়ার বিভাগ দেখা যায়
✓ Consignment ID নেই এখনও
✓ 'কুরিয়ারে পাঠান' বাটন সক্রিয়

কুরিয়ার সিস্টেম কী করে:
1. Invoice তৈরি করে (lead-id-attempt)
2. Status → SENDING
3. Steadfast API তে অর্ডার পাঠায়
4. সাফল্য: Consignment ID সংরক্ষণ করে
5. ব্যর্থতা: Error message দেখায়, retry করা যায়"

Action:
- Click: "কুরিয়ারে পাঠান"
- Show loading spinner
```

### Screen 15: Courier Sent Success
```
📍 Lead Card updated
📸 Show: Consignment ID, success message

Script:
"সাফল্য! লিড কুরিয়ারে গেছে।

ট্র্যাকিং তথ্য:
🚚 কুরিয়ার স্ট্যাটাস: পাঠানো হয়েছে (নীল ব্যাজ)
📦 কনসাইনমেন্ট ID: SIM-demo-{invoice}
📋 Invoice: lead-id-1 (attempt counter)

Test মোড দেখাচ্ছে: '(টেস্ট মোড)' সূচক

Real credentials থাকলে:
- Steadfast API তে সত্যিকারের অর্ডার
- আসল Consignment ID
- ট্র্যাকিং কোড পাওয়া যাবে"

Point:
- Copy button for consignment ID
- Simulated mode indicator
```

---

## **PART 6: Follow-up Queue (1 মিনিট)**

### Screen 16: Follow-ups Page
```
📍 URL: http://localhost:3000/employee/followups
📸 Show: Follow-up queue with sections

Script:
"Follow-up queue পৃষ্ঠায় যাচ্ছি।

এখানে কী কাজ করতে হবে সেই লিডগুলি দেখা যায়:

🔴 মিসড ফলোআপ (অতিরেক):
   - গত তারিখের ফলোআপ
   - আজই করতে হবে
   - ৩টি আছে

🔵 আজকের ফলোআপ:
   - আজকের কাজের জন্য
   - সময় মতো করতে হবে
   - ৫টি আছে"

Point:
- Visual separation (red vs blue)
- Sort order (priority + date)
- Count badges
```

---

## **PART 7: Admin Dashboard Deep Dive (2 মিনিট)**

### Screen 17: Admin Stats
```
📍 URL: http://localhost:3000/admin
📸 Show: Top stat cards

Script:
"Admin ড্যাশবোর্ডে ফিরে আসছি।

Stat Cards বলে দেয় আমরা কোথায় আছি:

📊 মোট লিড: 20
👥 গ্রাহক: 20
🆕 নতুন লিড: 5
✅ নিশ্চিত: 5
📦 ডেলিভার্ড: (courier status tracking)
🔄 ডেলিভারি রেট: % (সবচেয়ে গুরুত্বপূর্ণ মেট্রিক!)

ডেলিভারি রেট = Delivered ÷ (Delivered + Returned) × 100
এটি অপারেশন সাফল্যের সত্যিকারের পরিমাপ।"

Point:
- Real-time stats
- In-process cache (60s TTL)
- Delivery rate formula
```

### Screen 18: Filters & Search
```
📍 Still Admin Dashboard
📸 Show: Filter section

Script:
"Filters ব্যবহার করে precise search করতে পারি।

Lead স্ট্যাটাস: 'আগ্রহী' ক্লিক করছি
কুরিয়ার স্ট্যাটাস: 'পাঠানো হয়েছে' ক্লিক করছি
কর্মচারী: 'রহিম আহমেদ' বেছে নিচ্ছি

এখন শুধু:
- Status = CALLED_INTERESTED
- Courier Status = SENT  
- Employee = রহিম আহমেদ

এর লিড দেখা যাচ্ছে।"

Action:
- Click status filter
- Click courier filter
- Select employee
- Show filtered results
```

### Screen 19: Bulk Assign
```
📍 Still filtered view
📸 Show: Multi-select checkboxes

Script:
"Bulk Assignment: একসাথে অনেক লিড বরাদ্দ করি।

3টি লিড চেক করছি... 
কর্মচারী ড্রপডাউন: 'সুমাইয়া বেগম' নির্বাচন...
'বরাদ্দ (3)' ক্লিক..."

Action:
- Check 3 lead checkboxes
- Select employee from dropdown
- Click assign button
- Show success toast
- Refresh to show updated employee counts
```

### Screen 20: Courier Sync Button
```
📍 Still Admin Dashboard
📸 Show: "সিঙ্ক করুন" button

Script:
"'সিঙ্ক করুন' বাটন manual status update করে।

এটি কী করে:
1. Steadfast API তে query করে (100টি পর্যন্ত)
2. প্রতিটি order-এর status পায়
3. Database-এ update করে

Auto-sync runs every 2 hours (Vercel cron)
কিন্তু manual sync-এ immediateত ফলাফল পাই।"

Action:
- Click "সিঙ্ক করুন"
- Show loading
- Show success: "X লিড আপডেট হয়েছে"
```

---

## **PART 8: Employee Management (1 মিনিট)**

### Screen 21: Employee Tab
```
📍 Admin Dashboard → Employee Tab
📸 Show: Employee list

Script:
"Employee Management tab।

সব কর্মচারী:
- নাম
- ইমেইল
- তাদের লিড সংখ্যা
- Status (সক্রিয়/নিষ্ক্রিয়)

নতুন কর্মচারী যোগ করতে পারি:
'নতুন কর্মচারী' বাটন ক্লিক..."

Action:
- Click "নতুন কর্মচারী" button
- Show form
- Fill sample data (নাম, ইমেইল, পাসওয়ার্ড)
- Click সেভ
- Show employee added
```

---

## **Closing (30 সেকেন্ড)**

### Screen 22: Summary
```
📍 Any page
📸 Show: Browser with Rup Call visible

Script:
"সমাপনী - Rup Call CRM সিস্টেম সম্পূর্ণ order-to-delivery 
workflow পরিচালনা করে:

✅ Phase 1: Foundation (Auth, Schema, Middleware)
✅ Phase 2: CSV Upload (স্বয়ংক্রিয় column mapping + priority scoring)
✅ Phase 3: Employee Desk (Atomic lead claiming + status tracking)
✅ Phase 4: Admin Dashboard (Cursor pagination + bulk operations)
✅ Phase 5: Courier Integration (Steadfast + graceful degradation)

Performance:
✓ 10,000+ lead scale test করা হয়েছে
✓ Cursor-based pagination (efficient)
✓ In-process caching (60s TTL)
✓ Atomic operations (NO race conditions)

Ready for production deployment on Vercel.

ধন্যবাদ!"
```

---

## **Key Talking Points to Emphasize**

### Technical Excellence 🛠️
- **Atomic Lead Claiming:** `FOR UPDATE SKIP LOCKED` prevents duplicates
- **Cursor Pagination:** O(1) performance, not O(n) offset
- **Transaction Safety:** Price + PriceChangeLog together
- **Graceful Degradation:** Works offline with simulated mode

### Product Maturity 📦
- **5 Complete Phases** built and tested
- **20 API Endpoints** with role-based access
- **Bengali UI** from ground up (not translated)
- **Mobile-first Design** (48px buttons for thumb reach)

### Business Value 💼
- **Lead Lifecycle Tracking:** From NEW → CONFIRMED → DELIVERED
- **Delivery Rate Metrics:** Real-time success measurement
- **Employee Performance:** Per-person lead counts & status tracking
- **Bulk Operations:** Assign 500+ leads simultaneously

### Resilience 🛡️
- **Network Failure Safe:** Courier state never corrupts
- **Retry Mechanism:** New invoice per attempt (no double-billing)
- **Timeout Handling:** Auto-fail after 10 minutes of SENDING
- **Test Mode:** Full feature testing without real courier

---

## **Demo Time Budget**

| Part | Duration | Minutes |
|------|----------|---------|
| Login & Overview | 2 min | 2 |
| CSV Upload | 2 min | 4 |
| Employee Claiming | 2 min | 6 |
| Status & Pricing | 2 min | 8 |
| Courier Send | 2 min | 10 |
| Follow-ups | 1 min | 11 |
| Admin Dashboard | 2 min | 13 |
| Employee Mgmt | 1 min | 14 |
| Closing | 0.5 min | 14.5 |

**Total: ~14-15 minutes** (with explanation)
**Quick version: ~8 minutes** (just clicks, no talking)

---

**Ready? Let's demo!** 🎬
