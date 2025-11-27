import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['user']}>
      <div className="min-h-screen bg-white text-black">
        {children}
      </div>
    </ProtectedRoute>
  );
}

