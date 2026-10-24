import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { KeyRound, ArrowLeft, MailCheck } from 'lucide-react';
import { api } from '@/lib/api-client';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await api.auth.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err: any) {
      // Por segurança contra enumeração, tratamos com sucesso genérico ou mensagem amigável
      setSubmitted(true);
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Recuperação de Senha</h1>
          <p className="text-xs text-muted-foreground">
            Enviaremos instruções seguras para redefinir seu acesso ao estúdio.
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

          {submitted ? (
            <CardContent className="space-y-4 pt-6 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <MailCheck className="h-6 w-6" />
              </div>
              <h2 className="text-base font-bold text-foreground">Verifique sua Caixa de Entrada</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Se o endereço <strong className="text-foreground">{email}</strong> estiver cadastrado em nossa base, você receberá um link de redefinição de senha em instantes.
              </p>
              <div className="pt-2">
                <Link to="/auth/login">
                  <Button variant="outline" fullWidth leftIcon={<ArrowLeft className="h-4 w-4" />}>
                    Voltar para o Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-6">
                <Input
                  label="E-mail Cadastrado"
                  type="email"
                  placeholder="seu.email@exemplo.com.br"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  helperText="Insira o e-mail associado à sua conta ALEGON"
                />
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isSubmitting}
                  loadingText="Enviando instruções..."
                  leftIcon={<KeyRound className="h-4 w-4" />}
                >
                  Enviar Link de Recuperação
                </Button>
                <div className="text-center text-xs text-muted-foreground pt-1">
                  <Link to="/auth/login" className="text-primary hover:underline flex items-center justify-center gap-1 font-medium">
                    <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o Login
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
