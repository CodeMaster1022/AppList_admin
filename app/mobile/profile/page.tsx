'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import BottomNavigation from '@/components/mobile/BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/mobile" className="p-2 text-black">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-black">Profile</h1>
        </div>
      </header>

      {/* Profile Content */}
      <main className="p-4">
        <div className="max-w-md mx-auto">
          {/* Profile Header */}
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-white text-3xl font-bold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-black mb-1">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
          </div>

          {/* Compliance Badge */}
          {user.compliance !== undefined && (
            <div className="mb-6 p-4 bg-gray-50 border-2 border-black rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-1">Compliance Rate</div>
              <div className="text-3xl font-bold text-black">{user.compliance}%</div>
            </div>
          )}

          {/* Information Cards */}
          <div className="space-y-3">
            {user.roleName && <InfoCard label="Role" value={user.roleName} />}
            {user.subArea && <InfoCard label="Sub-Area" value={user.subArea} />}
            {user.lane && <InfoCard label="Lane" value={user.lane} />}
            {user.phone && <InfoCard label="Phone" value={user.phone} />}
          </div>

          {/* Logout Button */}
          <div className="mt-6">
            <button
              onClick={logout}
              className="w-full py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-black rounded-lg p-4">
      <div className="text-xs text-gray-600 mb-1 uppercase tracking-wide">{label}</div>
      <div className="text-lg font-semibold text-black">{value}</div>
    </div>
  );
}

