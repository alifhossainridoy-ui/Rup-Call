import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Rup Call CRM</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{session.user.name}</span>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-8">এডমিন ড্যাশবোর্ড</h2>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-gray-600">
            স্বাগতম, {session.user.name}! এই ফাউন্ডেশন লেয়ার এখন প্রস্তুত।
          </p>
          <p className="text-sm text-gray-500 mt-2">
            পরবর্তী ফেজে আপলোড, ড্যাশবোর্ড এবং কর্মচারী ভিউ যুক্ত হবে।
          </p>
        </div>
      </main>
    </div>
  );
}
