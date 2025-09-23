import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from './LoginForm';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-600" />
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        {fallback || (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Authentication Required
              </h1>
              <p className="text-gray-600">
                You need to sign in to access this page.
              </p>
            </div>
            <LoginForm onSuccess={() => window.location.reload()} />
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}