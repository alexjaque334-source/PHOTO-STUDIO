import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Logo,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Button,
  Alert,
  ThemeToggle,
} from '@/design-system';
import { LogIn, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, verifyMfa, mfaRequired: contextMfaRequired } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mfaStep, setMfaStep] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (res.mfaRequired) {
        setMfaStep(true);
      } else {
        const customPath = (location.state as any)?.from?.pathname;
        const isAdminUser = res.user?.roles?.includes('admin') || email.toLowerCase().trim() === 'apacessoria25@gmail.com';
        if (customPath && customPath !== '/auth/login') {
          navigate(customPath, { replace: true });
        } else if (isAdminUser) {
          navigate('/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha na autenticação. Verifique suas credenciais.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await verifyMfa(mfaCode.trim());
      const customPath = (location.state as any)?.from?.pathname;
      const isAdminUser = email.toLowerCase().trim() === 'apacessoria25@gmail.com';
      if (customPath && customPath !== '/auth/login') {
        navigate(customPath, { replace: true });
      } else if (isAdminUser) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Código de autenticação em dois fatores inválido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <Link to="/" className="mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md">
            <Logo size="lg" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {mfaStep || contextMfaRequired ? 'Verificação em Dois Fatores' : 'Acesse seu Studio'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {mfaStep || contextMfaRequired
              ? 'Insira o código de 6 dígitos gerado pelo seu app autenticador.'
              : 'Entre com suas credenciais para continuar suas edições fotográficas.'}
          </p>
        </div>

        <Card className="border-border/80 shadow-xl">
          {errorMessage && (
            <div className="p-4 pb-0">
              <Alert variant="danger" onClose={() => setErrorMessage(null)}>
                {errorMessage}
              </Alert>
            </div>
          )}

          {mfaStep || contextMfaRequired ? (
            <form onSubmit={handleMfaSubmit}>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Conta protegida com autenticação de segundo fator (MFA)</span>
                </div>

                <Input
                  label="Código TOTP (6 dígitos)"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  required
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  helperText="Abra seu app autenticador (Google Authenticator, Authy, etc.)"
                />
              </CardContent>
              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isSubmitting}
                  loadingText="Validando código..."
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Confirmar e Entrar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    setMfaStep(false);
                    setErrorMessage(null);
                  }}
                >
                  Voltar para o Login
                </Button>
              </CardFooter>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit}>
              <CardContent className="space-y-4 pt-6">
                <Input
                  label="E-mail"
                  type="email"
                  placeholder="seu.email@exemplo.com.br"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <Input
                  label="Senha"
                  type="password"
                  placeholder="••••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <div className="flex items-center justify-end">
                  <Link
                    to="/auth/forgot-password"
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Esqueceu sua senha?
                  </Link>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isSubmitting}
                  loadingText="Autenticando..."
                  leftIcon={<LogIn className="h-4 w-4" />}
                >
                  Entrar no Studio
                </Button>
                <div className="text-center text-xs text-muted-foreground pt-2">
                  Ainda não tem conta?{' '}
                  <Link to="/auth/register" className="text-primary hover:underline font-bold">
                    Criar cadastro grátis
                  </Link>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
