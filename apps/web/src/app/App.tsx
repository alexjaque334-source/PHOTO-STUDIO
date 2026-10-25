import React from 'react';
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
  Sliders,
} from 'lucide-react';

// Páginas
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/Auth/LoginPage';
import { RegisterPage } from '@/pages/Auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/Auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/Auth/ResetPasswordPage';
import { VerifyEmailPage } from '@/pages/Auth/VerifyEmailPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { EditorPage } from '@/pages/EditorPage';
import { LibraryPage } from '@/pages/LibraryPage';
import { WalletPage } from '@/pages/WalletPage';
import { PlansPage } from '@/pages/PlansPage';
import { AccountPage } from '@/pages/AccountPage';
import { AdminPage } from '@/pages/AdminPage';
import { DesignSystemPage } from '@/pages/DesignSystemPage';

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
  const { user, walletBalance, logout, isAdmin } = useAuth();
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
        <Outlet />
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
        <Outlet />
      </ErrorBoundary>
    </AdminShell>
  );
};

/**
 * Rota Protegida: exige usuário autenticado
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
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/verify-email" element={<VerifyEmailPage />} />

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
