'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  { 
    icon: LayoutDashboard, 
    label: 'Insights', 
    path: '/admin/insights',
    tooltip: 'Dashboard'
  },
  { 
    icon: Settings, 
    label: 'Operations', 
    path: '/admin/operations',
    tooltip: 'Operations'
  },
  { 
    icon: Users, 
    label: 'Users', 
    path: '/admin/users',
    tooltip: 'Users'
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </ProtectedRoute>
  );
}

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`bg-gray-900 transition-all duration-300 flex flex-col ${
          isCollapsed ? 'w-12' : 'w-64'
        }`}
      >
        {/* Header with Toggle */}
        <div className="flex items-center justify-between py-4 px-1 md:px-3 border-b border-gray-800">
          {!isCollapsed && (
            <h1 className="text-lg font-semibold text-white">OpsList</h1>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-3 px-1 md:px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-1 md:px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.tooltip : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!isCollapsed && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section - Settings and Profile */}
        <div className="border-t border-gray-800 py-3 px-1 md:px-3 space-y-1">
          {/* Settings */}
          <button
            className={`w-full flex items-center gap-3 px-1 md:px-3 py-2.5 rounded-lg transition-all text-gray-400 hover:bg-gray-800 hover:text-white ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? 'Settings' : undefined}
          >
            <Settings size={20} className="flex-shrink-0" />
            {!isCollapsed && <span className="text-sm">Settings</span>}
          </button>

          {/* Profile Section */}
          <div className={`flex items-center gap-3 px-1 md:px-3 py-2.5 rounded-lg transition-all ${
            isCollapsed ? 'justify-center' : ''
          }`}>
            {isCollapsed ? (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                <User size={18} className="text-gray-400" />
              </div>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                  <User size={18} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@restaurant.com'}</p>
                </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

