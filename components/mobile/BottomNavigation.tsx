'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, User } from 'lucide-react';

export default function BottomNavigation() {
  const pathname = usePathname();

  const menuItems = [
    {
      icon: ClipboardList,
      label: 'Checklist',
      path: '/mobile/checklist'
    },
    {
      icon: User,
      label: 'Profile',
      path: '/mobile/profile'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-black' : 'text-gray-400'
              }`}
            >
              <Icon size={24} className={isActive ? 'text-black' : 'text-gray-400'} />
              <span className={`text-xs mt-1 font-medium ${isActive ? 'text-black' : 'text-gray-400'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

