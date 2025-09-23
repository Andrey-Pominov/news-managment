import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { isAuthenticated, user, logout, loading } = useAuth();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ru' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-2xl font-bold text-primary">
                NewsHub
              </Link>
              <div className="flex space-x-6">
                <Link
                  to="/"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive('/') ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {t('nav.home')}
                </Link>
                <Link
                  to="/admin"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive('/admin') ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {t('nav.admin')}
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated && user && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    disabled={loading}
                    className="flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t('auth.logout', 'Logout')}</span>
                  </Button>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={toggleLanguage}
                className="flex items-center space-x-2"
              >
                <Globe className="h-4 w-4" />
                <span>{i18n.language.toUpperCase()}</span>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
             2025NewsHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}