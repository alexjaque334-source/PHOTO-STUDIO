import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Checkbox,
  Alert,
  ThemeToggle,
} from '@/design-system';
import { UserPlus, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  // Cálculo visual simples de força da senha
  const passwordLengthValid = password.length >= 10;
  const hasLettersAndNumbers = /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  const passwordMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!passwordLengthValid) {
      setErrorMessage('A senha deve conter no mínimo 10 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('A confirmação de senha não confere com a senha digitada.');
      return;
    }

    if (!acceptTerms || !acceptPrivacy) {
      setErrorMessage('É obrigatório concordar com os Termos de Serviço e a Política de Privacidade LGPD.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        acceptTerms: true,
        acceptPrivacy: true,
      });
      setRegisteredSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Não foi possível concluir o cadastro.');
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Criar Conta no Studio</h1>
          <p className="text-xs text-muted-foreground">
            Cadastre-se para acessar o estúdio fotográfico com inteligência artificial.
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

          {registeredSuccess ? (
            <CardContent className="space-y-4 pt-6 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Cadastro Realizado com Sucesso!</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Enviamos um link de confirmação para <strong className="text-foreground">{email}</strong>.
                Você já pode acessar seu painel principal.
              </p>
              <div className="pt-2">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => navigate('/auth/login')}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Ir para o Login
                </Button>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-6">
                <Input
                  label="Nome Completo"
                  placeholder="Seu Nome ou Razão Social"
                  required
                  autoFocus
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />

                <Input
                  label="E-mail"
                  type="email"
                  placeholder="seu.email@exemplo.com.br"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <div>
                  <Input
                    label="Senha (mínimo 10 caracteres)"
                    type="password"
                    placeholder="••••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {password.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                      <div
                        className={`h-1.5 flex-1 rounded-full ${
                          passwordLengthValid && hasLettersAndNumbers
                            ? 'bg-emerald-500'
                            : passwordLengthValid
                            ? 'bg-amber-500'
                            : 'bg-destructive'
                        }`}
                      />
                      <span className="text-muted-foreground">
                        {passwordLengthValid && hasLettersAndNumbers
                          ? 'Senha forte'
                          : passwordLengthValid
                          ? 'Senha razoável'
                          : 'Muito curta (mín. 10)'}
                      </span>
                    </div>
                  )}
                </div>

                <Input
                  label="Confirmar Senha"
                  type="password"
                  placeholder="••••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={
                    confirmPassword.length > 0 && !passwordMatch
                      ? 'As senhas não coincidem'
                      : undefined
                  }
                />

                {/* Consentimentos LGPD Obrigatórios */}
                <div className="pt-2 space-y-3 border-t border-border/60">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      id="acceptTerms"
                      label="Concordo com os Termos de Serviço"
                      description="Regras de utilização, validade de créditos e SLA do estúdio."
                      required
                    />
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={acceptPrivacy}
                      onChange={(e) => setAcceptPrivacy(e.target.checked)}
                      id="acceptPrivacy"
                      label="Declaro ciência da Política de Privacidade LGPD"
                      description="Suas fotos nunca são compartilhadas ou utilizadas para treinamento público."
                      required
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isSubmitting}
                  loadingText="Criando conta..."
                  leftIcon={<UserPlus className="h-4 w-4" />}
                >
                  Concluir Cadastro Grátis
                </Button>
                <div className="text-center text-xs text-muted-foreground pt-1">
                  Já possui conta?{' '}
                  <Link to="/auth/login" className="text-primary hover:underline font-bold">
                    Fazer Login
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
