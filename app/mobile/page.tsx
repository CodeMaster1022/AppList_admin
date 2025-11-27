'use client';

import { ClipboardList, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BottomNavigation from '@/components/mobile/BottomNavigation';

export default function MobileHomePage() {
  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-black">Restaurant App</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-black mb-6">Welcome</h2>
          
          <div className="space-y-4">
            <Link
              href="/mobile/checklist"
              className="flex items-center gap-4 p-4 bg-white border-2 border-black rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-3 bg-black rounded-lg">
                <ClipboardList size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-black text-lg">Checklist</h3>
                <p className="text-sm text-gray-600">View and complete daily activities</p>
              </div>
            </Link>

            <Link
              href="/mobile/profile"
              className="flex items-center gap-4 p-4 bg-white border-2 border-black rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-3 bg-black rounded-lg">
                <User size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-black text-lg">Profile</h3>
                <p className="text-sm text-gray-600">View your information</p>
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}

