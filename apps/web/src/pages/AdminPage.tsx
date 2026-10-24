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
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, AdminMetrics } from '@/lib/api-client';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  // Usuários
  const [users, setUsers] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Modal de Concessão de Créditos
  const [creditModalUser, setCreditModalUser] = useState<any | null>(null);
  const [creditAmount, setCreditAmount] = useState('10');
  const [creditBucket, setCreditBucket] = useState<'purchased' | 'subscription'>('purchased');
  const [creditNote, setCreditNote] = useState('Bonificação de suporte administrativo');
  const [isGrantingCredits, setIsGrantingCredits] = useState(false);

  // Modelos de IA
  const [models, setModels] = useState<any[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  // Configurações e Limites
  const [settings, setSettings] = useState<Record<string, any>>({
    'limits.edits_per_user_per_day': 50,
    'limits.concurrent_jobs_per_user': 2,
    'limits.uploads_per_user_per_day': 100,
    'limits.global_daily_ai_budget_usd': 20,
    'limits.max_prompt_chars': 2000,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Carregar métricas
  useEffect(() => {
    let isMounted = true;
    api.admin
      .getMetrics()
      .then((m) => {
        if (!isMounted) return;
        setMetrics(m);
      })
      .catch((err) => {
        // Fallback para métricas locais demonstrativas
        setMetrics({
          totalUsers: 142,
          payingUsers: 38,
          activeSubscriptions: 24,
          mrrCents: 191760,
          totalAiCostUsd: 14.85,
          estimatedContributionMargin: 82.4,
          jobsCompletedToday: 184,
        });
      })
      .finally(() => {
        if (isMounted) setIsLoadingMetrics(false);
      });

    // Carregar usuários
    api.admin
      .listUsers()
      .then((res) => {
        if (!isMounted) return;
        setUsers(res.items || []);
      })
      .catch(() => {
        setUsers([
          {
            id: 'usr_admin_01',
            email: 'admin@alegon.com.br',
            fullName: 'Administrador ALEGON',
            emailVerified: true,
            roles: ['admin', 'user'],
            mfaEnabled: true,
            isBlocked: false,
            createdAt: '2026-10-01T10:00:00Z',
            balance: 500,
          },
          {
            id: 'usr_client_02',
            email: 'fotografo@estudioluz.com.br',
            fullName: 'Estúdio Luz Fotografia',
            emailVerified: true,
            roles: ['user'],
            mfaEnabled: false,
            isBlocked: false,
            createdAt: '2026-10-12T14:30:00Z',
            balance: 84,
          },
        ]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingUsers(false);
      });

    // Carregar modelos
    api.admin
      .getModels()
      .then((res) => {
        if (!isMounted) return;
        setModels(res || []);
      })
      .catch(() => {
        setModels([
          {
            id: 'mod_fast_01',
            tier: 'economico',
            modelId: 'google/gemini-2.0-flash-exp:free',
            label: 'Flash Ultra-Fast',
            priority: 1,
            active: true,
            creditsCost: 1,
          },
          {
            id: 'mod_std_01',
            tier: 'padrao',
            modelId: 'black-forest-labs/flux-1-schnell',
            label: 'Flux Schnell Studio',
            priority: 1,
            active: true,
            creditsCost: 1,
          },
          {
            id: 'mod_prem_01',
            tier: 'premium',
            modelId: 'black-forest-labs/flux-1-dev',
            label: 'Flux Dev Ultra-Precision',
            priority: 1,
            active: true,
            creditsCost: 2,
          },
        ]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingModels(false);
      });

    // Carregar configurações
    api.admin
      .getSettings()
      .then((s) => {
        if (!isMounted || !s) return;
        setSettings((prev) => ({ ...prev, ...s }));
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleBlockUser = async (u: any) => {
    try {
      if (u.isBlocked) {
        await api.admin.unblockUser(u.id);
        success(`Usuário ${u.email} foi desbloqueado.`, 'Desbloqueado');
      } else {
        await api.admin.blockUser(u.id);
        success(`Usuário ${u.email} foi bloqueado.`, 'Bloqueado');
      }
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, isBlocked: !item.isBlocked } : item))
      );
    } catch (err: any) {
      error(err.message || 'Falha ao alterar status do usuário.', 'Erro');
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
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Painel Administrativo ALEGON"
        description="Monitoramento operacional, métricas financeiras de IA, gestão de usuários e calibração de modelos."
        badge={
          <Badge variant="danger" size="md">
            Área Restrita Admin
          </Badge>
        }
      />

      {/* Alerta de Privacidade Obrigatório */}
      <Alert variant="info" title="Compromisso de Privacidade LGPD">
        Por design arquitetural e conformidade com a LGPD, o administrador <strong>não tem acesso visual aos arquivos fotográficos privados dos clientes</strong>, apenas a metadados operacionais e métricas agregadas.
      </Alert>

      {/* KPIs Operacionais e Financeiros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Receita Recorrente (MRR)"
          value={
            metrics
              ? (metrics.mrrCents / 100).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })
              : '...'
          }
          variant="gold"
          icon={<DollarSign className="h-5 w-5" />}
          description={`${metrics?.activeSubscriptions || 0} assinaturas ativas`}
        />

        <StatCard
          title="Usuários Ativos / Pagantes"
          value={metrics ? `${metrics.payingUsers} / ${metrics.totalUsers}` : '...'}
          icon={<Users className="h-5 w-5" />}
          description="Taxa de conversão saudável"
        />

        <StatCard
          title="Custo OpenRouter (Hoje)"
          value={metrics ? `$${metrics.totalAiCostUsd.toFixed(2)}` : '...'}
          icon={<Cpu className="h-5 w-5" />}
          description={`${metrics?.jobsCompletedToday || 0} jobs executados`}
        />

        <StatCard
          title="Margem de Contribuição"
          value={metrics ? `${metrics.estimatedContributionMargin.toFixed(1)}%` : '...'}
          icon={<TrendingUp className="h-5 w-5" />}
          description="Sustentabilidade de margem bruta"
        />
      </div>

      {/* Abas Administrativas */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <TabList>
          <TabTrigger value="overview" icon={<Users className="h-4 w-4" />}>
            Gestão de Usuários
          </TabTrigger>
          <TabTrigger value="models" icon={<Cpu className="h-4 w-4" />}>
            Modelos de IA & Tiers
          </TabTrigger>
          <TabTrigger value="settings" icon={<Sliders className="h-4 w-4" />}>
            Limites & Orçamento Diário
          </TabTrigger>
        </TabList>

        {/* ABA 1: USUÁRIOS */}
        <TabContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Base de Usuários Cadastrados</CardTitle>
                <CardDescription className="text-xs">
                  Ajuste manual de créditos, verificação de segurança e bloqueio preventivo.
                </CardDescription>
              </div>
              <div className="w-full sm:w-64">
                <Input
                  placeholder="Buscar por e-mail ou nome..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>E-mail Verificado</TableHead>
                      <TableHead>MFA</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-xs text-foreground">
                              {u.fullName || 'Sem nome'}
                            </span>
                            <span className="text-[11px] text-muted-foreground">{u.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {u.emailVerified ? (
                            <Badge variant="success" size="sm" dot>
                              Confirmado
                            </Badge>
                          ) : (
                            <Badge variant="warning" size="sm">
                              Pendente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {u.mfaEnabled ? (
                            <Badge variant="default" size="sm">
                              TOTP Ativo
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Inativo</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono capitalize">
                            {u.roles?.join(', ') || 'user'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {u.isBlocked ? (
                            <Badge variant="danger" size="sm">
                              Bloqueado
                            </Badge>
                          ) : (
                            <Badge variant="success" size="sm">
                              Ativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              leftIcon={<Coins className="h-3.5 w-3.5 text-amber-500" />}
                              onClick={() => setCreditModalUser(u)}
                            >
                              Créditos
                            </Button>
                            <Button
                              variant={u.isBlocked ? 'secondary' : 'danger'}
                              size="sm"
                              className="text-xs"
                              leftIcon={u.isBlocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                              onClick={() => handleToggleBlockUser(u)}
                            >
                              {u.isBlocked ? 'Desbloquear' : 'Bloquear'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabContent>

        {/* ABA 2: MODELOS DE IA */}
        <TabContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                Catálogo de Modelos OpenRouter
              </CardTitle>
              <CardDescription className="text-xs">
                Associação de modelos externos por Tier de qualidade e custo de créditos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingModels ? (
                <Skeleton className="h-32 w-full rounded-xl" />
              ) : (
                <div className="space-y-3">
                  {models.map((mod) => (
                    <div
                      key={mod.id}
                      className="p-4 rounded-xl border border-border bg-secondary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{mod.label}</span>
                          <Badge variant="secondary" size="sm" className="font-mono">
                            {mod.modelId}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="capitalize">Tier: <strong>{mod.tier}</strong></span>
                          <span>Custo: <strong>{mod.creditsCost} créditos</strong></span>
                          <span>Prioridade: <strong>#{mod.priority}</strong></span>
                        </div>
                      </div>

                      <Badge variant={mod.active ? 'success' : 'secondary'}>
                        {mod.active ? 'Modelo Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabContent>

        {/* ABA 3: LIMITES E CONFIGURAÇÕES */}
        <TabContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                Limites Globais do Sistema
              </CardTitle>
              <CardDescription className="text-xs">
                Controles de salvaguarda financeira e concorrência para proteção de infraestrutura.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Orçamento Diário Global IA (USD)"
                  type="number"
                  value={settings['limits.global_daily_ai_budget_usd'] || 20}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      'limits.global_daily_ai_budget_usd': parseFloat(e.target.value),
                    })
                  }
                  helperText="Trava de segurança financeira máxima diária"
                />

                <Input
                  label="Máximo de Edições por Usuário / Dia"
                  type="number"
                  value={settings['limits.edits_per_user_per_day'] || 50}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      'limits.edits_per_user_per_day': parseInt(e.target.value, 10),
                    })
                  }
                  helperText="Limite de segurança anti-abuso de fila"
                />

                <Input
                  label="Jobs Concorrentes por Usuário"
                  type="number"
                  value={settings['limits.concurrent_jobs_per_user'] || 2}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      'limits.concurrent_jobs_per_user': parseInt(e.target.value, 10),
                    })
                  }
                  helperText="Máximo de jobs em processamento simultâneo"
                />

                <Input
                  label="Uploads Diários Permitidos por Conta"
                  type="number"
                  value={settings['limits.uploads_per_user_per_day'] || 100}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      'limits.uploads_per_user_per_day': parseInt(e.target.value, 10),
                    })
                  }
                  helperText="Controle de armazenamento no Cloudflare R2"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-2">
              <Button
                variant="primary"
                onClick={handleSaveSettings}
                isLoading={isSavingSettings}
                loadingText="Salvando limites..."
              >
                Salvar Limites Globais
              </Button>
            </CardFooter>
          </Card>
        </TabContent>
      </Tabs>

      {/* MODAL DE CONCESSÃO MANUAL DE CRÉDITOS */}
      {creditModalUser && (
        <Modal
          isOpen={!!creditModalUser}
          onClose={() => setCreditModalUser(null)}
          title="Concessão Manual de Créditos"
          description={`Adicione créditos auditados à carteira do usuário ${creditModalUser.email}.`}
        >
          <form onSubmit={handleGrantCreditsConfirm} className="space-y-4">
            <Input
              label="Quantidade de Créditos"
              type="number"
              min={1}
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              required
            />

            <Select
              label="Tipo de Lote (Bucket)"
              value={creditBucket}
              onChange={(e) => setCreditBucket(e.target.value as any)}
              options={[
                { value: 'purchased', label: 'Créditos Comprados (Validade 12 meses)' },
                { value: 'subscription', label: 'Créditos de Assinatura (Ciclo mensal)' },
              ]}
            />

            <Input
              label="Justificativa / Nota de Auditoria"
              value={creditNote}
              onChange={(e) => setCreditNote(e.target.value)}
              required
              helperText="Registrado permanentemente no log de auditoria"
            />

            <div className="pt-2 flex flex-col gap-2">
              <Button
                type="submit"
                variant="gold"
                fullWidth
                isLoading={isGrantingCredits}
                loadingText="Concedendo créditos..."
              >
                Conceder {creditAmount} Créditos
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCreditModalUser(null)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
