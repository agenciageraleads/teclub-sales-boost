import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MarketingCampaign, CampaignMessage, FollowupTemplate } from '@/types/database';
import { 
  Megaphone, 
  Plus, 
  MessageSquare, 
  Image, 
  Video, 
  FileText,
  Trash2,
  Settings,
  Clock,
  Loader2
} from 'lucide-react';

export default function Marketing() {
  const { role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [templates, setTemplates] = useState<FollowupTemplate[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<MarketingCampaign | null>(null);
  const [messages, setMessages] = useState<CampaignMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  
  // Form states
  const [newCampaign, setNewCampaign] = useState({ nome: '', descricao: '' });
  const [newMessage, setNewMessage] = useState({ 
    tipo: 'texto' as 'texto' | 'imagem' | 'video', 
    conteudo: '', 
    media_url: '',
    dias_apos_entrada: 0,
    dias_apos_ultimo_followup: null as number | null,
    ordem: 0
  });
  const [newTemplate, setNewTemplate] = useState({ nome: '', mensagem: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && role !== 'gestor') {
      navigate('/');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [campaignsRes, templatesRes] = await Promise.all([
      supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('followup_templates').select('*').order('nome')
    ]);

    if (campaignsRes.data) setCampaigns(campaignsRes.data);
    if (templatesRes.data) setTemplates(templatesRes.data);
    
    setLoading(false);
  };

  const fetchMessages = async (campaignId: string) => {
    const { data } = await supabase
      .from('campaign_messages')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('ordem');
    
    if (data) setMessages(data as CampaignMessage[]);
  };

  const handleSelectCampaign = (campaign: MarketingCampaign) => {
    setSelectedCampaign(campaign);
    fetchMessages(campaign.id);
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .insert({
        nome: newCampaign.nome,
        descricao: newCampaign.descricao || null,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) {
      toast.error('Erro ao criar campanha');
    } else {
      toast.success('Campanha criada!');
      setCampaigns([data, ...campaigns]);
      setNewCampaign({ nome: '', descricao: '' });
      setCampaignDialogOpen(false);
    }
    setSaving(false);
  };

  const handleCreateMessage = async () => {
    if (!selectedCampaign || !newMessage.conteudo.trim()) {
      toast.error('Conteúdo é obrigatório');
      return;
    }
    
    setSaving(true);
    
    const { data, error } = await supabase
      .from('campaign_messages')
      .insert({
        campaign_id: selectedCampaign.id,
        tipo: newMessage.tipo,
        conteudo: newMessage.conteudo,
        media_url: newMessage.media_url || null,
        dias_apos_entrada: newMessage.dias_apos_entrada,
        dias_apos_ultimo_followup: newMessage.dias_apos_ultimo_followup,
        ordem: messages.length
      })
      .select()
      .single();

    if (error) {
      toast.error('Erro ao criar mensagem');
    } else {
      toast.success('Mensagem adicionada!');
      setMessages([...messages, data as CampaignMessage]);
      setNewMessage({ tipo: 'texto', conteudo: '', media_url: '', dias_apos_entrada: 0, dias_apos_ultimo_followup: null, ordem: 0 });
      setMessageDialogOpen(false);
    }
    setSaving(false);
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('campaign_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      toast.error('Erro ao excluir mensagem');
    } else {
      setMessages(messages.filter(m => m.id !== messageId));
      toast.success('Mensagem excluída');
    }
  };

  const handleToggleCampaign = async (campaign: MarketingCampaign) => {
    const { error } = await supabase
      .from('marketing_campaigns')
      .update({ ativo: !campaign.ativo })
      .eq('id', campaign.id);

    if (error) {
      toast.error('Erro ao atualizar campanha');
    } else {
      setCampaigns(campaigns.map(c => 
        c.id === campaign.id ? { ...c, ativo: !c.ativo } : c
      ));
      if (selectedCampaign?.id === campaign.id) {
        setSelectedCampaign({ ...selectedCampaign, ativo: !selectedCampaign.ativo });
      }
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.nome.trim() || !newTemplate.mensagem.trim()) {
      toast.error('Nome e mensagem são obrigatórios');
      return;
    }
    
    setSaving(true);
    
    const { data, error } = await supabase
      .from('followup_templates')
      .insert(newTemplate)
      .select()
      .single();

    if (error) {
      toast.error('Erro ao criar template');
    } else {
      toast.success('Template criado!');
      setTemplates([...templates, data]);
      setNewTemplate({ nome: '', mensagem: '' });
      setTemplateDialogOpen(false);
    }
    setSaving(false);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const { error } = await supabase
      .from('followup_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      toast.error('Erro ao excluir template');
    } else {
      setTemplates(templates.filter(t => t.id !== templateId));
      toast.success('Template excluído');
    }
  };

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'imagem': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-accent" />
              Marketing & Automação
            </h1>
            <p className="text-muted-foreground">
              Gerencie campanhas e mensagens automáticas de WhatsApp
            </p>
          </div>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-4">
          <TabsList>
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
            <TabsTrigger value="templates">Templates de Follow-up</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Lista de Campanhas */}
              <Card className="lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Campanhas</CardTitle>
                  <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1">
                        <Plus className="w-4 h-4" />
                        Nova
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nova Campanha</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Nome</Label>
                          <Input
                            value={newCampaign.nome}
                            onChange={(e) => setNewCampaign({ ...newCampaign, nome: e.target.value })}
                            placeholder="Ex: Funil de Boas-vindas"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Descrição</Label>
                          <Textarea
                            value={newCampaign.descricao}
                            onChange={(e) => setNewCampaign({ ...newCampaign, descricao: e.target.value })}
                            placeholder="Descreva o objetivo da campanha..."
                          />
                        </div>
                        <Button onClick={handleCreateCampaign} disabled={saving} className="w-full">
                          {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                          Criar Campanha
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="space-y-2">
                  {campaigns.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      Nenhuma campanha criada
                    </p>
                  ) : (
                    campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        onClick={() => handleSelectCampaign(campaign)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedCampaign?.id === campaign.id 
                            ? 'border-accent bg-accent/5' 
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{campaign.nome}</span>
                          <Badge variant={campaign.ativo ? 'default' : 'secondary'} className="text-xs">
                            {campaign.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        {campaign.descricao && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {campaign.descricao}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Detalhes da Campanha */}
              <Card className="lg:col-span-2">
                {selectedCampaign ? (
                  <>
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                      <div>
                        <CardTitle className="text-base">{selectedCampaign.nome}</CardTitle>
                        <CardDescription>{selectedCampaign.descricao || 'Sem descrição'}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={selectedCampaign.ativo}
                          onCheckedChange={() => handleToggleCampaign(selectedCampaign)}
                        />
                        <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="gap-1">
                              <Plus className="w-4 h-4" />
                              Mensagem
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Nova Mensagem</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Tipo</Label>
                                <Select
                                  value={newMessage.tipo}
                                  onValueChange={(v) => setNewMessage({ ...newMessage, tipo: v as 'texto' | 'imagem' | 'video' })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="texto">Texto</SelectItem>
                                    <SelectItem value="imagem">Imagem</SelectItem>
                                    <SelectItem value="video">Vídeo</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-2">
                                <Label>Conteúdo / Legenda</Label>
                                <Textarea
                                  value={newMessage.conteudo}
                                  onChange={(e) => setNewMessage({ ...newMessage, conteudo: e.target.value })}
                                  placeholder="Mensagem a ser enviada..."
                                  rows={4}
                                />
                              </div>
                              
                              {(newMessage.tipo === 'imagem' || newMessage.tipo === 'video') && (
                                <div className="space-y-2">
                                  <Label>URL da Mídia</Label>
                                  <Input
                                    value={newMessage.media_url}
                                    onChange={(e) => setNewMessage({ ...newMessage, media_url: e.target.value })}
                                    placeholder="https://..."
                                  />
                                </div>
                              )}
                              
                              <div className="space-y-2">
                                <Label>Dias após entrada do lead</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  value={newMessage.dias_apos_entrada}
                                  onChange={(e) => setNewMessage({ ...newMessage, dias_apos_entrada: parseInt(e.target.value) || 0 })}
                                />
                                <p className="text-xs text-muted-foreground">
                                  0 = envia imediatamente após entrar em atendimento
                                </p>
                              </div>
                              
                              <Button onClick={handleCreateMessage} disabled={saving} className="w-full">
                                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                Adicionar Mensagem
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {messages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhuma mensagem configurada</p>
                          <p className="text-xs">Adicione mensagens para o funil de relacionamento</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {messages.map((message, index) => (
                            <div key={message.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 text-accent shrink-0">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {getTypeIcon(message.tipo)}
                                  <Badge variant="outline" className="text-xs">
                                    {message.tipo}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {message.dias_apos_entrada === 0 
                                      ? 'Imediato' 
                                      : `${message.dias_apos_entrada} dia(s) após`}
                                  </span>
                                </div>
                                <p className="text-sm line-clamp-2">{message.conteudo}</p>
                                {message.media_url && (
                                  <p className="text-xs text-muted-foreground mt-1 truncate">
                                    📎 {message.media_url}
                                  </p>
                                )}
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir mensagem?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteMessage(message.id)}
                                      className="bg-destructive text-destructive-foreground"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center">
                      <Settings className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Selecione uma campanha</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Configuração da Evolution API
                </CardTitle>
                <CardDescription>
                  Configure a URL e API Key da Evolution API para envio de mensagens pelo WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  ⚠️ Para ativar o envio automático, você precisará fornecer a URL e API Key da Evolution API. 
                  Entre em contato para configurar.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Templates de Follow-up</CardTitle>
                  <CardDescription>
                    Mensagens pré-configuradas para envio rápido via WhatsApp Web
                  </CardDescription>
                </div>
                <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <Plus className="w-4 h-4" />
                      Novo Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo Template</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input
                          value={newTemplate.nome}
                          onChange={(e) => setNewTemplate({ ...newTemplate, nome: e.target.value })}
                          placeholder="Ex: Follow-up Padrão"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Mensagem</Label>
                        <Textarea
                          value={newTemplate.mensagem}
                          onChange={(e) => setNewTemplate({ ...newTemplate, mensagem: e.target.value })}
                          placeholder="Use {nome} para inserir o nome do lead..."
                          rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                          Variáveis disponíveis: {'{nome}'}, {'{contato}'}
                        </p>
                      </div>
                      <Button onClick={handleCreateTemplate} disabled={saving} className="w-full">
                        {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Criar Template
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {templates.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Nenhum template criado
                  </p>
                ) : (
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <div key={template.id} className="flex items-start gap-3 p-3 rounded-lg border">
                        <MessageSquare className="w-4 h-4 mt-1 text-accent shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{template.nome}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{template.mensagem}</p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir template?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
