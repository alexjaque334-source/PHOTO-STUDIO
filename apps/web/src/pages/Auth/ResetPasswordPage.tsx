import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
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
import { Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api-client';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage('Token de recuperação ausente ou inválido.');
      return;
    }

    if (password.length < 10) {
      setErrorMessage('A nova senha deve ter no mínimo 10 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('A confirmação não coincide com a nova senha.');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.auth.resetPassword(token, password);
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Token expirado ou inválido. Solicite um novo link.');
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Redefinir Senha</h1>
          <p className="text-xs text-muted-foreground">
            Escolha uma nova senha segura para sua conta.
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

          {isSuccess ? (
            <CardContent className="space-y-4 pt-6 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-base font-bold text-foreground">Senha Redefinida!</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sua senha foi atualizada com sucesso e todas as sessões anteriores foram encerradas por segurança.
              </p>
              <div className="pt-2">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => navigate('/auth/login')}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Fazer Login com a Nova Senha
                </Button>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-6">
                {!token && (
                  <Alert variant="warning">
                    Nenhum token foi detectado no link. Por favor, utilize o link recebido por e-mail.
                  </Alert>
                )}

                <Input
                  label="Nova Senha (mín. 10 caracteres)"
                  type="password"
                  placeholder="••••••••••"
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <Input
                  label="Confirmar Nova Senha"
                  type="password"
                  placeholder="••••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={!token}
                  isLoading={isSubmitting}
                  loadingText="Salvando nova senha..."
                  leftIcon={<Lock className="h-4 w-4" />}
                >
                  Salvar Nova Senha
                </Button>
                <div className="text-center text-xs text-muted-foreground pt-1">
                  <Link to="/auth/login" className="text-primary hover:underline font-medium">
                    Cancelar e Voltar
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
