import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  PageHeader,
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  PriceCard,
  Modal,
  Input,
  Alert,
  Spinner,
  useToast,
} from '@/design-system';
import {
  Coins,
  QrCode,
  CreditCard,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  api,
  BillingProduct,
  BillingPlan,
  CheckoutResponse,
} from '@/lib/api-client';

export const PlansPage: React.FC = () => {
  const { user, refreshWallet } = useAuth();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'packs' | 'plans'>('packs');
  const [products, setProducts] = useState<BillingProduct[]>([]);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados do Modal de Checkout
  const [selectedItem, setSelectedItem] = useState<{
    code: string;
    name: string;
    priceCents: number;
    credits: number;
    isSubscription: boolean;
  } | null>(null);

  const [billingType, setBillingType] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Estados do Pagamento Gerado
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResponse | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Carregar catálogo de produtos e planos
  useEffect(() => {
    let isMounted = true;
    api.billing
      .getCatalog()
      .then((res) => {
        if (!isMounted) return;
        setProducts(res.products || []);
        setPlans(res.plans || []);
      })
      .catch((err) => {
        console.warn('Falha no catálogo da API, usando catálogo canônico local:', err);
        // Catálogo canônico fallback caso a API ainda não esteja semeada
        setProducts([
          {
            code: 'single_edit',
            kind: 'single_edit',
            name: 'Edição Avulsa',
            description: '1 crédito para testar o estúdio em alta definição.',
            credits: 1,
            priceCents: 790,
            creditValidityDays: 30,
          },
          {
            code: 'pack_creator',
            kind: 'credit_pack',
            name: 'Pacote Creator',
            description: '50 créditos válidos por 1 ano. Ideal para criadores.',
            credits: 50,
            priceCents: 3990,
            creditValidityDays: 365,
          },
          {
            code: 'pack_pro',
            kind: 'credit_pack',
            name: 'Pacote Pro',
            description: '100 créditos válidos por 1 ano. Maior custo-benefício.',
            credits: 100,
            priceCents: 6990,
            creditValidityDays: 365,
          },
        ]);
        setPlans([
          {
            code: 'plan_studio',
            name: 'Assinatura Studio Pro',
            description: '150 créditos mensais com prioridade máxima de fila.',
            monthlyCredits: 150,
            priceCents: 7990,
          },
          {
            code: 'plan_agency',
            name: 'Assinatura Agência & E-commerce',
            description: '400 créditos mensais com suporte VIP e acesso antecipado.',
            monthlyCredits: 400,
            priceCents: 17990,
          },
        ]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Iniciar fluxo de checkout
  const handleStartCheckout = (
    code: string,
    name: string,
    priceCents: number,
    credits: number,
    isSubscription: boolean
  ) => {
    setSelectedItem({ code, name, priceCents, credits, isSubscription });
    setCheckoutResult(null);
    setQrCodeDataUrl(null);
    setPaymentConfirmed(false);
    setBillingType('PIX');
  };

  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsCheckingOut(true);
    try {
      if (selectedItem.isSubscription) {
        const subRes = await api.billing.createSubscription({
          planCode: selectedItem.code,
          billingType,
          cpfCnpj: cpfCnpj.trim() || undefined,
        });

        if (subRes.firstPayment) {
          setCheckoutResult(subRes.firstPayment);
          if (billingType === 'PIX' && subRes.firstPayment.pix?.payload) {
            const url = await QRCode.toDataURL(subRes.firstPayment.pix.payload, {
              margin: 1,
              width: 260,
            });
            setQrCodeDataUrl(url);
          }
        } else {
          success('Assinatura criada com sucesso!', 'Plano Ativo');
          await refreshWallet();
          setPaymentConfirmed(true);
        }
      } else {
        const payRes = await api.billing.checkout({
          productCode: selectedItem.code,
          billingType,
          cpfCnpj: cpfCnpj.trim() || undefined,
          name: user?.fullName,
        });

        setCheckoutResult(payRes);

        if (billingType === 'PIX' && payRes.pix?.payload) {
          const url = await QRCode.toDataURL(payRes.pix.payload, {
            margin: 1,
            width: 260,
          });
          setQrCodeDataUrl(url);
        }
      }
    } catch (err: any) {
      error(err.message || 'Falha ao iniciar pagamento Asaas.', 'Erro no Checkout');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Polling de confirmação de pagamento Pix
  useEffect(() => {
    if (!checkoutResult || billingType !== 'PIX' || paymentConfirmed) return;

    const interval = setInterval(async () => {
      try {
        const statusRes = await api.billing.getPayment(checkoutResult.paymentId);
        if (['RECEIVED', 'CONFIRMED'].includes(statusRes.status)) {
          setPaymentConfirmed(true);
          await refreshWallet();
          success('Pagamento Pix confirmado! Seus créditos já foram liberados.', 'Sucesso!');
          clearInterval(interval);
        }
      } catch (err) {
        // Silencioso durante polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [checkoutResult, billingType, paymentConfirmed, refreshWallet, success]);

  const handleCopyPixPayload = () => {
    if (!checkoutResult?.pix?.payload) return;
    navigator.clipboard.writeText(checkoutResult.pix.payload);
    setIsCopied(true);
    success('Código Pix Copia e Cola copiado com sucesso!', 'Copiado');
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Planos & Recarga de Créditos"
        description="Escolha a modalidade ideal para sua demanda. Pagamento seguro com Asaas via Pix instantâneo ou Cartão de Crédito."
        badge={<Badge variant="gold">Liberação Imediata</Badge>}
      />

      {/* Alternador de Tipo de Catálogo */}
      <div className="flex justify-center">
        <div className="p-1 rounded-xl bg-secondary/80 border border-border inline-flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('packs')}
            className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all select-none ${
              activeTab === 'packs'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pacotes de Créditos Avulsos (Sem mensalidade)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all select-none ${
              activeTab === 'plans'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Assinaturas Mensais Recorrentes
          </button>
        </div>
      </div>

      {/* Catálogo de Pacotes Avulsos */}
      {activeTab === 'packs' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {products.map((prod) => {
            const isPro = prod.code === 'pack_pro';
            const priceFormatted = (prod.priceCents / 100).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            });

            return (
              <PriceCard
                key={prod.code}
                name={prod.name}
                description={prod.description}
                priceFormatted={priceFormatted}
                periodLabel="pagamento único"
                creditsLabel={`${prod.credits} ${prod.credits === 1 ? 'Crédito' : 'Créditos'}`}
                isPopular={isPro}
                features={[
                  `${prod.credits} edições em alta resolução`,
                  `Validade de ${prod.creditValidityDays} dias`,
                  'Download em PNG, JPG e WebP',
                  'Retenção privativa de 90 dias',
                  'Acesso a todas as 14 ferramentas',
                ]}
                buttonText="Adquirir Agora"
                onSelect={() =>
                  handleStartCheckout(
                    prod.code,
                    prod.name,
                    prod.priceCents,
                    prod.credits,
                    false
                  )
                }
              />
            );
          })}
        </div>
      )}

      {/* Catálogo de Assinaturas */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, idx) => {
            const isStudio = plan.code === 'plan_studio';
            const priceFormatted = (plan.priceCents / 100).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            });

            return (
              <PriceCard
                key={plan.code}
                name={plan.name}
                description={plan.description}
                priceFormatted={priceFormatted}
                periodLabel="por mês"
                creditsLabel={`${plan.monthlyCredits} Créditos / mês`}
                isPopular={isStudio}
                features={[
                  `${plan.monthlyCredits} créditos renovados a cada ciclo`,
                  'Prioridade máxima na fila de IA',
                  'Histórico não-destrutivo completo',
                  'Download sem perdas de compactação',
                  'Cancelamento transparente a qualquer momento',
                ]}
                buttonText="Assinar Plano Mensal"
                onSelect={() =>
                  handleStartCheckout(
                    plan.code,
                    plan.name,
                    plan.priceCents,
                    plan.monthlyCredits,
                    true
                  )
                }
              />
            );
          })}
        </div>
      )}

      {/* MODAL DE CHECKOUT ASAAS */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={`Checkout Seguro — ${selectedItem.name}`}
          description="Selecione o método de pagamento e confirme para liberar seus créditos instantaneamente."
        >
          {paymentConfirmed ? (
            <div className="py-6 space-y-4 text-center">
              <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Pagamento Confirmado!</h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Parabéns! Seus {selectedItem.credits} créditos foram concedidos à sua carteira e já estão prontos para uso no Studio de Edição.
              </p>
              <div className="pt-4">
                <Button variant="primary" fullWidth onClick={() => setSelectedItem(null)}>
                  Fechar e Continuar Criando
                </Button>
              </div>
            </div>
          ) : checkoutResult ? (
            <div className="space-y-6">
              {billingType === 'PIX' ? (
                <div className="space-y-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Clock className="h-4 w-4 animate-spin" />
                    <span>Aguardando confirmação do Pix em tempo real...</span>
                  </div>

                  {qrCodeDataUrl ? (
                    <div className="mx-auto w-fit p-3 bg-white rounded-2xl shadow-sm border border-border">
                      <img
                        src={qrCodeDataUrl}
                        alt="QR Code Pix Asaas"
                        className="w-56 h-56 mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="w-56 h-56 mx-auto bg-secondary flex items-center justify-center rounded-2xl">
                      <Spinner size="lg" />
                    </div>
                  )}

                  {checkoutResult.pix?.payload && (
                    <div className="space-y-2 text-left">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Código Pix Copia e Cola:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={checkoutResult.pix.payload}
                          className="flex-1 px-3 py-2 text-xs font-mono bg-secondary border border-border rounded-lg text-foreground focus:outline-none"
                        />
                        <Button
                          variant={isCopied ? 'secondary' : 'primary'}
                          size="sm"
                          onClick={handleCopyPixPayload}
                          leftIcon={isCopied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        >
                          {isCopied ? 'Copiado!' : 'Copiar'}
                        </Button>
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Abra o aplicativo do seu banco, escolha <strong>Pagar via Pix</strong> e aponte a câmera para o QR Code acima.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 text-center py-4">
                  <CreditCard className="h-12 w-12 text-primary mx-auto" />
                  <h3 className="font-bold text-sm text-foreground">Fatura de Cartão Gerada com Sucesso</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Para garantir sua segurança total e conformidade PCI, o pagamento de cartão é processado na fatura oficial e protegida do Asaas.
                  </p>
                  <div className="pt-2">
                    <a
                      href={checkoutResult.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block w-full"
                    >
                      <Button variant="primary" fullWidth rightIcon={<ExternalLink className="h-4 w-4" />}>
                        Abrir Fatura Segura no Asaas
                      </Button>
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleProcessCheckout} className="space-y-4">
              <div className="p-3 rounded-xl bg-secondary/50 border border-border flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-foreground block">{selectedItem.name}</span>
                  <span className="text-muted-foreground">{selectedItem.credits} créditos de IA</span>
                </div>
                <span className="font-mono font-bold text-sm text-foreground">
                  {(selectedItem.priceCents / 100).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>

              {/* Seletor de Método de Pagamento */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Método de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBillingType('PIX')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                      billingType === 'PIX'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <QrCode className="h-4 w-4 text-emerald-500" />
                    Pix Instantâneo
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillingType('CREDIT_CARD')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                      billingType === 'CREDIT_CARD'
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <CreditCard className="h-4 w-4 text-primary" />
                    Cartão de Crédito
                  </button>
                </div>
              </div>

              <Input
                label="CPF ou CNPJ (obrigatório para emissão de nota)"
                placeholder="000.000.000-00"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                helperText="Exigência regulatória do Banco Central / Asaas para emissão de cobrança"
              />

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  type="submit"
                  variant="gold"
                  fullWidth
                  isLoading={isCheckingOut}
                  loadingText="Gerando fatura Asaas..."
                  leftIcon={billingType === 'PIX' ? <QrCode className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                >
                  {billingType === 'PIX' ? 'Gerar QR Code Pix' : 'Prosseguir para Cartão'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedItem(null)}
                >
                  Cancelar
                </Button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground pt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Intermediado pelo Asaas • Isenção total de tráfego de cartão</span>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};
