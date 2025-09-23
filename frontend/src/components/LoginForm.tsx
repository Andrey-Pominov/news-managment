import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoginRequest } from '../types/auth';

interface LoginFormProps {
  onSuccess?: () => void;
  showRegister?: boolean;
  onToggleRegister?: () => void;
}

export default function LoginForm({ onSuccess, showRegister = false, onToggleRegister }: LoginFormProps) {
  const { t } = useTranslation();
  const { login, loading, error, clearError } = useAuth();

  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = t('auth.emailRequired', 'Email is required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = t('auth.emailInvalid', 'Email is invalid');
    }

    if (!formData.password) {
      errors.password = t('auth.passwordRequired', 'Password is required');
    } else if (formData.password.length < 6) {
      errors.password = t('auth.passwordMinLength', 'Password must be at least 6 characters');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await login(formData);
      onSuccess?.();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleInputChange = (field: keyof LoginRequest, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          {t('auth.signIn', 'Sign In')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-md">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">
              {t('auth.email', 'Email')}
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder={t('auth.emailPlaceholder', 'Enter your email')}
              className={validationErrors.email ? 'border-red-500' : ''}
              disabled={loading}
            />
            {validationErrors.email && (
              <p className="text-sm text-red-600">{validationErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {t('auth.password', 'Password')}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
                className={validationErrors.password ? 'border-red-500 pr-10' : 'pr-10'}
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
            {validationErrors.password && (
              <p className="text-sm text-red-600">{validationErrors.password}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
              className="rounded border-gray-300"
              disabled={loading}
            />
            <Label htmlFor="rememberMe" className="text-sm">
              {t('auth.rememberMe', 'Remember me')}
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('auth.signingIn', 'Signing in...')}
              </>
            ) : (
              t('auth.signIn', 'Sign In')
            )}
          </Button>

          {showRegister && onToggleRegister && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {t('auth.noAccount', "Don't have an account?")}{' '}
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto font-normal"
                  onClick={onToggleRegister}
                  disabled={loading}
                >
                  {t('auth.signUp', 'Sign up')}
                </Button>
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}