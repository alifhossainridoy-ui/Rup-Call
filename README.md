# Rup Call CRM - Foundation Layer

A call-center CRM system built with Next.js 14, Prisma, PostgreSQL, and next-auth v4.

## Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: JavaScript (no TypeScript)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: next-auth v4 (Credentials provider, JWT strategy)
- **Styling**: Tailwind CSS
- **Password Hashing**: bcryptjs

## Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your database URL and nextauth secret.

3. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

4. **Run database migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Seed the database with demo accounts:**
   ```bash
   npm run prisma:seed
   ```

6. **Start development server:**
   ```bash
   npm run dev
   ```

## Demo Accounts

After seeding, you can log in with:

- **Admin**: `admin@rupzone.local` / `ChangeMe123!`
- **Employee**: `employee@rupzone.local` / `ChangeMe123!`

Change these by setting `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables before seeding.

## Features Implemented

### Foundation Layer (Complete)
- ✅ Prisma schema with all models (User, Customer, Lead, CallLog, PriceChangeLog, UploadBatch)
- ✅ PostgreSQL database setup
- ✅ next-auth v4 with Credentials provider and JWT strategy
- ✅ Role-based access control (ADMIN, EMPLOYEE)
- ✅ Middleware-based route protection
- ✅ Server-side guard helper for API routes
- ✅ Login page with Bengali UI
- ✅ Admin and Employee dashboard placeholders
- ✅ Logout functionality
- ✅ Database seeding with demo accounts

### Coming Later
- Upload batch management
- Lead assignment and locking
- Call logging interface
- Employee views and call lists
- Courier integration
- Admin dashboard and analytics

## File Structure

```
.
├── app/
│   ├── api/auth/[...nextauth]/route.js  # NextAuth handler
│   ├── admin/page.js                     # Admin dashboard
│   ├── employee/page.js                  # Employee dashboard
│   ├── login/page.js                     # Login form
│   ├── layout.js                         # Root layout
│   ├── globals.css                       # Global styles
│   └── page.js                           # Root redirect
├── components/
│   └── LogoutButton.js                   # Logout component
├── lib/
│   ├── auth.js                           # NextAuth config
│   ├── guard.js                          # Server-side guard
│   └── prisma.js                         # Prisma client
├── prisma/
│   ├── schema.prisma                     # Database schema
│   └── seed.js                           # Seed script
├── middleware.js                         # Route protection middleware
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Environment Variables

Required:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Your app URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET`: Random secret for JWT signing

Optional:
- `ADMIN_EMAIL`: Custom admin email (default: admin@rupzone.local)
- `ADMIN_PASSWORD`: Custom admin password (default: ChangeMe123!)

## Commands

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run lint`: Run ESLint
- `npm run prisma:migrate`: Run migrations
- `npm run prisma:seed`: Seed database

## Security Notes

- Always use a strong `NEXTAUTH_SECRET` in production
- Change default demo passwords before deploying
- Use `.env.local` (not .env) for sensitive values
- Enable HTTPS in production (required for secure cookies)

## Development Notes

- The middleware protects /admin/* and /employee/* routes
- Each API route should use the `requireRole()` guard from lib/guard.js
- JWT tokens carry user id, role, and active status
- Role-based redirects are enforced on both middleware and page levels