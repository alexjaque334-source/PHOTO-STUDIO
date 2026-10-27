import React, { Suspense, lazy } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  Outlet,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { AppShell, AdminShell, Spinner, NavItem, ErrorBoundary } from '@/design-system';
import {
  LayoutDashboard,
  Sparkles,
  Image as ImageIcon,
  Wallet,
  CreditCard,
  User as UserIcon,
  ShieldAlert,
} from 'lucide-react';

// Páginas de entrada imediata (não lazy para primeiro paint ultra-rápido)
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/Auth/LoginPage';
import { RegisterPage } from '@/pages/Auth/RegisterPage';

// Code-splitting inteligente: páginas pesadas carregadas sob demanda para máxima velocidade e leveza
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const EditorPage = lazy(() => import('@/pages/EditorPage').then((m) => ({ default: m.EditorPage })));
const LibraryPage = lazy(() => import('@/pages/LibraryPage').then((m) => ({ default: m.LibraryPage })));
const WalletPage = lazy(() => import('@/pages/WalletPage').then((m) => ({ default: m.WalletPage })));
const PlansPage = lazy(() => import('@/pages/PlansPage').then((m) => ({ default: m.PlansPage })));
const AccountPage = lazy(() => import('@/pages/AccountPage').then((m) => ({ default: m.AccountPage })));
const AdminPage = lazy(() => import('@/pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const TermsPage = lazy(() => import('@/pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/Auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@/pages/Auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const VerifyEmailPage = lazy(() => import('@/pages/Auth/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })));

const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-3">
    <Spinner size="lg" className="text-primary" />
    <span className="text-xs text-muted-foreground animate-pulse font-medium">Carregando estúdio...</span>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * Layout com AppShell conectado ao estado de autenticação e navegação do React Router
 */
const AppShellLayout: React.FC = () => {
  const { user, walletBalance, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      active: location.pathname === '/dashboard',
    },
    {
      label: 'Biblioteca',
      href: '/library',
      icon: <ImageIcon className="h-4 w-4" />,
      active: location.pathname.startsWith('/library'),
    },
    {
      label: 'Carteira & Extrato',
      href: '/wallet',
      icon: <Wallet className="h-4 w-4" />,
      active: location.pathname.startsWith('/wallet'),
    },
    {
      label: 'Planos & Créditos',
      href: '/pricing',
      icon: <CreditCard className="h-4 w-4" />,
      active: location.pathname.startsWith('/pricing'),
    },
    {
      label: 'Minha Conta',
      href: '/account',
      icon: <UserIcon className="h-4 w-4" />,
      active: location.pathname.startsWith('/account'),
    },
  ];

  return (
    <AppShell
      currentPath={location.pathname}
      navItems={navItems}
      onNavigate={(path) => navigate(path)}
      onLogout={async () => {
        await logout();
        navigate('/auth/login');
      }}
      user={{
        fullName: user?.fullName || 'Usuário Studio',
        email: user?.email || '',
        isAdmin: false,
      }}
      creditsBalance={{
        available: walletBalance?.available ?? 0,
        expiringSoonCount: walletBalance?.expiringSoon?.length ?? 0,
      }}
    >
      <ErrorBoundary>
        <Suspense fallback={<PageLoadingFallback />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </AppShell>
  );
};

/**
 * Layout Executivo Exclusivo para Administrador (sem elementos de usuário)
 */
const AdminShellLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <AdminShell
      userEmail={user?.email || 'apacessoria25@gmail.com'}
      onLogout={async () => {
        await logout();
        navigate('/auth/login');
      }}
    >
      <ErrorBoundary fallbackTitle="Cockpit Executivo">
        <Suspense fallback={<PageLoadingFallback />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </AdminShell>
  );
};

/**
 * Proteção de Rotas com Redirecionamento Inteligente
 */
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

/**
 * Rota Administrativa: exige role admin e autenticação ativa
 */
const AdminRoute: React.FC = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <ErrorBoundary fallbackTitle="Painel de Controle">
      <Outlet />
    </ErrorBoundary>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Rotas Públicas ── */}
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/termos"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <TermsPage />
                </Suspense>
              }
            />
            <Route
              path="/termos-de-uso"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <TermsPage />
                </Suspense>
              }
            />
            <Route
              path="/privacidade"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <PrivacyPage />
                </Suspense>
              }
            />
            <Route
              path="/politica-de-privacidade"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <PrivacyPage />
                </Suspense>
              }
            />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route
              path="/auth/forgot-password"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <ForgotPasswordPage />
                </Suspense>
              }
            />
            <Route
              path="/auth/reset-password"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <ResetPasswordPage />
                </Suspense>
              }
            />
            <Route
              path="/auth/verify-email"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <VerifyEmailPage />
                </Suspense>
              }
            />

            {/* ── Rotas Protegidas do Studio (Cliente) ── */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShellLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/studio" element={<EditorPage />} />
                <Route path="/studio/:imageId" element={<EditorPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/pricing" element={<PlansPage />} />
                <Route path="/account" element={<AccountPage />} />
              </Route>
            </Route>

            {/* ── Rotas Administrativas Exclusivas (Cockpit Executivo Isolado) ── */}
            <Route element={<AdminRoute />}>
              <Route element={<AdminShellLayout />}>
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/*" element={<AdminPage />} />
              </Route>
            </Route>

            {/* Rota padrão para páginas não encontradas */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
