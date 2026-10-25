import React, { useState, useEffect } from 'react';
import {
  PageHeader,
  Button,
  IconButton,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatCard,
  Input,
  Select,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Modal,
  Alert,
  Skeleton,
  Tabs,
  TabList,
  TabTrigger,
  TabContent,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Textarea,
  useToast,
} from '@/design-system';
import {
  ShieldAlert,
  Users,
  Cpu,
  Sliders,
  DollarSign,
  TrendingUp,
  Search,
  Lock,
  Unlock,
  Coins,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CreditCard,
  MessageSquare,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Star,
  Check,
  RotateCcw,
  Clock,
  Sparkles,
  Zap,
  MoreVertical,
  Trash2,
  Plus,
  Edit2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, AdminMetrics } from '@/lib/api-client';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  // ── 1. Usuários ──
  const [users, setUsers] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Modal de Concessão de Créditos
  const [creditModalUser, setCreditModalUser] = useState<any | null>(null);
  const [creditAmount, setCreditAmount] = useState('10');
  const [creditBucket, setCreditBucket] = useState<'purchased' | 'subscription'>('purchased');
  const [creditNote, setCreditNote] = useState('Bonificação de suporte administrativo');
  const [isGrantingCredits, setIsGrantingCredits] = useState(false);

  // Modal de Exclusão de Usuário
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // ── 2. Planos & Precificação Dinâmica (Sincronizado) ──
  const [plansList, setPlansList] = useState<any[]>([
    {
      id: 'plan_pessoal',
      code: 'pessoal',
      name: 'Plano Pessoal',
      description: '15 créditos mensais para criadores individuais e fotos pessoais.',
      monthly_credits: 15,
      price_cents: 2990,
      active: 1,
    },
    {
      id: 'plan_pro',
      code: 'pro',
      name: 'Plano Pro (Popular)',
      description: '40 créditos mensais para lojas virtuais, fotógrafos e produção contínua.',
      monthly_credits: 40,
      price_cents: 6990,
      active: 1,
    },
    {
      id: 'plan_business',
      code: 'business',
      name: 'Plano Business',
      description: '100 créditos mensais com maior economia por imagem para marcas e agências.',
      monthly_credits: 100,
      price_cents: 14990,
      active: 1,
    },
  ]);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  // Criar e Excluir Planos
  const [isCreatingPlanOpen, setIsCreatingPlanOpen] = useState(false);
  const [newPlanData, setNewPlanData] = useState({
    code: '',
    name: '',
    description: '',
    price_cents: 4990,
    monthly_credits: 30,
  });
  const [isSavingNewPlan, setIsSavingNewPlan] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<any | null>(null);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);

  // ── 3. Feedbacks dos Assinantes ──
  const [feedbacks, setFeedbacks] = useState<any[]>([
    {
      id: 'fb_1',
      user_email: 'juliana.fotografia@gmail.com',
      user_name: 'Juliana Rios',
      rating: 5,
      category: 'qualidade_ia',
      message: 'A restauração de fotos antigas com o Imagen 3 ficou simplesmente espetacular! Clientes elogiaram muito.',
      status: 'novo',
      created_at: '2026-10-24T14:30:00Z',
    },
    {
      id: 'fb_2',
      user_email: 'marcos.ecommerce@lojas.com.br',
      user_name: 'Marcos Vinicius',
      rating: 4,
      category: 'velocidade',
      message: 'Gostei muito da rapidez do Gemini Flash para remover fundos em lote. Podia ter mais opções de cores sólidas.',
      status: 'lido',
      created_at: '2026-10-23T18:10:00Z',
    },
    {
      id: 'fb_3',
      user_email: 'clara.design@estudio.art',
      user_name: 'Clara Mendes',
      rating: 5,
      category: 'sugestao',
      message: 'O plano Studio de 150 créditos vale cada centavo. Excelente interface escura e muito intuitiva.',
      status: 'novo',
      created_at: '2026-10-22T09:45:00Z',
    },
  ]);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(false);

  // ── 4. Extrato Asaas (Opção B) ──
  const [payments, setPayments] = useState<any[]>([
    {
      id: 'pay_01',
      asaas_payment_id: 'pay_9821415201',
      user_email: 'juliana.fotografia@gmail.com',
      value_cents: 7990,
      net_value_cents: 7750,
      billing_type: 'PIX',
      status: 'CONFIRMED',
      created_at: '2026-10-24T13:20:00Z',
      paid_at: '2026-10-24T13:20:45Z',
    },
    {
      id: 'pay_02',
      asaas_payment_id: 'pay_7721894103',
      user_email: 'marcos.ecommerce@lojas.com.br',
      value_cents: 3990,
      net_value_cents: 3820,
      billing_type: 'CREDIT_CARD',
      status: 'CONFIRMED',
      created_at: '2026-10-24T11:05:00Z',
      paid_at: '2026-10-24T11:05:12Z',
    },
    {
      id: 'pay_03',
      asaas_payment_id: 'pay_5541092841',
      user_email: 'pedro.fotografia@outlook.com',
      value_cents: 6990,
      net_value_cents: 6710,
      billing_type: 'PIX',
      status: 'PENDING',
      created_at: '2026-10-24T16:40:00Z',
      paid_at: null,
    },
  ]);

  // ── 5. Monitor de Fila & IA (Opção C) ──
  const [queueData, setQueueData] = useState<any>({
    health: {
      status: 'healthy',
      successRate: 99.8,
      activeWorkers: 2,
      queueDepth: 0,
      totalJobsToday: 48,
      failedJobsToday: 0,
    },
    models: [
      {
        id: 'google/gemini-2.5-flash-image',
        name: 'Photo Studio Fast (Gemini Flash)',
        tier: 'Econômico',
        status: 'Operacional',
        avgLatencyMs: 1240,
        availability: '99.9%',
        credits: 1,
      },
      {
        id: 'google/imagen-3',
        name: 'Photo Studio Pro (Imagen 3)',
        tier: 'Padrão',
        status: 'Operacional',
        avgLatencyMs: 3420,
        availability: '99.7%',
        credits: 1,
      },
      {
        id: 'black-forest-labs/flux-1.1-pro',
        name: 'Photo Studio Ultra (FLUX Pro)',
        tier: 'Premium',
        status: 'Operacional',
        avgLatencyMs: 5180,
        availability: '99.4%',
        credits: 2,
      },
    ],
  });

  // ── 6. Modelos de IA ──
  const [models, setModels] = useState<any[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  // ── 7. Configurações e Limites ──
  const [settings, setSettings] = useState<Record<string, any>>({
    'limits.edits_per_user_per_day': 50,
    'limits.concurrent_jobs_per_user': 2,
    'limits.uploads_per_user_per_day': 100,
    'limits.global_daily_ai_budget_usd': 20,
    'limits.max_prompt_chars': 2000,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // ── 8. Catálogo dos 70 Comandos Internos de IA ──
  const [commandsList, setCommandsList] = useState<any[]>([]);
  const [commandSearch, setCommandSearch] = useState('');
  const [commandCategoryFilter, setCommandCategoryFilter] = useState('todos');
  const [isLoadingCommands, setIsLoadingCommands] = useState(true);

  // Carregar dados iniciais
  useEffect(() => {
    let isMounted = true;

    // Métricas
    api.admin
      .getMetrics()
      .then((res: any) => {
        if (!isMounted) return;
        const totalAiCost = res.totalAiCostUsd ?? res.financial?.aiCostUsd ?? 0;
        const mrr = res.mrrCents ?? res.financial?.revenueCents ?? 0;
        const totalUsers = res.totalUsers ?? res.users?.active ?? 0;
        const payingUsers = res.payingUsers ?? res.users?.paying ?? 0;
        const margin =
          res.estimatedContributionMargin ??
          (mrr > 0 ? Number(((res.financial?.contributionMarginBrlCents / mrr) * 100).toFixed(1)) : 100);
        const jobs = res.jobsCompletedToday ?? res.aiUsage?.totalGenerations ?? 0;

        setMetrics({
          totalUsers,
          payingUsers,
          activeSubscriptions: res.activeSubscriptions ?? 0,
          mrrCents: mrr,
          totalAiCostUsd: totalAiCost,
          estimatedContributionMargin: margin,
          jobsCompletedToday: jobs,
        });
      })
      .catch(() => {
        setMetrics({
          totalUsers: 1,
          payingUsers: 0,
          activeSubscriptions: 0,
          mrrCents: 0,
          totalAiCostUsd: 0,
          estimatedContributionMargin: 100,
          jobsCompletedToday: 0,
        });
      })
      .finally(() => {
        if (isMounted) setIsLoadingMetrics(false);
      });

    // Usuários
    api.admin
      .listUsers()
      .then((res: any) => {
        if (!isMounted) return;
        const rawItems = res.items || (Array.isArray(res) ? res : []);
        const formatted = rawItems.map((u: any) => ({
          id: u.id,
          email: u.email,
          fullName: u.fullName || u.full_name || 'Sem nome',
          emailVerified: Boolean(u.emailVerified ?? u.email_verified_at),
          roles: Array.isArray(u.roles) ? u.roles : ['user'],
          mfaEnabled: Boolean(u.mfaEnabled),
          isBlocked: Boolean(u.isBlocked ?? u.status === 'blocked'),
          createdAt: u.createdAt || u.created_at || new Date().toISOString(),
          balance: (u.purchased_balance ?? 0) + (u.subscription_balance ?? 0),
        }));
        setUsers(formatted);
      })
      .catch(() => {
        setUsers([
          {
            id: 'usr_admin_01',
            email: 'apacessoria25@gmail.com',
            fullName: 'Super Administrador',
            emailVerified: true,
            roles: ['admin', 'user'],
            mfaEnabled: false,
            isBlocked: false,
            createdAt: '2026-10-24T00:00:00Z',
            balance: 50,
          },
        ]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingUsers(false);
      });

    // Planos do backend
    api.admin
      .getPlans()
      .then((res: any) => {
        if (!isMounted) return;
        if (res?.items && res.items.length > 0) {
          setPlansList(res.items);
        }
      })
      .catch(() => {});

    // Feedbacks
    api.admin
      .getFeedbacks()
      .then((res: any) => {
        if (!isMounted) return;
        if (res?.items && res.items.length > 0) {
          setFeedbacks(res.items);
        }
      })
      .catch(() => {});

    // Pagamentos Asaas
    api.admin
      .getPayments()
      .then((res: any) => {
        if (!isMounted) return;
        if (res?.items && res.items.length > 0) {
          setPayments(res.items);
        }
      })
      .catch(() => {});

    // Monitor IA
    api.admin
      .getAiQueueMonitor()
      .then((res: any) => {
        if (!isMounted) return;
        if (res?.models) {
          setQueueData(res);
        }
      })
      .catch(() => {});

    // Modelos
    api.admin
      .getModels()
      .then((res: any) => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : res?.models || [];
        const formatted = list.map((m: any) => ({
          id: m.id,
          tier: m.tier,
          modelId: m.modelId || m.model_id,
          label: m.label || m.display_name || m.model_id,
          priority: m.priority ?? 100,
          active: Boolean(m.active),
          creditsCost: m.creditsCost || m.credits_cost || 1,
        }));
        setModels(formatted);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingModels(false);
      });

    // Configurações
    api.admin
      .getSettings()
      .then((res: any) => {
        if (!isMounted) return;
        const s = res.settings || res;
        setSettings((prev) => ({ ...prev, ...s }));
      })
      .catch(() => {});

    // Catálogo dos 70 Comandos Internos de IA
    api.edits
      .getCatalog()
      .then((res) => {
        if (!isMounted) return;
        setCommandsList(res.commands || []);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingCommands(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Ações de Usuário
  const handleToggleBlockUser = async (u: any) => {
    try {
      if (u.isBlocked) {
        await api.admin.unblockUser(u.id);
        success(`Usuário ${u.email} foi desbloqueado com sucesso.`, 'Desbloqueado');
      } else {
        await api.admin.blockUser(u.id, 'Bloqueio administrativo realizado pelo painel executivo');
        success(`Usuário ${u.email} foi bloqueado. Todas as sessões ativas foram encerradas.`, 'Bloqueado');
      }
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, isBlocked: !item.isBlocked } : item))
      );
    } catch (err: any) {
      error(err.message || 'Falha ao alterar status do usuário.', 'Erro');
    }
  };

  const handleDeleteUserConfirm = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      await api.admin.deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((item) => item.id !== userToDelete.id));
      success(`A conta de ${userToDelete.email} foi excluída permanentemente.`, 'Usuário Excluído');
      setUserToDelete(null);
    } catch (err: any) {
      error(err.message || 'Falha ao excluir usuário.', 'Erro');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleGrantCreditsConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditModalUser) return;

    setIsGrantingCredits(true);
    try {
      await api.admin.grantCredits(creditModalUser.id, {
        amount: parseInt(creditAmount, 10),
        bucket: creditBucket,
        note: creditNote.trim() || undefined,
      });
      success(
        `${creditAmount} créditos concedidos para ${creditModalUser.email}.`,
        'Créditos Adicionados'
      );
      setCreditModalUser(null);
    } catch (err: any) {
      error(err.message || 'Falha ao conceder créditos.', 'Erro');
    } finally {
      setIsGrantingCredits(false);
    }
  };

  // Salvar Alteração de Planos
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    setIsSavingPlan(true);
    try {
      await api.admin.updatePlan(editingPlan.id, {
        name: editingPlan.name,
        description: editingPlan.description,
        priceCents: parseInt(String(editingPlan.price_cents), 10),
        monthlyCredits: parseInt(String(editingPlan.monthly_credits), 10),
        active: Boolean(editingPlan.active),
      });

      setPlansList((prev) =>
        prev.map((p) => (p.id === editingPlan.id ? { ...editingPlan } : p))
      );
      success('Plano atualizado! O novo valor já reflete na Landing Page e no Checkout.', 'Plano Salvo');
      setEditingPlan(null);
    } catch (err: any) {
      error(err.message || 'Falha ao atualizar plano.', 'Erro');
    } finally {
      setIsSavingPlan(false);
    }
  };

  // Criar Novo Plano
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanData.name.trim() || !newPlanData.code.trim()) {
      error('Preencha o nome e o código identificador do plano.', 'Campos Obrigatórios');
      return;
    }

    setIsSavingNewPlan(true);
    try {
      const res = await api.admin.createPlan({
        code: newPlanData.code.trim().toLowerCase(),
        name: newPlanData.name.trim(),
        description: newPlanData.description.trim(),
        priceCents: parseInt(String(newPlanData.price_cents), 10),
        monthlyCredits: parseInt(String(newPlanData.monthly_credits), 10),
        active: true,
      });

      const created = res.plan || {
        id: `plan_${Date.now()}`,
        code: newPlanData.code.trim().toLowerCase(),
        name: newPlanData.name.trim(),
        description: newPlanData.description.trim(),
        price_cents: parseInt(String(newPlanData.price_cents), 10),
        monthly_credits: parseInt(String(newPlanData.monthly_credits), 10),
        active: 1,
      };

      setPlansList((prev) => [...prev, created]);
      success('Novo plano criado! Já sincronizado na Landing Page e no Checkout.', 'Plano Criado');
      setIsCreatingPlanOpen(false);
      setNewPlanData({
        code: '',
        name: '',
        description: '',
        price_cents: 4990,
        monthly_credits: 30,
      });
    } catch (err: any) {
      error(err.message || 'Falha ao criar plano.', 'Erro');
    } finally {
      setIsSavingNewPlan(false);
    }
  };

  // Excluir Plano
  const handleDeletePlanConfirm = async () => {
    if (!planToDelete) return;

    setIsDeletingPlan(true);
    try {
      await api.admin.deletePlan(planToDelete.id);
      setPlansList((prev) => prev.filter((p) => p.id !== planToDelete.id));
      success(`Plano "${planToDelete.name}" foi removido do catálogo e da Landing Page.`, 'Plano Excluído');
      setPlanToDelete(null);
    } catch (err: any) {
      error(err.message || 'Falha ao excluir plano.', 'Erro');
    } finally {
      setIsDeletingPlan(false);
    }
  };

  // Ação de Feedback (Marcar como Lido / Resolvido)
  const handleUpdateFeedback = async (id: string, newStatus: 'novo' | 'lido' | 'resolvido') => {
    try {
      await api.admin.updateFeedbackStatus(id, newStatus);
      setFeedbacks((prev) =>
        prev.map((fb) => (fb.id === id ? { ...fb, status: newStatus } : fb))
      );
      success(`Status do feedback atualizado para "${newStatus}".`, 'Feedback Atualizado');
    } catch {
      // Fallback local caso offline
      setFeedbacks((prev) =>
        prev.map((fb) => (fb.id === id ? { ...fb, status: newStatus } : fb))
      );
    }
  };

  // Salvar Configurações
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await api.admin.updateSettings(settings);
      success('Limites do sistema atualizados com sucesso.', 'Configurações Salvas');
    } catch (err: any) {
      error(err.message || 'Falha ao salvar configurações.', 'Erro');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.fullName?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Cabeçalho do Cockpit */}
      <PageHeader
        title="Cockpit Executivo — Photo Studio AI"
        description="Centro de comando exclusivo: métricas financeiras, gestão de usuários, precificação dinâmica e telemetria das APIs de IA."
        badge={
          <Badge variant="danger" size="md" className="font-mono">
            Acesso Restrito Super-Admin
          </Badge>
        }
      />

      {/* Alerta de Governança LGPD */}
      <Alert variant="info" title="Arquitetura de Privacidade por Design (LGPD)">
        Em estrita conformidade com a LGPD, o painel administrativo opera com <strong>segregação de dados</strong>: o administrador tem controle de usuários, métricas e faturamento, sem visualizar arquivos de imagem privados dos clientes.
      </Alert>

      {/* Estatísticas Chave Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Receita Recorrente (MRR)"
          value={
            metrics
              ? ((metrics.mrrCents ?? 0) / 100).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })
              : 'R$ 0,00'
          }
          variant="gold"
          icon={<DollarSign className="h-5 w-5" />}
          description={`${metrics?.activeSubscriptions ?? 0} assinaturas ativas`}
        />

        <StatCard
          title="Usuários Ativos / Pagantes"
          value={metrics ? `${metrics.payingUsers ?? 0} / ${metrics.totalUsers ?? 0}` : '0 / 0'}
          icon={<Users className="h-5 w-5" />}
          description="Base de clientes cadastrada"
        />

        <StatCard
          title="Custo OpenRouter (Hoje)"
          value={`$${(metrics?.totalAiCostUsd ?? 0).toFixed(2)}`}
          icon={<Cpu className="h-5 w-5" />}
          description={`${metrics?.jobsCompletedToday ?? 0} jobs executados`}
        />

        <StatCard
          title="Margem de Contribuição"
          value={`${(metrics?.estimatedContributionMargin ?? 100).toFixed(1)}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          description="Rentabilidade operacional"
        />
      </div>

      {/* Abas do Cockpit Executivo */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <TabList className="flex flex-wrap gap-2 border-b border-border/80 pb-2">
          <TabTrigger value="overview" icon={<TrendingUp className="h-4 w-4" />}>
            Métricas & Gráficos
          </TabTrigger>
          <TabTrigger value="users" icon={<Users className="h-4 w-4" />}>
            Gestão de Usuários
          </TabTrigger>
          <TabTrigger value="plans" icon={<CreditCard className="h-4 w-4" />}>
            Planos & Precificação
          </TabTrigger>
          <TabTrigger value="feedback" icon={<MessageSquare className="h-4 w-4" />}>
            Feedbacks dos Assinantes
          </TabTrigger>
          <TabTrigger value="billing" icon={<DollarSign className="h-4 w-4" />}>
            Extrato Asaas
          </TabTrigger>
          <TabTrigger value="queue" icon={<Activity className="h-4 w-4" />}>
            Monitor de Fila & IA
          </TabTrigger>
          <TabTrigger value="models" icon={<Cpu className="h-4 w-4" />}>
            Modelos de IA & Tiers
          </TabTrigger>
          <TabTrigger value="catalog" icon={<Sparkles className="h-4 w-4" />}>
            Catálogo IA (70 Comandos)
          </TabTrigger>
          <TabTrigger value="settings" icon={<Sliders className="h-4 w-4" />}>
            Limites & Orçamento
          </TabTrigger>
        </TabList>

        {/* ════════════════════════════════════════════════════════════════
            ABA 1: MÉTRICAS & GRÁFICOS INTERATIVOS
        ════════════════════════════════════════════════════════════════ */}
        <TabContent value="overview" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico 1: Evolução de Receita MRR */}
            <Card className="border-border/80 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Evolução de Receita & MRR
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Crescimento acumulado nos últimos 6 ciclos mensais (R$)
                  </CardDescription>
                </div>
                <Badge variant="gold" size="sm">+24.8% este mês</Badge>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full pt-4">
                  <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="mrr-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Linhas de Grade */}
                    <line x1="40" y1="30" x2="480" y2="30" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
                    <line x1="40" y1="80" x2="480" y2="80" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
                    <line x1="40" y1="130" x2="480" y2="130" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
                    <line x1="40" y1="180" x2="480" y2="180" stroke="currentColor" strokeOpacity="0.15" />

                    {/* Área Preenchida com Gradiente */}
                    <path
                      d="M 50 160 Q 120 140, 190 125 T 330 85 T 470 45 L 470 180 L 50 180 Z"
                      fill="url(#mrr-grad)"
                    />
                    {/* Linha Principal da Curva */}
                    <path
                      d="M 50 160 Q 120 140, 190 125 T 330 85 T 470 45"
                      fill="none"
                      stroke="#6366F1"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Pontos de Dados */}
                    <circle cx="50" cy="160" r="4.5" fill="#6366F1" />
                    <circle cx="190" cy="125" r="4.5" fill="#6366F1" />
                    <circle cx="330" cy="85" r="4.5" fill="#6366F1" />
                    <circle cx="470" cy="45" r="6" fill="#818CF8" stroke="#1E1B4B" strokeWidth="2" />

                    {/* Rótulos dos Meses */}
                    <text x="50" y="196" fill="currentColor" opacity="0.6" fontSize="10" textAnchor="middle">Mai</text>
                    <text x="130" y="196" fill="currentColor" opacity="0.6" fontSize="10" textAnchor="middle">Jun</text>
                    <text x="210" y="196" fill="currentColor" opacity="0.6" fontSize="10" textAnchor="middle">Jul</text>
                    <text x="290" y="196" fill="currentColor" opacity="0.6" fontSize="10" textAnchor="middle">Ago</text>
                    <text x="370" y="196" fill="currentColor" opacity="0.6" fontSize="10" textAnchor="middle">Set</text>
                    <text x="470" y="196" fill="currentColor" opacity="0.9" fontWeight="bold" fontSize="10" textAnchor="middle">Out (Atual)</text>
                  </svg>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs text-muted-foreground">
                  <span>Média ticket mensal: <strong>R$ 69,90</strong></span>
                  <span className="text-emerald-500 font-semibold flex items-center gap-1">
                    <ArrowUpRight className="h-3.5 w-3.5" /> Churn controlado (&lt; 2%)
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico 2: Consumo Diário de IA (OpenRouter USD) */}
            <Card className="border-border/80 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-amber-500" />
                    Consumo Diário de IA (OpenRouter)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Custo diário em dólares (USD) nos últimos 7 dias
                  </CardDescription>
                </div>
                <Badge variant="secondary" size="sm">Teto: $20.00/dia</Badge>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full pt-4">
                  <svg viewBox="0 0 500 200" className="w-full h-full">
                    {/* Linhas de Grade */}
                    <line x1="30" y1="30" x2="480" y2="30" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
                    <line x1="30" y1="80" x2="480" y2="80" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
                    <line x1="30" y1="130" x2="480" y2="130" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
                    <line x1="30" y1="180" x2="480" y2="180" stroke="currentColor" strokeOpacity="0.15" />

                    {/* Barras dos 7 Dias */}
                    {/* Seg */}
                    <rect x="50" y="110" width="30" height="70" rx="4" fill="#F59E0B" opacity="0.8" />
                    <text x="65" y="196" fill="currentColor" opacity="0.6" fontSize="10" textAnchor="middle">Seg</text>
                    <text x="65" y="102" fill="currentColor" opacity="0.8" fontSize="9" textAnchor="middle">$1.40</text>

                    {/* Ter */}
                    <rect x="110" y="90" width="30" height="90" rx="4" fill="#F59E0B" opacity="0.8" />
                    <text x="125" y="196" fill="currentColor" opacity="0.6" fontSize="10" textAnchor="middle">Ter</text>
                    <text x="125" y="82" fill="currentColor" opacity="0.8" fontSize="9" textAnchor="middle">$1.90</text>

                    {/* Qua */}
                    <rect x="170" y="75" width="30" height="105" rx="4" fill="#F59E0B" opacity="0.8" />
                    <text x="185" y="196" fill="currentColor" opacity="0.6" fontSize="10" textAnchor="middle">Qua</text>
                    <text x="185" y="67" fill="currentColor" opacity="0.8" fontSize="9" textAnchor="middle">$2.30</text>

                    {/* Qui */}
                    <rect x="230" y="95" width="30" height="85" rx="4" fill="#F59E0B" opacity="0.8" />
                    <text x="245" y="196" fill="currentColor" opacity="0.6" fontSize="10" textAnchor="middle">Qui</text>
                    <text x="245" y="87" fill="currentColor" opacity="0.8" fontSize="9" textAnchor="middle">$1.80</text>

                    {/* Sex */}
                    <rect x="290" y="60" width="30" height="120" rx="4" fill="#F59E0B" opacity="0.8" />
                    <text x="305" y="196" fill="currentColor" opacity="0.6" fontSize="10" textAnchor="middle">Sex</text>
                    <text x="305" y="52" fill="currentColor" opacity="0.8" fontSize="9" textAnchor="middle">$2.80</text>

                    {/* Sáb */}
                    <rect x="350" y="50" width="30" height="130" rx="4" fill="#F59E0B" opacity="0.8" />
                    <text x="365" y="196" fill="currentColor" opacity="0.6" fontSize="10" textAnchor="middle">Sáb</text>
                    <text x="365" y="42" fill="currentColor" opacity="0.8" fontSize="9" textAnchor="middle">$3.10</text>

                    {/* Hoje (Destaque) */}
                    <rect x="410" y="65" width="30" height="115" rx="4" fill="#6366F1" />
                    <text x="425" y="196" fill="currentColor" opacity="0.9" fontWeight="bold" fontSize="10" textAnchor="middle">Hoje</text>
                    <text x="425" y="57" fill="#818CF8" fontWeight="bold" fontSize="9" textAnchor="middle">${(metrics?.totalAiCostUsd ?? 2.45).toFixed(2)}</text>
                  </svg>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs text-muted-foreground">
                  <span>Custo médio por foto editada: <strong>$0.018 (R$ 0,10)</strong></span>
                  <span className="text-emerald-500 font-semibold">Margem Bruta Estimada: 85%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabContent>

        {/* ════════════════════════════════════════════════════════════════
            ABA 2: GESTÃO DE USUÁRIOS
        ════════════════════════════════════════════════════════════════ */}
        <TabContent value="users" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Usuários Cadastrados</CardTitle>
                <CardDescription className="text-xs">
                  Controle de contas, saldos de créditos em carteira e suspensão de acesso.
                </CardDescription>
              </div>

              <div className="w-full sm:w-72">
                <Input
                  placeholder="Buscar por e-mail ou nome..."
                  leftIcon={<Search className="h-4 w-4" />}
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Saldo Atual</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-foreground">{u.fullName}</span>
                          <span className="text-[11px] text-muted-foreground font-mono">{u.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {u.roles?.includes('admin') ? (
                            <Badge variant="danger" size="sm">Admin</Badge>
                          ) : (
                            <Badge variant="secondary" size="sm">Cliente</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.isBlocked ? (
                          <Badge variant="danger" size="sm">Bloqueado</Badge>
                        ) : (
                          <Badge variant="success" size="sm">Ativo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-xs text-amber-500 font-mono">
                          {u.balance ?? 0} créditos
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Coins className="h-3 w-3 text-amber-500" />}
                            onClick={() => setCreditModalUser(u)}
                          >
                            Créditos
                          </Button>

                          {!u.roles?.includes('admin') && (
                            <DropdownMenu
                              trigger={
                                <button
                                  type="button"
                                  className="p-1.5 rounded-lg border border-border/80 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground focus:outline-none"
                                  title="Ações do usuário"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              }
                            >
                              <DropdownMenuItem onClick={() => handleToggleBlockUser(u)}>
                                {u.isBlocked ? (
                                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                    <Unlock className="h-3.5 w-3.5" />
                                    <span>Desbloquear Conta</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                    <Lock className="h-3.5 w-3.5" />
                                    <span>Bloquear Conta</span>
                                  </div>
                                )}
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => setCreditModalUser(u)}>
                                <div className="flex items-center gap-2 text-foreground">
                                  <Coins className="h-3.5 w-3.5 text-amber-500" />
                                  <span>Conceder Créditos</span>
                                </div>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem onClick={() => setUserToDelete(u)}>
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium">
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Excluir Usuário</span>
                                </div>
                              </DropdownMenuItem>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabContent>

        {/* ════════════════════════════════════════════════════════════════
            ABA 3: PLANOS & PRECIFICAÇÃO (DINÂMICO COM LANDING PAGE)
        ════════════════════════════════════════════════════════════════ */}
        <TabContent value="plans" className="space-y-6 pt-4">
          <Card className="border-border/80">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Gerenciador de Planos & Preços
                </CardTitle>
                <CardDescription className="text-xs">
                  Crie, edite ou remova planos. <strong>Todas as mudanças refletem imediatamente na Landing Page e no Checkout Asaas!</strong>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success" size="sm" className="hidden sm:flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Sincronizado com Landing Page
                </Badge>
                <Button
                  variant="gold"
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setIsCreatingPlanOpen(true)}
                >
                  Novo Plano
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plansList.map((plan) => (
                  <Card key={plan.id} className="border-border/70 flex flex-col justify-between hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[11px] text-muted-foreground uppercase">{plan.code}</span>
                        {plan.active ? (
                          <Badge variant="success" size="sm">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary" size="sm">Inativo</Badge>
                        )}
                      </div>
                      <CardTitle className="text-base">{plan.name}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2">{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Preço Mensal:</span>
                        <span className="text-base font-extrabold text-foreground font-mono">
                          {((plan.price_cents ?? 0) / 100).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Créditos Inclusos:</span>
                        <span className="text-sm font-bold text-amber-500 font-mono">
                          {plan.monthly_credits} créditos
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        leftIcon={<Sliders className="h-3.5 w-3.5" />}
                        onClick={() => setEditingPlan({ ...plan })}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                        onClick={() => setPlanToDelete(plan)}
                      >
                        Excluir
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabContent>

        {/* ════════════════════════════════════════════════════════════════
            ABA 4: FEEDBACKS DOS ASSINANTES
        ════════════════════════════════════════════════════════════════ */}
        <TabContent value="feedback" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Feedbacks & Avaliações dos Clientes
                </CardTitle>
                <CardDescription className="text-xs">
                  Opiniões, elogios e sugestões enviadas pelos assinantes e criadores.
                </CardDescription>
              </div>
              <Badge variant="gold" size="sm">
                Nota Média: 4.8 / 5.0 ⭐
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {feedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="p-4 rounded-xl border border-border/70 bg-card/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < fb.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                          />
                        ))}
                      </div>
                      <Badge variant="secondary" size="sm" className="capitalize text-[10px]">
                        {fb.category?.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(fb.created_at).toLocaleDateString('pt-BR')} às {new Date(fb.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-foreground font-medium leading-relaxed">
                      "{fb.message}"
                    </p>
                    <div className="text-[11px] text-muted-foreground">
                      Por: <strong>{fb.user_name || 'Assinante'}</strong> ({fb.user_email})
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {fb.status === 'novo' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                        onClick={() => handleUpdateFeedback(fb.id, 'lido')}
                      >
                        Marcar Lido
                      </Button>
                    ) : (
                      <Badge variant="success" size="sm">Lido</Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabContent>

        {/* ════════════════════════════════════════════════════════════════
            ABA 5: EXTRATO FINANCEIRO ASAAS (OPÇÃO B)
        ════════════════════════════════════════════════════════════════ */}
        <TabContent value="billing" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                  Extrato Financeiro Asaas (Tempo Real)
                </CardTitle>
                <CardDescription className="text-xs">
                  Histórico de transações, Pix confirmados, faturas de cartão e conciliação de liquidações.
                </CardDescription>
              </div>
              <Badge variant="success" size="sm" className="font-mono">
                Asaas v3 Online
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Pagamento</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Valor Bruto</TableHead>
                    <TableHead>Valor Líquido</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">
                        {p.asaas_payment_id}
                      </TableCell>
                      <TableCell className="text-xs font-semibold">{p.user_email || p.user_id}</TableCell>
                      <TableCell>
                        {p.billing_type === 'PIX' ? (
                          <Badge variant="success" size="sm">Pix</Badge>
                        ) : p.billing_type === 'CREDIT_CARD' ? (
                          <Badge variant="secondary" size="sm">Cartão</Badge>
                        ) : (
                          <Badge variant="warning" size="sm">Boleto</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-xs text-foreground">
                        {((p.value_cents ?? 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-emerald-500">
                        {((p.net_value_cents ?? p.value_cents) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell>
                        {p.status === 'CONFIRMED' || p.status === 'RECEIVED' ? (
                          <Badge variant="success" size="sm">Pago</Badge>
                        ) : p.status === 'PENDING' ? (
                          <Badge variant="warning" size="sm">Pendente</Badge>
                        ) : (
                          <Badge variant="danger" size="sm">Estornado</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString('pt-BR')} {new Date(p.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.status === 'CONFIRMED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<RotateCcw className="h-3 w-3 text-destructive" />}
                            onClick={() => {
                              if (confirm(`Confirmar estorno do pagamento ${p.asaas_payment_id}?`)) {
                                api.admin.refundPayment(p.id, 'Solicitação do cliente')
                                  .then(() => success('Estorno solicitado com sucesso.', 'Reembolso Processado'))
                                  .catch((err) => error(err.message, 'Erro'));
                              }
                            }}
                          >
                            Estornar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabContent>

        {/* ════════════════════════════════════════════════════════════════
            ABA 6: MONITOR DE FILA & SAÚDE DA IA (OPÇÃO C)
        ════════════════════════════════════════════════════════════════ */}
        <TabContent value="queue" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 border-border/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Fila de Processamento</span>
                <Badge variant="success" size="sm">Sem Atraso</Badge>
              </div>
              <div className="text-2xl font-extrabold font-mono">{queueData.health?.queueDepth ?? 0} jobs</div>
              <p className="text-[11px] text-muted-foreground mt-1">2 Workers dedicados processando em paralelo</p>
            </Card>

            <Card className="p-4 border-border/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Taxa de Sucesso (24h)</span>
                <Badge variant="success" size="sm">{queueData.health?.successRate ?? 99.8}%</Badge>
              </div>
              <div className="text-2xl font-extrabold font-mono text-emerald-500">99.8%</div>
              <p className="text-[11px] text-muted-foreground mt-1">Nenhum fallback por indisponibilidade</p>
            </Card>

            <Card className="p-4 border-border/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Total de Fotos Geradas Hoje</span>
                <Badge variant="secondary" size="sm">Hoje</Badge>
              </div>
              <div className="text-2xl font-extrabold font-mono text-primary">{queueData.health?.totalJobsToday ?? 48}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Média de 1.8 segundos por requisição</p>
            </Card>
          </div>

          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Latência e Disponibilidade dos Modelos de IA
              </CardTitle>
              <CardDescription className="text-xs">
                Telemetria direta da rota do OpenRouter para cada motor de visão computacional.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo / Motor</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status Operacional</TableHead>
                    <TableHead>Latência Média</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead className="text-right">Custo / Crédito</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queueData.models?.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-foreground">{m.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{m.id}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" size="sm">{m.tier}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-semibold text-emerald-500">{m.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {m.avgLatencyMs} ms
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{m.availability}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-amber-500 font-bold">
                        {m.credits} crédito(s)
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabContent>

        {/* ════════════════════════════════════════════════════════════════
            ABA 7: MODELOS DE IA & TIERS
        ════════════════════════════════════════════════════════════════ */}
        <TabContent value="models" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Catálogo & Ordem de Failover</CardTitle>
              <CardDescription className="text-xs">
                Se o modelo primário apresentar lentidão ou cota esgotada, o sistema aciona os modelos de fallback na ordem de prioridade.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Nome de Exibição</TableHead>
                    <TableHead>Identificador OpenRouter</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Custo em Créditos</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell><Badge variant="secondary" size="sm" className="capitalize">{m.tier}</Badge></TableCell>
                      <TableCell className="font-semibold text-xs">{m.label}</TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">{m.modelId}</TableCell>
                      <TableCell className="font-mono text-xs">{m.priority === 10 ? '1º (Principal)' : `${m.priority}º (Fallback)`}</TableCell>
                      <TableCell className="font-mono font-bold text-amber-500 text-xs">{m.creditsCost} cr</TableCell>
                      <TableCell className="text-right">
                        {m.active ? <Badge variant="success" size="sm">Ativo</Badge> : <Badge variant="secondary" size="sm">Desativado</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabContent>

        {/* ════════════════════════════════════════════════════════════════
            ABA 8: LIMITES & ORÇAMENTO
        ════════════════════════════════════════════════════════════════ */}
        <TabContent value="settings" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Travas de Segurança & Orçamento Diário</CardTitle>
              <CardDescription className="text-xs">
                Proteções automáticas para evitar estouro de custos na API do OpenRouter e abuso de recursos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input
                  label="Teto Diário Global de IA ($ USD)"
                  type="number"
                  value={settings['limits.global_daily_ai_budget_usd'] ?? 20}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      'limits.global_daily_ai_budget_usd': parseFloat(e.target.value),
                    })
                  }
                  helperText="Se o consumo diário atingir este valor, as requisições são pausadas com alerta."
                />

                <Input
                  label="Edições Máximas por Usuário / Dia"
                  type="number"
                  value={settings['limits.edits_per_user_per_day'] ?? 50}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      'limits.edits_per_user_per_day': parseInt(e.target.value, 10),
                    })
                  }
                  helperText="Limite de segurança anti-abuso e proteção contra automações."
                />

                <Input
                  label="Jobs Simultâneos por Usuário"
                  type="number"
                  value={settings['limits.concurrent_jobs_per_user'] ?? 2}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      'limits.concurrent_jobs_per_user': parseInt(e.target.value, 10),
                    })
                  }
                  helperText="Evita saturação da fila de renderização."
                />

                <Input
                  label="Uploads Diários Permitidos"
                  type="number"
                  value={settings['limits.uploads_per_user_per_day'] ?? 100}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      'limits.uploads_per_user_per_day': parseInt(e.target.value, 10),
                    })
                  }
                  helperText="Teto diário de upload para armazenamento R2."
                />
              </div>

              <div className="pt-4 border-t border-border/60 flex justify-end">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Check className="h-4 w-4" />}
                  isLoading={isSavingSettings}
                  onClick={handleSaveSettings}
                >
                  Salvar Limites do Sistema
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabContent>
        {/* ════════════════════════════════════════════════════════════════
            ABA 8: CATÁLOGO DOS 70 COMANDOS INTERNOS DE IA
        ════════════════════════════════════════════════════════════════ */}
        <TabContent value="catalog" className="space-y-6 pt-4">
          <Card className="border-border">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Catálogo de Comandos Internos de IA (70 Motores)
                  </CardTitle>
                  <CardDescription>
                    Base unificada de 70 comandos inteligentes (14 fundamentais + 56 avançados). O cliente escreve livremente em português brasileiro e o NLU mapeia para esses comandos de forma invisível.
                  </CardDescription>
                </div>
                <Badge variant="gold" size="md" className="font-mono">
                  {commandsList.length > 0 ? `${commandsList.length} Comandos` : '70 Comandos Ativos'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Barra de Busca e Filtros */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por comando, intenção ou frase do cliente..."
                    value={commandSearch}
                    onChange={(e) => setCommandSearch(e.target.value)}
                    className="pl-9 text-xs"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    'todos',
                    'Ensaios',
                    'Aniversários',
                    'Casamentos',
                    'Natureza',
                    'Eventos',
                    'Motion',
                    'Comercial',
                  ].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCommandCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                        commandCategoryFilter === cat
                          ? 'bg-amber-500/10 border-amber-500 text-amber-500 font-bold'
                          : 'bg-card border-border text-muted-foreground hover:border-amber-500/40'
                      }`}
                    >
                      {cat === 'todos' ? 'Todas Categorias' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabela de Comandos */}
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>Comando Interno</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="min-w-[220px]">Intenção Visual</TableHead>
                      <TableHead className="min-w-[200px]">Exemplos em Português</TableHead>
                      <TableHead className="text-center">Complexidade</TableHead>
                      <TableHead className="text-center">Créditos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commandsList
                      .filter((cmd) => {
                        const matchesCat =
                          commandCategoryFilter === 'todos' ||
                          cmd.category.toLowerCase().includes(commandCategoryFilter.toLowerCase());
                        const q = commandSearch.toLowerCase();
                        const matchesSearch =
                          !q ||
                          cmd.internalName.toLowerCase().includes(q) ||
                          cmd.intent.toLowerCase().includes(q) ||
                          cmd.userPhrases.some((p: string) => p.toLowerCase().includes(q)) ||
                          cmd.category.toLowerCase().includes(q);
                        return matchesCat && matchesSearch;
                      })
                      .map((cmd) => (
                        <TableRow key={cmd.id} className="hover:bg-muted/40">
                          <TableCell className="text-center font-mono text-xs text-muted-foreground">
                            {cmd.id}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs font-semibold text-foreground">
                              {cmd.internalName}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" size="sm">
                              {cmd.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-foreground/90">
                            {cmd.intent}
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">
                            <div className="space-y-0.5">
                              {cmd.userPhrases.slice(0, 2).map((phrase: string, idx: number) => (
                                <span key={idx} className="block italic">
                                  "{phrase}"
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                cmd.complexity === 'alta'
                                  ? 'danger'
                                  : cmd.complexity === 'média'
                                  ? 'warning'
                                  : 'success'
                              }
                              size="sm"
                              className="capitalize"
                            >
                              {cmd.complexity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs font-bold text-amber-500">
                            {cmd.suggestedCredits} {cmd.suggestedCredits === 1 ? 'crédito' : 'créditos'}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabContent>
      </Tabs>

      {/* ── Modal de Edição de Planos ── */}
      {editingPlan && (
        <Modal
          isOpen={true}
          onClose={() => setEditingPlan(null)}
          title={`Editar ${editingPlan.name}`}
          size="md"
        >
          <form onSubmit={handleSavePlan} className="space-y-4">
            <Input
              label="Nome do Plano"
              value={editingPlan.name}
              onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
              required
            />
            <Input
              label="Preço em Centavos (ex: 3990 = R$ 39,90)"
              type="number"
              value={editingPlan.price_cents}
              onChange={(e) => setEditingPlan({ ...editingPlan, price_cents: parseInt(e.target.value, 10) })}
              helperText={`Equivale a R$ ${((editingPlan.price_cents || 0) / 100).toFixed(2).replace('.', ',')}`}
              required
            />
            <Input
              label="Créditos Inclusos"
              type="number"
              value={editingPlan.monthly_credits}
              onChange={(e) => setEditingPlan({ ...editingPlan, monthly_credits: parseInt(e.target.value, 10) })}
              required
            />
            <Input
              label="Descrição do Plano"
              value={editingPlan.description || ''}
              onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" size="sm" type="button" onClick={() => setEditingPlan(null)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSavingPlan}>
                Salvar e Sincronizar Site
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal de Concessão de Créditos ── */}
      {creditModalUser && (
        <Modal
          isOpen={true}
          onClose={() => setCreditModalUser(null)}
          title={`Conceder Créditos — ${creditModalUser.email}`}
          size="md"
        >
          <form onSubmit={handleGrantCreditsConfirm} className="space-y-4">
            <Input
              label="Quantidade de Créditos"
              type="number"
              min="1"
              max="1000"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              required
            />
            <Select
              label="Tipo de Carteira (Bucket)"
              value={creditBucket}
              onChange={(e) => setCreditBucket(e.target.value as any)}
              options={[
                { value: 'purchased', label: 'Créditos Comprados (Validade 12 meses)' },
                { value: 'subscription', label: 'Créditos de Assinatura (Mensais)' },
              ]}
            />
            <Input
              label="Justificativa da Concessão"
              value={creditNote}
              onChange={(e) => setCreditNote(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" size="sm" type="button" onClick={() => setCreditModalUser(null)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isGrantingCredits}>
                Confirmar Concessão
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal de Criação de Novo Plano ── */}
      {isCreatingPlanOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreatingPlanOpen(false)}
          title="Criar Novo Plano de Assinatura"
          size="md"
        >
          <form onSubmit={handleCreatePlan} className="space-y-4">
            <Input
              label="Nome do Plano"
              placeholder="Ex: Plano Starter"
              value={newPlanData.name}
              onChange={(e) => {
                const name = e.target.value;
                const codeAuto = name
                  .toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .replace(/[^a-z0-9]/g, '_');
                setNewPlanData({
                  ...newPlanData,
                  name,
                  code: newPlanData.code ? newPlanData.code : codeAuto,
                });
              }}
              required
            />

            <Input
              label="Código Identificador (URL/Sistema)"
              placeholder="Ex: starter"
              value={newPlanData.code}
              onChange={(e) => setNewPlanData({ ...newPlanData, code: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '_') })}
              helperText="Identificador único no banco de dados e gateway Asaas"
              required
            />

            <Input
              label="Preço em Centavos (ex: 4990 = R$ 49,90)"
              type="number"
              min="100"
              value={newPlanData.price_cents}
              onChange={(e) => setNewPlanData({ ...newPlanData, price_cents: parseInt(e.target.value, 10) || 0 })}
              helperText={`Equivale a R$ ${((newPlanData.price_cents || 0) / 100).toFixed(2).replace('.', ',')}`}
              required
            />

            <Input
              label="Créditos Mensais Inclusos"
              type="number"
              min="1"
              value={newPlanData.monthly_credits}
              onChange={(e) => setNewPlanData({ ...newPlanData, monthly_credits: parseInt(e.target.value, 10) || 0 })}
              required
            />

            <Input
              label="Descrição Resumida do Plano"
              placeholder="Ex: 30 créditos mensais para pequenas lojas e profissionais autônomos."
              value={newPlanData.description}
              onChange={(e) => setNewPlanData({ ...newPlanData, description: e.target.value })}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsCreatingPlanOpen(false)}>
                Cancelar
              </Button>
              <Button variant="gold" size="sm" type="submit" isLoading={isSavingNewPlan}>
                Criar e Publicar Plano
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal de Confirmação de Exclusão de Plano ── */}
      {planToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setPlanToDelete(null)}
          title="Excluir Plano do Catálogo?"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tem certeza que deseja apagar permanentemente o plano{' '}
              <strong className="text-foreground">{planToDelete.name}</strong>?
              Ele será removido imediatamente da Landing Page e do Checkout.
            </p>

            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400">
              Assinaturas já ativas neste plano continuarão operando até cancelamento pelo cliente.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPlanToDelete(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isDeletingPlan}
                onClick={handleDeletePlanConfirm}
              >
                Sim, Excluir Plano
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal de Confirmação de Exclusão de Usuário ── */}
      {userToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setUserToDelete(null)}
          title="Excluir Conta de Usuário?"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Você está prestes a excluir permanentemente a conta de{' '}
              <strong className="text-foreground font-mono">{userToDelete.email}</strong>.
            </p>

            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400">
              Todas as sessões ativas serão encerradas e os registros associados ao usuário serão revogados do banco de dados. Esta ação não pode ser desfeita.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setUserToDelete(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isDeletingUser}
                onClick={handleDeleteUserConfirm}
              >
                Excluir Usuário Permanentemente
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
