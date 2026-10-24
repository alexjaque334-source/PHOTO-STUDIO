import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageHeader,
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Skeleton,
  EmptyState,
  Alert,
} from '@/design-system';
import {
  Coins,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Plus,
  ShieldCheck,
  Clock,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, WalletTransaction } from '@/lib/api-client';

export const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const { walletBalance, refreshWallet } = useAuth();

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await refreshWallet();
      const res = await api.wallet.listTransactions(undefined, 50);
      setTransactions(res.items || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao sincronizar extrato de créditos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const available = walletBalance?.available ?? 0;
  const purchased = walletBalance?.purchased ?? 0;
  const subscription = walletBalance?.subscription ?? 0;
  const reserved = walletBalance?.reserved ?? 0;

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'grant_purchase':
        return 'Compra de Pacote Avulso';
      case 'grant_subscription':
        return 'Renovação de Assinatura';
      case 'grant_single_edit':
        return 'Edição Avulsa';
      case 'grant_admin':
        return 'Ajuste Administrativo';
      case 'consume_edit':
        return 'Consumo de Edição de Imagem';
      case 'release_reservation':
        return 'Estorno / Liberação de Reserva';
      case 'refund_reversal':
        return 'Reversão por Reembolso';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Carteira & Extrato de Créditos"
        description="Acompanhe com transparência matemática cada crédito recebido, consumido ou estornado na sua conta."
        badge={<Badge variant="gold">Ledger D1 Auditado</Badge>}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={fetchTransactions}
            >
              Atualizar Saldo
            </Button>
            <Button
              variant="gold"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => navigate('/pricing')}
            >
              Recarregar Créditos
            </Button>
          </div>
        }
      />

      {errorMessage && (
        <Alert variant="danger" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {/* Detalhamento de Saldos por Balde */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Saldo Total Disponível"
          value={available.toString()}
          variant="gold"
          icon={<Coins className="h-5 w-5" />}
          description="Pronto para uso imediato no Studio"
        />

        <StatCard
          title="Créditos Comprados"
          value={purchased.toString()}
          icon={<CreditCard className="h-5 w-5" />}
          description="Validade padrão de 12 meses"
        />

        <StatCard
          title="Créditos de Assinatura"
          value={subscription.toString()}
          icon={<Clock className="h-5 w-5" />}
          description="Vencem no final do ciclo mensal"
        />

        <StatCard
          title="Créditos em Reserva"
          value={reserved.toString()}
          icon={<History className="h-5 w-5" />}
          description="Bloqueados para jobs em execução"
        />
      </div>

      {/* Alerta de Créditos Próximos do Vencimento */}
      {walletBalance?.expiringSoon && walletBalance.expiringSoon.length > 0 && (
        <Alert variant="warning" title="Créditos Prestes a Expirar">
          Você possui créditos que vencerão nos próximos dias. Utilize-os em suas edições antes do término da validade.
        </Alert>
      )}

      {/* Tabela do Extrato Completo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              Histórico Detalhado de Movimentações
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              Ordem de consumo: Assinatura → Comprados (FIFO)
            </span>
          </CardTitle>
          <CardDescription className="text-xs">
            Registro imutável com garantia de devolução de créditos em falhas técnicas elegíveis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              title="Nenhuma movimentação registrada"
              description="Quando você adquirir créditos ou realizar edições de imagens, o extrato detalhado aparecerá aqui."
              action={
                <Button variant="primary" size="sm" onClick={() => navigate('/pricing')}>
                  Adquirir Primeiro Pacote
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data / Hora</TableHead>
                  <TableHead>Operação</TableHead>
                  <TableHead>Lote (Bucket)</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead className="text-right">Variação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => {
                  const isPositive = t.amount > 0;
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {new Date(t.createdAt).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-foreground">
                        {formatTransactionType(t.type)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={t.bucket === 'subscription' ? 'default' : 'secondary'}
                          size="sm"
                        >
                          {t.bucket === 'subscription' ? 'Assinatura' : 'Comprado'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {t.note || 'Processamento via sistema'}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            isPositive ? 'text-emerald-500' : 'text-foreground'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                          )}
                          {isPositive ? `+${t.amount}` : t.amount} créditos
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
