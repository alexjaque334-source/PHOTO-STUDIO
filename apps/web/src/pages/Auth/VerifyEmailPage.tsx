import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Logo,
  Card,
  CardContent,
  Button,
  Spinner,
  Alert,
  ThemeToggle,
} from '@/design-system';
import { CheckCircle2, XCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const { refreshUser } = useAuth();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Token de validação não fornecido na URL.');
      return;
    }

    let isMounted = true;
    api.auth
      .verifyEmail(token)
      .then(async () => {
        if (!isMounted) return;
        setStatus('success');
        await refreshUser();
      })
      .catch((err) => {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(err.message || 'Token expirado ou inválido.');
      });

    return () => {
      isMounted = false;
    };
  }, [token, refreshUser]);

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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Verificação de E-mail</h1>
        </div>

        <Card className="border-border/80 shadow-xl">
          <CardContent className="space-y-6 pt-6 text-center">
            {status === 'verifying' && (
              <div className="py-8 space-y-4">
                <Spinner size="lg" className="mx-auto text-primary" />
                <p className="text-sm font-semibold text-foreground">Validando seu cadastro...</p>
                <p className="text-xs text-muted-foreground">Aguarde enquanto confirmamos sua conta com segurança.</p>
              </div>
            )}

            {status === 'success' && (
              <div className="py-4 space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-bold text-foreground">E-mail Confirmado com Sucesso!</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sua conta está totalmente ativada e pronta para uso profissional no Photo Studio AI.
                </p>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => navigate('/dashboard')}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Acessar meu Studio
                  </Button>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="py-4 space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                  <XCircle className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Falha na Verificação</h2>
                <Alert variant="danger">{errorMessage || 'Não foi possível validar seu e-mail.'}</Alert>
                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => navigate('/dashboard')}
                  >
                    Ir para o Dashboard
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
