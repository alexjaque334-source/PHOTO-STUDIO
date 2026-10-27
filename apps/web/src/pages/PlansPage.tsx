import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Checkbox,
  LegalModal,
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
  User as UserIcon,
  ArrowRight,
  Lock,
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const itemParam = searchParams.get('item');

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy'>('terms');

  const [activeTab, setActiveTab] = useState<'plans' | 'packs'>(tabParam === 'packs' ? 'packs' : 'plans');
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

  // Sincroniza tab da URL
  useEffect(() => {
    if (tabParam === 'packs' || tabParam === 'plans') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Abre checkout automaticamente se houver item nos parâmetros da URL
  useEffect(() => {
    if (!itemParam || selectedItem) return;

    const foundProduct = products.find(
      (p) => p.code === itemParam || p.name?.toLowerCase().includes(itemParam.toLowerCase())
    );
    if (foundProduct) {
      setActiveTab('packs');
      setSelectedItem({
        code: foundProduct.code,
        name: foundProduct.name,
        priceCents: foundProduct.priceCents,
        credits: foundProduct.credits,
        isSubscription: false,
      });
      return;
    }

    const foundPlan = plans.find(
      (p) => p.code === itemParam || p.name?.toLowerCase().includes(itemParam.toLowerCase())
    );
    if (foundPlan) {
      setActiveTab('plans');
      setSelectedItem({
        code: foundPlan.code,
        name: foundPlan.name,
        priceCents: foundPlan.priceCents,
        credits: foundPlan.monthlyCredits,
        isSubscription: true,
      });
    }
  }, [itemParam, products, plans, selectedItem]);

  const [billingType, setBillingType] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Estados do Pagamento Gerado
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResponse | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Estados do Cartão de Crédito Transparente
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(user?.fullName || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCcv, setCardCcv] = useState('');
  const [cardHolderCpf, setCardHolderCpf] = useState('');
  const [cardPostalCode, setCardPostalCode] = useState('');
  const [cardAddressNumber, setCardAddressNumber] = useState('');
  const [cardAddressComplement, setCardAddressComplement] = useState('');
  const [cardPhone, setCardPhone] = useState('');

  // Formatadores de Entrada
  const formatCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const formatCpfCnpj = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const formatCep = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 8);
    return digits.replace(/^(\d{5})(\d)/, '$1-$2');
  };

  const formatPhone = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
      return digits.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  // Carregar catálogo de produtos e planos
  useEffect(() => {
    let isMounted = true;
    api.billing
      .getCatalog()
      .then((res) => {
        if (!isMounted) return;
        if (res.products && res.products.length > 0) {
          setProducts(
            res.products.map((p: any) => ({
              code: p.code,
              kind: p.kind,
              name: p.name,
              description: p.description,
              credits: p.credits ?? 1,
              priceCents: p.priceCents ?? p.price_cents ?? 0,
              creditValidityDays: p.creditValidityDays ?? p.credit_validity_days ?? 365,
            }))
          );
        } else {
          setProducts(res.products || []);
        }
        if (res.plans && res.plans.length > 0) {
          setPlans(
            res.plans.map((p: any) => ({
              code: p.code,
              name: p.name,
              description: p.description,
              monthlyCredits: p.monthlyCredits ?? p.monthly_credits ?? 0,
              priceCents: p.priceCents ?? p.price_cents ?? 0,
            }))
          );
        }
      })
      .catch((err) => {
        console.warn('Falha no catálogo da API, usando catálogo canônico sincronizado:', err);
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
            code: 'pack_inicial',
            kind: 'credit_pack',
            name: 'Pacote Inicial',
            description: '5 créditos válidos por 1 ano.',
            credits: 5,
            priceCents: 1990,
            creditValidityDays: 365,
          },
          {
            code: 'pack_criador',
            kind: 'credit_pack',
            name: 'Pacote Criador',
            description: '10 créditos para criadores e ensaios.',
            credits: 10,
            priceCents: 3990,
            creditValidityDays: 365,
          },
          {
            code: 'pack_profissional',
            kind: 'credit_pack',
            name: 'Pacote Profissional',
            description: '30 créditos para profissionais com todos os 8 tipos de fotos.',
            credits: 30,
            priceCents: 7490,
            creditValidityDays: 365,
          },
        ]);
        setPlans([
          {
            code: 'pessoal',
            name: 'Plano Pessoal',
            description: '15 créditos mensais para criadores individuais e fotos pessoais.',
            monthlyCredits: 15,
            priceCents: 2990,
          },
          {
            code: 'pro',
            name: 'Plano Pro',
            description: '40 créditos mensais para lojas virtuais, fotógrafos e produção contínua.',
            monthlyCredits: 40,
            priceCents: 6990,
          },
          {
            code: 'business',
            name: 'Plano Business',
            description: '100 créditos mensais com todos os 8 tipos de fotos e 90 dias de histórico.',
            monthlyCredits: 100,
            priceCents: 15990,
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
    setAcceptTerms(false);
    setCardHolder(user?.fullName || '');
    setCardHolderCpf(cpfCnpj || '');
    setCardPhone((user as any)?.phone || '');
  };

  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (!acceptTerms) {
      error('É obrigatório concordar com os Termos de Uso e a Política de Privacidade para prosseguir com a compra.', 'Aceite Obrigatório');
      return;
    }

    setIsCheckingOut(true);
    try {
      if (billingType === 'PIX') {
        const cleanCpf = cpfCnpj.replace(/\D/g, '');
        if (cleanCpf.length < 11) {
          error('Informe um CPF ou CNPJ válido para gerar a cobrança Pix.', 'Documento Obrigatório');
          setIsCheckingOut(false);
          return;
        }

        if (selectedItem.isSubscription) {
          const subRes = await api.billing.createSubscription({
            planCode: selectedItem.code,
            billingType: 'PIX',
            cpfCnpj: cleanCpf,
          });

          if (subRes.firstPayment) {
            setCheckoutResult(subRes.firstPayment);
            if (subRes.firstPayment.pix?.payload) {
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
            billingType: 'PIX',
            cpfCnpj: cleanCpf,
            name: user?.fullName,
          });

          setCheckoutResult(payRes);

          if (payRes.pix?.payload) {
            const url = await QRCode.toDataURL(payRes.pix.payload, {
              margin: 1,
              width: 260,
            });
            setQrCodeDataUrl(url);
          }
        }
      } else {
        // CARTÃO DE CRÉDITO TRANSPARENTE
        const [expM, expY] = cardExpiry.split('/');
        const fullYear = expY && expY.length === 2 ? `20${expY}` : expY || '';
        const cleanCardNum = cardNumber.replace(/\D/g, '');
        const cleanCpf = (cardHolderCpf || cpfCnpj).replace(/\D/g, '');
        const cleanCep = cardPostalCode.replace(/\D/g, '');
        const cleanPhone = cardPhone.replace(/\D/g, '');

        if (cleanCardNum.length < 13) {
          error('Número de cartão incompleto ou inválido.', 'Cartão Inválido');
          setIsCheckingOut(false);
          return;
        }
        if (!cardHolder.trim()) {
          error('Informe o nome impresso no cartão.', 'Nome Obrigatório');
          setIsCheckingOut(false);
          return;
        }
        if (!expM || !fullYear || Number(expM) < 1 || Number(expM) > 12) {
          error('Data de validade do cartão inválida (use MM/AA).', 'Validade Inválida');
          setIsCheckingOut(false);
          return;
        }
        if (cardCcv.length < 3) {
          error('Código de segurança (CVV) inválido.', 'CVV Inválido');
          setIsCheckingOut(false);
          return;
        }
        if (cleanCpf.length < 11) {
          error('CPF ou CNPJ do titular é obrigatório.', 'Documento Inválido');
          setIsCheckingOut(false);
          return;
        }
        if (cleanCep.length < 8) {
          error('CEP de cobrança é obrigatório (8 dígitos).', 'CEP Inválido');
          setIsCheckingOut(false);
          return;
        }
        if (!cardAddressNumber.trim()) {
          error('Número do endereço de cobrança é obrigatório.', 'Endereço Inválido');
          setIsCheckingOut(false);
          return;
        }
        if (cleanPhone.length < 8) {
          error('Telefone de contato é obrigatório.', 'Telefone Inválido');
          setIsCheckingOut(false);
          return;
        }

        const creditCardPayload = {
          holderName: cardHolder.trim().toUpperCase(),
          number: cleanCardNum,
          expiryMonth: expM.padStart(2, '0'),
          expiryYear: fullYear,
          ccv: cardCcv.trim(),
        };

        const holderInfoPayload = {
          name: cardHolder.trim().toUpperCase(),
          email: user?.email || '',
          cpfCnpj: cleanCpf,
          postalCode: cleanCep,
          addressNumber: cardAddressNumber.trim(),
          addressComplement: cardAddressComplement.trim() || undefined,
          phone: cleanPhone,
          mobilePhone: cleanPhone,
        };

        if (selectedItem.isSubscription) {
          const subRes = await api.billing.createSubscription({
            planCode: selectedItem.code,
            billingType: 'CREDIT_CARD',
            cpfCnpj: cleanCpf,
            name: cardHolder.trim().toUpperCase(),
            phone: cleanPhone,
            creditCard: creditCardPayload,
            creditCardHolderInfo: holderInfoPayload,
          });

          if (
            subRes.status === 'active' ||
            subRes.creditsGranted ||
            ['CONFIRMED', 'RECEIVED'].includes(subRes.firstPayment?.status || '')
          ) {
            setPaymentConfirmed(true);
            await refreshWallet();
            success('Assinatura ativada com sucesso! Seus créditos mensais já estão liberados.', 'Plano Ativo');
            setTimeout(() => {
              setSelectedItem(null);
              navigate('/studio');
            }, 2500);
          } else {
            setCheckoutResult(subRes.firstPayment || null);
            info('Pagamento do cartão enviado ao Asaas.', 'Em Análise');
          }
        } else {
          const payRes = await api.billing.checkout({
            productCode: selectedItem.code,
            billingType: 'CREDIT_CARD',
            cpfCnpj: cleanCpf,
            name: cardHolder.trim().toUpperCase(),
            phone: cleanPhone,
            creditCard: creditCardPayload,
            creditCardHolderInfo: holderInfoPayload,
          });

          if (payRes.creditsGranted || ['CONFIRMED', 'RECEIVED'].includes(payRes.status)) {
            setPaymentConfirmed(true);
            await refreshWallet();
            success('Pagamento com cartão confirmado! Seus créditos já foram liberados.', 'Pagamento Aprovado');
            setTimeout(() => {
              setSelectedItem(null);
              navigate('/studio');
            }, 2500);
          } else {
            setCheckoutResult(payRes);
            info('Cobrança de cartão em processamento.', 'Em Processamento');
          }
        }
      }
    } catch (err: any) {
      error(err.message || 'Falha ao processar pagamento com Asaas.', 'Erro no Checkout');
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
          setTimeout(() => {
            setSelectedItem(null);
            navigate('/studio');
          }, 2500);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {products.map((prod) => {
            const isPro = prod.code === 'pack_criador' || prod.code === 'pack_pro';
            const priceCents = prod.priceCents ?? (prod as any).price_cents ?? 0;
            const validity = prod.creditValidityDays ?? (prod as any).credit_validity_days ?? 365;
            const priceFormatted = (priceCents / 100).toLocaleString('pt-BR', {
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
                features={(() => {
                  if (prod.code === 'single_edit') {
                    return [
                      '1 edição fotográfica com IA',
                      'Básico & Restauração + Ensaios & Retratos (2 tipos)',
                      'Retenção privativa de 30 dias',
                      'Download em PNG, JPG e WebP',
                      'Sem mensalidade',
                    ];
                  }
                  if (prod.code === 'pack_inicial') {
                    return [
                      '5 edições fotográficas com IA',
                      '4 tipos (+ Aniversários & Festas, Casamentos)',
                      'Retenção privativa de 30 dias',
                      'Validade dos créditos de 1 ano',
                      'Download em alta definição',
                    ];
                  }
                  if (prod.code === 'pack_criador') {
                    return [
                      '10 edições fotográficas com IA',
                      '6 tipos (+ Natureza & Paisagens, Eventos & Palco)',
                      'Retenção privativa de 30 dias',
                      'Validade dos créditos de 1 ano',
                      'Melhor custo-benefício para criadores',
                    ];
                  }
                  return [
                    '30 edições fotográficas com IA',
                    'Todos os 8 tipos de fotos (+ Comercial & E-commerce)',
                    'Retenção estendida de 50 dias',
                    'Validade dos créditos de 1 ano',
                    'Download em máxima definição',
                  ];
                })()}
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
        <div className={`grid ${plans.length <= 2 ? 'grid-cols-1 md:grid-cols-2 max-w-4xl' : 'grid-cols-1 md:grid-cols-3 max-w-5xl'} gap-6 mx-auto`}>
          {plans.map((plan) => {
            const isPopular = plan.code === 'pro' || plan.name?.toLowerCase().includes('pro');
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
                isPopular={isPopular}
                features={(() => {
                  if (plan.code === 'pessoal') {
                    return [
                      '15 créditos renovados todo mês',
                      'Fotos pessoais, retratos e restauração',
                      'Retenção garantida de 45 dias',
                      'Downloads em alta resolução (PNG, JPG, WebP)',
                      'Cancele quando quiser com 1 clique',
                    ];
                  }
                  if (plan.code === 'pro') {
                    return [
                      '40 créditos renovados todo mês',
                      'Exclusivo: Imagem Motion & Efeitos Visuais ✨',
                      'Retenção estendida de 60 dias',
                      'Sem fotografia Comercial & E-commerce',
                      'Cancele quando quiser com 1 clique',
                    ];
                  }
                  return [
                    '100 créditos renovados todo mês',
                    'Acesso total aos 8 tipos de fotos',
                    'Comercial & E-commerce + Imagem Motion',
                    'Retenção máxima de 90 dias',
                    'Prioridade máxima na fila de renderização',
                  ];
                })()}
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
                Parabéns! Seus {selectedItem.credits} créditos foram liberados e estão prontos para usar. Redirecionando para o estúdio...
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-2">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    setSelectedItem(null);
                    navigate('/studio');
                  }}
                  leftIcon={<Sparkles className="h-4 w-4" />}
                >
                  Abrir Estúdio & Criar Fotos
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    setSelectedItem(null);
                    navigate('/wallet');
                  }}
                  rightIcon={<Coins className="h-4 w-4" />}
                >
                  Ver Meus Créditos
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
                  <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Clock className="h-6 w-6 animate-pulse" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Pagamento em Processamento</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    Sua transação com cartão de crédito foi registrada e está em verificação pela operadora.
                    Assim que confirmada, seus {selectedItem.credits} créditos entrarão automaticamente no seu saldo.
                  </p>
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => {
                        setSelectedItem(null);
                        navigate('/studio');
                      }}
                      leftIcon={<Sparkles className="h-4 w-4" />}
                    >
                      Ir para o Estúdio
                    </Button>
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => {
                        setSelectedItem(null);
                        navigate('/wallet');
                      }}
                      rightIcon={<Coins className="h-4 w-4" />}
                    >
                      Acompanhar na Carteira
                    </Button>
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

              {billingType === 'PIX' ? (
                <Input
                  label="CPF ou CNPJ (obrigatório para emissão de Pix)"
                  placeholder="000.000.000-00"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
                  helperText="Exigência regulatória do Banco Central para emissão do QR Code Pix"
                  required
                />
              ) : (
                <div className="space-y-3 p-3.5 bg-secondary/30 rounded-xl border border-border/80">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4 text-primary" />
                      Cartão de Crédito Transparente
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Checkout Seguro Asaas
                    </span>
                  </div>

                  <Input
                    label="Número do Cartão"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    required
                  />

                  <Input
                    label="Nome Impresso no Cartão"
                    placeholder="NOME COMO NO CARTÃO"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    required
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Validade (Mês/Ano)"
                      placeholder="MM/AA"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      required
                    />
                    <Input
                      label="CVV / Código"
                      placeholder="123"
                      type="password"
                      maxLength={4}
                      value={cardCcv}
                      onChange={(e) => setCardCcv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="CPF ou CNPJ do Titular"
                      placeholder="000.000.000-00"
                      value={cardHolderCpf}
                      onChange={(e) => setCardHolderCpf(formatCpfCnpj(e.target.value))}
                      required
                    />
                    <Input
                      label="WhatsApp / Telefone"
                      placeholder="(00) 00000-0000"
                      value={cardPhone}
                      onChange={(e) => setCardPhone(formatPhone(e.target.value))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <Input
                        label="CEP"
                        placeholder="00000-000"
                        value={cardPostalCode}
                        onChange={(e) => setCardPostalCode(formatCep(e.target.value))}
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      <Input
                        label="Número"
                        placeholder="123"
                        value={cardAddressNumber}
                        onChange={(e) => setCardAddressNumber(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      <Input
                        label="Comp. (opcional)"
                        placeholder="Apto/Sala"
                        value={cardAddressComplement}
                        onChange={(e) => setCardAddressComplement(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Consentimento Obrigatório de Termos e Privacidade no Checkout */}
              <div className="pt-2 border-t border-border/60">
                <Checkbox
                  id="checkoutTermsAccept"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  label={
                    <span className="text-xs">
                      Declaro que li e concordo com os{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setLegalModalTab('terms');
                          setLegalModalOpen(true);
                        }}
                        className="text-primary hover:underline font-semibold"
                      >
                        Termos de Uso
                      </button>{' '}
                      e a{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setLegalModalTab('privacy');
                          setLegalModalOpen(true);
                        }}
                        className="text-primary hover:underline font-semibold"
                      >
                        Política de Privacidade (LGPD)
                      </button>
                    </span>
                  }
                  description="Seus dados estão protegidos pela LGPD e intermediados com segurança pelo Asaas."
                  required
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  type="submit"
                  variant="gold"
                  fullWidth
                  isLoading={isCheckingOut}
                  loadingText={billingType === 'PIX' ? 'Gerando QR Code Pix...' : 'Processando cartão com segurança...'}
                  leftIcon={billingType === 'PIX' ? <QrCode className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                >
                  {billingType === 'PIX'
                    ? 'Gerar QR Code Pix'
                    : `Pagar ${(selectedItem.priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} e Liberar Créditos`}
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
                <span>Processamento transparente direto Asaas • Criptografia bancária de ponta a ponta</span>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Modal de Termos de Uso e Política de Privacidade */}
      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalModalTab}
      />
    </div>
  );
};
