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
  Input,
  Switch,
  Modal,
  Alert,
  Skeleton,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  useToast,
} from '@/design-system';
import {
  User as UserIcon,
  ShieldCheck,
  Download,
  Trash2,
  KeyRound,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Lock,
  LogOut,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, UserSession } from '@/lib/api-client';

export const AccountPage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const { success, error, info } = useToast();

  // Estados de Perfil
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Estados de Sessões Ativas
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  // Estados de Consentimentos LGPD
  const [consents, setConsents] = useState<
    Array<{ consentType: string; version: string; acceptedAt: string }>
  >([]);

  // Estados de MFA TOTP
  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaOtpauthUrl, setMfaOtpauthUrl] = useState('');
  const [mfaQrCodeUrl, setMfaQrCodeUrl] = useState('');
  const [mfaVerifyCode, setMfaVerifyCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isSettingUpMfa, setIsSettingUpMfa] = useState(false);

  // Estados de Exportação e Exclusão
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Carregar dados de conta e sessões
  useEffect(() => {
    let isMounted = true;

    // Perfil
    api.account
      .getProfile()
      .then((p) => {
        if (!isMounted) return;
        setFullName(p.fullName || '');
        setPhone(p.phone || '');
        setMarketingOptIn(p.marketingOptIn || false);
      })
      .catch(() => {});

    // Sessões
    api.auth
      .listSessions()
      .then((res) => {
        if (!isMounted) return;
        setSessions(res.items || []);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingSessions(false);
      });

    // Consentimentos
    api.account
      .getConsents()
      .then((res) => {
        if (!isMounted) return;
        setConsents(res || []);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await api.account.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        marketingOptIn,
      });
      await refreshUser();
      success('Dados do perfil atualizados com sucesso!', 'Perfil Salvo');
    } catch (err: any) {
      error(err.message || 'Falha ao atualizar dados de perfil.', 'Erro');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await api.account.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dados_pessoais_alegon_${user?.id || 'titular'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      success('Arquivo JSON com todos os dados pessoais do titular gerado.', 'Exportação LGPD');
    } catch (err: any) {
      error(err.message || 'Falha ao exportar dados da conta.', 'Erro na Exportação');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.auth.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      success('Sessão desconectada com sucesso.', 'Sessão Encerrada');
    } catch (err: any) {
      error(err.message || 'Falha ao revogar sessão.', 'Erro');
    }
  };

  const handleRevokeOtherSessions = async () => {
    try {
      await api.auth.revokeOtherSessions();
      setSessions((prev) => prev.filter((s) => s.current));
      success('Todas as outras sessões foram revogadas.', 'Sessões Revogadas');
    } catch (err: any) {
      error(err.message || 'Falha ao revogar outras sessões.', 'Erro');
    }
  };

  // Configuração de MFA TOTP
  const handleStartMfaSetup = async () => {
    setIsSettingUpMfa(true);
    try {
      const res = await api.auth.setupMfa();
      setMfaSecret(res.secret);
      setMfaOtpauthUrl(res.otpauthUrl);
      const qr = await QRCode.toDataURL(res.otpauthUrl, { margin: 1, width: 220 });
      setMfaQrCodeUrl(qr);
      setIsMfaModalOpen(true);
    } catch (err: any) {
      error(err.message || 'Falha ao iniciar configuração de MFA.', 'Erro');
    } finally {
      setIsSettingUpMfa(false);
    }
  };

  const handleConfirmEnableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.auth.enableMfa(mfaVerifyCode.trim());
      setRecoveryCodes(res.recoveryCodes || []);
      await refreshUser();
      success('Autenticação em dois fatores ativada com sucesso!', 'MFA Ativado');
    } catch (err: any) {
      error(err.message || 'Código de 6 dígitos inválido. Tente novamente.', 'Falha');
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== 'EXCLUIR') {
      error('Digite EXCLUIR exatamente para prosseguir.', 'Confirmação Incorreta');
      return;
    }

    setIsDeletingAccount(true);
    try {
      await api.account.deleteAccount(deletePassword);
      success('Conta e imagens programadas para exclusão imediata.', 'Conta Excluída');
      await logout();
      window.location.href = '/';
    } catch (err: any) {
      error(err.message || 'Falha ao excluir a conta.', 'Erro');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <PageHeader
        title="Minha Conta & Direitos LGPD"
        description="Gerencie seus dados de acesso, sessões ativas e exerça seus direitos de titularidade de dados."
        badge={<Badge variant="secondary">Titular Protegido</Badge>}
      />

      {/* Perfil Básico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-primary" />
            Dados Cadastrais
          </CardTitle>
          <CardDescription className="text-xs">
            Informações associadas à sua conta no ALEGON AI Photo Studio.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSaveProfile}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nome Completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <Input
                label="E-mail Cadastrado"
                value={user?.email || ''}
                disabled
                helperText="O e-mail principal é seu identificador único no sistema"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Telefone / WhatsApp (Opcional)"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <div className="pt-6">
                <Switch
                  checked={marketingOptIn}
                  onChange={setMarketingOptIn}
                  label="Receber novidades de modelos e descontos"
                  description="Comunicações ocasionais sobre melhorias de IA"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSavingProfile}
              loadingText="Salvando perfil..."
            >
              Salvar Alterações
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Segurança & Autenticação de Dois Fatores (MFA) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            Segurança & Segundo Fator (MFA / TOTP)
          </CardTitle>
          <CardDescription className="text-xs">
            Adicione uma camada extra de proteção à sua conta e imagens com aplicativo autenticador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl bg-secondary/50 border border-border flex items-center justify-between">
            <div className="space-y-1">
              <span className="font-semibold text-xs text-foreground block">
                Status do MFA:{' '}
                {user?.mfaEnabled ? (
                  <Badge variant="success" size="sm" className="ml-1">
                    Ativo & Protegido
                  </Badge>
                ) : (
                  <Badge variant="secondary" size="sm" className="ml-1">
                    Não configurado
                  </Badge>
                )}
              </span>
              <p className="text-[11px] text-muted-foreground">
                Exige um código de 6 dígitos do Google Authenticator ou Authy a cada login.
              </p>
            </div>

            {!user?.mfaEnabled ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartMfaSetup}
                isLoading={isSettingUpMfa}
                loadingText="Gerando segredo..."
                leftIcon={<ShieldCheck className="h-4 w-4 text-emerald-500" />}
              >
                Configurar MFA
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  info(
                    'Para desativar o MFA, utilize as opções de redefinição de segurança.',
                    'MFA Ativo'
                  )
                }
              >
                MFA Habilitado
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sessões Conectadas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Laptop className="h-4 w-4 text-muted-foreground" />
              Sessões Ativas
            </CardTitle>
            <CardDescription className="text-xs">
              Dispositivos com acesso autenticado ao seu estúdio.
            </CardDescription>
          </div>
          {sessions.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevokeOtherSessions}
              leftIcon={<LogOut className="h-3.5 w-3.5" />}
            >
              Desconectar Outras Sessões
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoadingSessions ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : (
            <div className="space-y-3">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-3 rounded-xl border border-border bg-secondary/30 flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground truncate max-w-md">
                        {sess.userAgent || 'Navegador Web'}
                      </span>
                      {sess.current && (
                        <Badge variant="success" size="sm">
                          Sessão Atual
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Último acesso em: {new Date(sess.lastSeenAt).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  {!sess.current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeSession(sess.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      Revogar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Direitos do Titular LGPD (Exportação e Exclusão) */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Direitos do Titular de Dados (LGPD)
          </CardTitle>
          <CardDescription className="text-xs">
            Exerça seus direitos garantidos pela Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Exportação Completa */}
          <div className="p-4 rounded-xl bg-secondary/50 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-semibold text-xs text-foreground block">
                Exportar Todos os Dados Pessoais
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Gere um arquivo estruturado JSON com histórico de transações, consentimentos registrados e metadados de imagens.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              isLoading={isExporting}
              loadingText="Exportando..."
              leftIcon={<Download className="h-4 w-4" />}
            >
              Exportar Meus Dados
            </Button>
          </div>

          {/* Histórico de Consentimentos */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/80 space-y-2">
            <span className="font-semibold text-xs text-foreground block">
              Consentimentos Registrados
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
              <div className="p-2 rounded-lg bg-card border border-border flex items-center justify-between">
                <span>Termos de Serviço</span>
                <Badge variant="secondary" size="sm">
                  v1.0 Aceito
                </Badge>
              </div>
              <div className="p-2 rounded-lg bg-card border border-border flex items-center justify-between">
                <span>Política de Privacidade LGPD</span>
                <Badge variant="secondary" size="sm">
                  v1.0 Aceito
                </Badge>
              </div>
            </div>
          </div>

          {/* Exclusão Definitiva de Conta */}
          <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-semibold text-xs text-destructive flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Exclusão Definitiva de Conta & Imagens
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Elimina permanentemente suas imagens no Cloudflare R2 e anonimiza seus dados cadastrais.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Solicitar Exclusão
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* MODAL CONFIGURAÇÃO MFA TOTP */}
      <Modal
        isOpen={isMfaModalOpen}
        onClose={() => setIsMfaModalOpen(false)}
        title="Configurar Autenticação em Dois Fatores"
        description="Escaneie o código QR com o Google Authenticator ou Authy para ativar a proteção extra."
      >
        {recoveryCodes.length > 0 ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-sm text-foreground">Códigos de Recuperação de Emergência</h3>
            <p className="text-xs text-muted-foreground">
              Guarde estes códigos em local seguro. Cada código pode ser utilizado uma única vez caso você perca seu telefone.
            </p>
            <div className="p-3 bg-secondary rounded-xl font-mono text-xs text-foreground grid grid-cols-2 gap-2 text-center">
              {recoveryCodes.map((c, i) => (
                <span key={i} className="p-1 bg-background rounded-md border border-border">
                  {c}
                </span>
              ))}
            </div>
            <Button variant="primary" fullWidth onClick={() => setIsMfaModalOpen(false)}>
              Concluir e Fechar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleConfirmEnableMfa} className="space-y-4">
            {mfaQrCodeUrl && (
              <div className="p-3 bg-white rounded-xl w-fit mx-auto border border-border shadow-xs">
                <img src={mfaQrCodeUrl} alt="QR Code MFA" className="w-48 h-48 mx-auto" />
              </div>
            )}

            <div className="text-center text-xs space-y-1">
              <span className="text-muted-foreground">Chave secreta de configuração manual:</span>
              <div className="font-mono text-xs font-bold text-foreground bg-secondary py-1 px-2 rounded-lg select-all">
                {mfaSecret}
              </div>
            </div>

            <Input
              label="Código de Verificação de 6 Dígitos"
              placeholder="000000"
              maxLength={6}
              value={mfaVerifyCode}
              onChange={(e) => setMfaVerifyCode(e.target.value.replace(/\D/g, ''))}
              required
              helperText="Digite o código atual gerado pelo seu autenticador para confirmar"
            />

            <div className="pt-2 flex flex-col gap-2">
              <Button type="submit" variant="primary" fullWidth>
                Verificar e Ativar MFA
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsMfaModalOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL EXCLUSÃO DE CONTA */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Exclusão Definitiva de Conta"
        description="Esta ação é permanente e irreversível. Todos os seus arquivos fotográficos no R2 serão excluídos imediatamente."
      >
        <form onSubmit={handleDeleteAccount} className="space-y-4">
          <Alert variant="danger">
            Ao confirmar, todas as fotos, versões e créditos restantes serão eliminados de forma definitiva conforme o artigo 18 da LGPD.
          </Alert>

          <Input
            label="Digite a palavra EXCLUIR em maiúsculas"
            placeholder="EXCLUIR"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            required
          />

          <Input
            label="Sua Senha de Acesso"
            type="password"
            placeholder="••••••••••"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            required
          />

          <div className="pt-2 flex flex-col gap-2">
            <Button
              type="submit"
              variant="danger"
              fullWidth
              isLoading={isDeletingAccount}
              loadingText="Excluindo conta e imagens..."
              disabled={deleteConfirmText !== 'EXCLUIR'}
            >
              Excluir Minha Conta Definitivamente
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
