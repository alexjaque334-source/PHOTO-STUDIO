/**
 * Catálogo Oficial dos 70 Comandos Internos de IA — ALEGON AI Photo Studio.
 * Dono: OpenRouter AI Specialist & Tech Lead.
 * 
 * ESTRUTURA OBRIGATÓRIA DE CADA COMANDO:
 * 1. internalName: identificador único utilizado pelo backend.
 * 2. intent: o que o cliente deseja visualmente.
 * 3. userPhrases: exemplos de solicitações em português brasileiro informal.
 * 4. technicalPrompt: instrução avançada de edição construída automaticamente.
 * 5. category: classificação interna da operação.
 * 6. complexity: 'low' | 'medium' | 'high'.
 * 7. suggestedCredits: estimativa inicial de créditos (configurável pelo admin).
 */

export interface InternalCommand {
  id: number;
  internalName: string;
  intent: string;
  userPhrases: string[];
  technicalPrompt: string;
  category:
    | 'Básico'
    | 'Ensaios'
    | 'Aniversários'
    | 'Casamentos'
    | 'Natureza'
    | 'Eventos'
    | 'Motion visual'
    | 'Comercial';
  complexity: 'low' | 'medium' | 'high';
  suggestedCredits: number;
  tags: string[];
}

export const COMMANDS_CATALOG: InternalCommand[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // 14 COMANDOS BÁSICOS PRESERVADOS (IDs 1 a 14)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 1,
    internalName: 'remove_background',
    intent: 'Remover o fundo da imagem e isolar o assunto principal em estúdio neutro.',
    userPhrases: ['Tira o fundo', 'Remove o fundo', 'Fundo de estúdio', 'Isola a pessoa'],
    technicalPrompt:
      'Isolate the main subject from the original background. Place on a clean, neutral high-end studio backdrop with natural soft ground contact shadow. Preserve subject identity, hair edge detail, and true proportions.',
    category: 'Básico',
    complexity: 'low',
    suggestedCredits: 1,
    tags: ['fundo', 'remover', 'estudio', 'isolar', 'neutro'],
  },
  {
    id: 2,
    internalName: 'transparent_background',
    intent: 'Recortar o assunto em alta resolução com canal alfa transparente puro.',
    userPhrases: ['Fundo transparente', 'Foto em PNG', 'Recorta sem fundo', 'Sem nada atrás'],
    technicalPrompt:
      'Extract main foreground subject with pixel-perfect sub-pixel alpha transparency. Clean anti-aliased hair boundaries, zero color bleeding from original background. Output on pure transparent alpha channel.',
    category: 'Básico',
    complexity: 'low',
    suggestedCredits: 1,
    tags: ['png', 'transparente', 'recorte', 'alfa', 'vazado'],
  },
  {
    id: 3,
    internalName: 'replace_background',
    intent: 'Substituir o fundo por um novo cenário solicitado.',
    userPhrases: ['Muda o fundo', 'Troca o cenário', 'Coloca outro fundo', 'Muda o que tá atrás'],
    technicalPrompt:
      'Seamlessly replace background with the requested setting while keeping foreground subject completely intact. Match ambient color temperature, directional lighting, depth of field, and ground contact shadows.',
    category: 'Básico',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['fundo', 'cenario', 'trocar', 'substituir', 'ambiente'],
  },
  {
    id: 4,
    internalName: 'remove_people',
    intent: 'Eliminar pessoas indesejadas, pedestres e figurantes ao fundo.',
    userPhrases: ['Tira as pessoas atrás', 'Apaga os figurantes', 'Remove quem tá no fundo', 'Só eu na foto'],
    technicalPrompt:
      'Erase photobombers, background pedestrians, and unwanted persons. Inpaint the occluded background with photorealistic environmental continuity, matching perspective, architecture, and lighting.',
    category: 'Básico',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['remover', 'pessoas', 'figurantes', 'pedestres', 'apagar'],
  },
  {
    id: 5,
    internalName: 'remove_objects',
    intent: 'Remover objetos, placas, postes ou distrações indesejadas da foto.',
    userPhrases: ['Tira esse objeto', 'Apaga o poste', 'Limpa a foto', 'Tira a sujeira'],
    technicalPrompt:
      'Erase specified unwanted objects, clutter, power lines, and distractions. Photorealistically reconstruct surfaces with consistent texture, grain, and ambient illumination.',
    category: 'Básico',
    complexity: 'low',
    suggestedCredits: 1,
    tags: ['objeto', 'apagar', 'remover', 'limpar', 'placa', 'poste'],
  },
  {
    id: 6,
    internalName: 'improve_lighting',
    intent: 'Corrigir iluminação fraca, sombras duras ou superexposição com luz de estúdio.',
    userPhrases: ['Melhora a iluminação', 'Clareia a foto', 'Ajusta a luz', 'Tira a sombra do rosto'],
    technicalPrompt:
      'Enhance lighting using professional soft diffuse illumination. Balance exposure, recover shadow details without noise, control highlight rolloff, and add subtle three-dimensional rim light while preserving identity.',
    category: 'Básico',
    complexity: 'low',
    suggestedCredits: 1,
    tags: ['luz', 'iluminacao', 'clarear', 'sombra', 'exposicao'],
  },
  {
    id: 7,
    internalName: 'improve_colors',
    intent: 'Calibrar balanço de cores, tons de pele e saturação cinematográfica.',
    userPhrases: ['Melhora as cores', 'Deixa mais viva', 'Corrige a cor', 'Pele bonita'],
    technicalPrompt:
      'Perform color grading and white balance calibration. Deliver radiant, natural skin tones, deep rich shadows, vibrant yet authentic color gamut, and subtle analog film color balance.',
    category: 'Básico',
    complexity: 'low',
    suggestedCredits: 1,
    tags: ['cor', 'cores', 'colorir', 'pele', 'saturacao', 'vivo'],
  },
  {
    id: 8,
    internalName: 'sharpen',
    intent: 'Aumentar a nitidez óptica e super-resolução sem artefatos plásticos.',
    userPhrases: ['Aumenta a nitidez', 'Deixa mais nítida', 'Melhora a resolução', 'Foco perfeito'],
    technicalPrompt:
      'Apply optical super-resolution and micro-contrast enhancement. Reveal fine hair strands, fabric weave, and eyelash details while preserving authentic film grain and avoiding over-sharpened halo artifacts.',
    category: 'Básico',
    complexity: 'low',
    suggestedCredits: 1,
    tags: ['nitidez', 'resolucao', 'foco', 'detalhes', 'qualidade'],
  },
  {
    id: 9,
    internalName: 'restore_photo',
    intent: 'Restaurar fotografia antiga danificada, removendo arranhões e recuperando nitidez.',
    userPhrases: ['Restaura foto antiga', 'Recupera foto rasgada', 'Foto velha', 'Conserta foto antiga'],
    technicalPrompt:
      'Restore vintage damaged photograph. Repair scratches, creases, water damage, stains, and faded dye. Enhance facial clarity and historical authenticity with natural tones and balanced tonal range.',
    category: 'Básico',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['restaurar', 'antiga', 'velha', 'rasgada', 'mancha', 'recuperar'],
  },
  {
    id: 10,
    internalName: 'product_photo',
    intent: 'Transformar fotografia de produto em foto profissional de catálogo comercial.',
    userPhrases: ['Foto de produto', 'Foto pra vender', 'Foto pra e-commerce', 'Foto de catálogo'],
    technicalPrompt:
      'Elevate product photograph into high-end e-commerce editorial imagery. Refined studio lighting, clean reflection control, pristine surface finish, and exact preservation of product geometry and branding.',
    category: 'Básico',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['produto', 'vender', 'ecommerce', 'loja', 'catalogo'],
  },
  {
    id: 11,
    internalName: 'add_elements',
    intent: 'Inserir adereços, objetos decorativos ou elementos visuais mantendo a física da cena.',
    userPhrases: ['Coloca um chapéu', 'Adiciona flores', 'Coloca óculos', 'Bota elementos'],
    technicalPrompt:
      'Seamlessly insert requested elements with correct spatial occlusion, perspective lines, cast shadows, and natural ambient light interaction with the original subjects.',
    category: 'Básico',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['adicionar', 'colocar', 'inserir', 'aderecos', 'objetos'],
  },
  {
    id: 12,
    internalName: 'replace_elements',
    intent: 'Substituir roupas, móveis ou detalhes específicos por novos itens fotorrealistas.',
    userPhrases: ['Troca minha roupa', 'Muda a cor da camisa', 'Troca o casaco', 'Muda o vestido'],
    technicalPrompt:
      'Replace designated garment or element with requested alternative. Ensure natural fabric folds, body contours, photorealistic texture, and seamless boundary blending without altering face or body.',
    category: 'Básico',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['trocar', 'mudar', 'roupa', 'camisa', 'vestido', 'substituir'],
  },
  {
    id: 13,
    internalName: 'variations',
    intent: 'Gerar variações criativas e alternativas estéticas da imagem.',
    userPhrases: ['Gera variações', 'Me dá opções diferentes', 'Outras versões', 'Faz alternativas'],
    technicalPrompt:
      'Generate creative aesthetic variations of the original photograph exploring distinct camera angles, lighting moods, and editorial compositions while strictly maintaining subject identity.',
    category: 'Básico',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['variacoes', 'opcoes', 'alternativas', 'versoes'],
  },
  {
    id: 14,
    internalName: 'free_prompt',
    intent: 'Edição livre e composições artísticas personalizadas descritas pelo usuário.',
    userPhrases: ['Edição livre', 'Faz o que eu escrever', 'Criação livre', 'Do meu jeito'],
    technicalPrompt:
      'Execute customized photo transformation according to user creative vision. Prioritize photographic authenticity, anatomical accuracy, skin realism, and physical consistency.',
    category: 'Básico',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['livre', 'prompt', 'personalizado', 'customizado'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORIA A — ENSAIOS FOTOGRÁFICOS (IDs 15 a 22)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 15,
    internalName: 'studio_portrait',
    intent: 'Transformar uma foto comum em um retrato profissional de estúdio.',
    userPhrases: ['Deixa minha foto profissional', 'Quero parecer que tirei em estúdio', 'Foto de estúdio', 'Faz um ensaio fotográfico meu'],
    technicalPrompt:
      'Transform the photograph into a realistic studio portrait, with softbox lighting, natural shadows, neutral background, and editorial finish. Preserve facial identity, proportions, and original features.',
    category: 'Ensaios',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['estudio', 'profissional', 'retrato', 'editorial', 'softbox'],
  },
  {
    id: 16,
    internalName: 'elegant_female_editorial',
    intent: 'Criar um retrato feminino sofisticado.',
    userPhrases: ['Quero uma foto feminina elegante', 'Me coloca num ensaio chique', 'Foto elegante de mulher', 'Ensaio feminino fino'],
    technicalPrompt:
      'Create an elegant female editorial portrait, with gentle lighting, refined composition, harmonious colors, and professional photography atmosphere. Preserve identity and natural facial characteristics.',
    category: 'Ensaios',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['feminino', 'elegante', 'chique', 'fino', 'ensaio', 'mulher'],
  },
  {
    id: 17,
    internalName: 'cinematic_male_portrait',
    intent: 'Criar retrato masculino dramático.',
    userPhrases: ['Quero uma foto estilo filme', 'Me deixa com visual cinematográfico', 'Foto de homem estilo cinema', 'Retrato dramático masculino'],
    technicalPrompt:
      'Apply side-angle cinematic lighting, shallow depth of field, refined shadows, and realistic editorial treatment. Preserve face structure and authentic anatomy.',
    category: 'Ensaios',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['masculino', 'cinematografico', 'filme', 'dramatico', 'cinema', 'homem'],
  },
  {
    id: 18,
    internalName: 'maternity_portrait',
    intent: 'Criar um retrato delicado de gestante.',
    userPhrases: ['Quero um ensaio de grávida', 'Faz uma foto de gestante bonita', 'Foto de maternidade', 'Ensaio de gravidez'],
    technicalPrompt:
      'Transform the photograph into a maternity photoshoot with delicate setting, soft warm lighting, elegant composition, and welcoming atmosphere. Preserve real bodily and facial features.',
    category: 'Ensaios',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['gestante', 'gravida', 'maternidade', 'gravidez', 'mae'],
  },
  {
    id: 19,
    internalName: 'romantic_couple',
    intent: 'Criar um ensaio romântico de casal.',
    userPhrases: ['Deixa nossa foto romântica', 'Quero um ensaio de casal', 'Foto de namorados apaixonados', 'Foto romântica com meu amor'],
    technicalPrompt:
      'Apply romantic atmosphere, warm golden light, cinematic framing, and delicate harmonious colors. Preserve identity and physical appearance of both persons.',
    category: 'Ensaios',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['casal', 'romantico', 'namorados', 'amor', 'apaixonados', 'dois'],
  },
  {
    id: 20,
    internalName: 'children_portrait',
    intent: 'Criar retrato infantil profissional.',
    userPhrases: ['Faz um ensaio do meu filho', 'Deixa essa foto infantil mais bonita', 'Foto profissional da minha filha', 'Ensaio de crianca'],
    technicalPrompt:
      'Create an age-appropriate setting for children, delicate bright lighting, and cheerful composition. Faithfully preserve face, apparent age, and authentic characteristics of the child.',
    category: 'Ensaios',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['infantil', 'filho', 'filha', 'crianca', 'bebe', 'kids'],
  },
  {
    id: 21,
    internalName: 'graduation_portrait',
    intent: 'Criar fotografia comemorativa de formatura.',
    userPhrases: ['Quero foto de formatura', 'Me coloca num ensaio de formando', 'Foto de graduacao', 'Ensaio com beca de formatura'],
    technicalPrompt:
      'Create a graduation portrait with elegant academic setting, professional studio lighting, and coherent celebratory elements. Preserve facial identity and personal features.',
    category: 'Ensaios',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['formatura', 'formando', 'formanda', 'graduacao', 'academico'],
  },
  {
    id: 22,
    internalName: 'corporate_headshot',
    intent: 'Criar fotografia para currículo, trabalho ou LinkedIn.',
    userPhrases: ['Quero foto pro trabalho', 'Deixa profissional para LinkedIn', 'Foto executiva', 'Foto de perfil profissional para curriculo'],
    technicalPrompt:
      'Produce realistic corporate headshot, discreet modern background, uniform flattering lighting, professional framing, and confident natural expression. Preserve identity without artificial alterations.',
    category: 'Ensaios',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['trabalho', 'linkedin', 'curriculo', 'corporativo', 'executivo', 'headshot'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORIA B — ANIVERSÁRIOS (IDs 23 a 30)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 23,
    internalName: 'kids_birthday',
    intent: 'Criar ambiente festivo infantil de aniversário.',
    userPhrases: ['Coloca decoração de aniversário', 'Faz uma foto de aniversário pro meu filho', 'Festa infantil na foto', 'Balões de aniversário de criança'],
    technicalPrompt:
      'Add age-appropriate children birthday party decor, colorful balloons, celebratory elements, and cheerful ambient lighting, preserving the main person.',
    category: 'Aniversários',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['aniversario', 'infantil', 'baloes', 'festa', 'parabens'],
  },
  {
    id: 24,
    internalName: 'quinceanera_luxury',
    intent: 'Transformar a fotografia em ensaio de debutante / festa de 15 anos.',
    userPhrases: ['Quero foto de 15 anos', 'Faz uma festa de princesa', 'Foto de debutante', 'Ensaio de 15 anos de luxo'],
    technicalPrompt:
      'Create an elegant quinceañera celebration setting, sophisticated fairy lighting, floral arrangements, and luxurious ball atmosphere. Preserve facial identity and natural anatomy.',
    category: 'Aniversários',
    complexity: 'high',
    suggestedCredits: 2,
    tags: ['15 anos', 'debutante', 'princesa', 'quinceanera', 'luxo'],
  },
  {
    id: 25,
    internalName: 'adult_birthday_luxury',
    intent: 'Criar fotografia de aniversário adulto sofisticada.',
    userPhrases: ['Quero aniversário de luxo', 'Faz uma foto de aniversário elegante', 'Festa adulta chique', 'Comemoração de aniversário vip'],
    technicalPrompt:
      'Transform environment into a premium adult celebration with refined decoration, warm elegant mood lighting, champagne tones, and realistic photographic composition.',
    category: 'Aniversários',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['aniversario', 'luxo', 'adulto', 'champagne', 'chique', 'vip'],
  },
  {
    id: 26,
    internalName: 'surprise_party',
    intent: 'Adicionar atmosfera de festa surpresa com balões e confetes.',
    userPhrases: ['Coloca uma festa surpresa', 'Enche de balões e confetes', 'Foto de festa animada', 'Clima de surpresa de aniversário'],
    technicalPrompt:
      'Add floating balloons, festive confetti, and party decor while maintaining coherent perspective, physics, cast shadows, and illumination.',
    category: 'Aniversários',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['surpresa', 'baloes', 'confetes', 'festa', 'animada'],
  },
  {
    id: 27,
    internalName: 'garden_birthday',
    intent: 'Criar celebração de aniversário ao ar livre no jardim.',
    userPhrases: ['Quero aniversário num jardim', 'Coloca minha festa ao ar livre', 'Aniversário no parque com flores', 'Piquenique de aniversário'],
    technicalPrompt:
      'Create a realistic garden birthday party with lush vegetation, delicate outdoor decoration, rustic wooden table, and natural golden daylight.',
    category: 'Aniversários',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['jardim', 'ar livre', 'natureza', 'piquenique', 'festa'],
  },
  {
    id: 28,
    internalName: 'smash_cake',
    intent: 'Criar cenário de ensaio infantil smash the cake com bolo.',
    userPhrases: ['Faz ensaio smash the cake', 'Coloca meu bebê num cenário com bolo', 'Ensaio com bolo infantil', 'Smash the cake'],
    technicalPrompt:
      'Create a professional children smash-the-cake studio set with cute decorated cake, pastel tones, balloons, and gentle lighting, preserving identity and apparent age.',
    category: 'Aniversários',
    complexity: 'high',
    suggestedCredits: 2,
    tags: ['smash', 'cake', 'bolo', 'bebe', 'ensaio'],
  },
  {
    id: 29,
    internalName: 'neon_birthday',
    intent: 'Aplicar cenário festivo moderno com iluminação neon.',
    userPhrases: ['Quero festa neon', 'Deixa aniversário com luz colorida', 'Balada neon de aniversário', 'Luzes neon na comemoração'],
    technicalPrompt:
      'Create a modern birthday party atmosphere with vibrant neon lighting, colored specular reflections, and contemporary party aesthetic while preserving the main subject.',
    category: 'Aniversários',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['neon', 'luzes', 'colorida', 'balada', 'moderna'],
  },
  {
    id: 30,
    internalName: 'birthday_portrait',
    intent: 'Destacar o aniversariante com retrato comemorativo especial.',
    userPhrases: ['Faz uma foto bonita pro meu aniversário', 'Me destaca na foto', 'Retrato de aniversário', 'Foto especial de meu dia'],
    technicalPrompt:
      'Create an elegant commemorative birthday portrait, accentuating the celebrant with studio key light, subtle festive backdrop bokeh, and balanced framing.',
    category: 'Aniversários',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['aniversariante', 'destaque', 'parabens', 'meu dia', 'comemorativo'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORIA C — CASAMENTOS (IDs 31 a 38)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 31,
    internalName: 'classic_wedding',
    intent: 'Produzir fotografia matrimonial clássica e elegante.',
    userPhrases: ['Transforma em foto de casamento', 'Quero casamento clássico', 'Foto de noivos na igreja', 'Ensaio de casamento tradicional'],
    technicalPrompt:
      'Create classic matrimonial atmosphere with delicate soft illumination, elegant white floral decor, refined architecture, and high-end wedding photography aesthetics. Preserve people identities.',
    category: 'Casamentos',
    complexity: 'high',
    suggestedCredits: 2,
    tags: ['casamento', 'classico', 'noivos', 'igreja', 'matrimonial'],
  },
  {
    id: 32,
    internalName: 'beach_wedding',
    intent: 'Criar cenário matrimonial romântico na praia ao pôr do sol.',
    userPhrases: ['Coloca nosso casamento na praia', 'Quero casar no pôr do sol', 'Casamento beira mar', 'Noivos na praia'],
    technicalPrompt:
      'Create a beachside wedding ceremony with golden hour coastal light, ocean horizon, soft sea breeze feeling, and realistic floral matrimonial arbor.',
    category: 'Casamentos',
    complexity: 'high',
    suggestedCredits: 2,
    tags: ['casamento', 'praia', 'por do sol', 'mar', 'litoral'],
  },
  {
    id: 33,
    internalName: 'countryside_wedding',
    intent: 'Criar cerimônia matrimonial em ambiente campestre ao ar livre.',
    userPhrases: ['Quero casamento no campo', 'Coloca a gente num jardim de casamento', 'Casamento rústico chique', 'Casamento na fazenda'],
    technicalPrompt:
      'Create a countryside rustic-chic matrimonial setting with natural greenery, floral garlands, warm outdoor daylight, and romantic cinematic depth.',
    category: 'Casamentos',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['campo', 'fazenda', 'rustico', 'jardim', 'verde'],
  },
  {
    id: 34,
    internalName: 'pre_wedding_editorial',
    intent: 'Criar ensaio romântico de pré-wedding antes do casamento.',
    userPhrases: ['Quero pré-wedding', 'Faz um ensaio romântico nosso', 'Foto de pre-wedding', 'Ensaio antes do casamento'],
    technicalPrompt:
      'Produce an editorial pre-wedding photoshoot with late afternoon backlight, artistic golden flares, romantic poses, and editorial color grade, preserving both faces.',
    category: 'Casamentos',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['pre wedding', 'pre-wedding', 'noivos', 'romantico', 'ensaio'],
  },
  {
    id: 35,
    internalName: 'night_wedding',
    intent: 'Aplicar estética de casamento noturno com luzes de fada e bokeh.',
    userPhrases: ['Coloca casamento à noite', 'Quero foto com luzes de casamento', 'Casamento noturno romântico', 'Foto de noivos com luzinhas'],
    technicalPrompt:
      'Create a nighttime matrimonial atmosphere with glowing fairy string lights, magical bokeh background, warm elegant tones, and beautifully exposed subjects.',
    category: 'Casamentos',
    complexity: 'high',
    suggestedCredits: 2,
    tags: ['casamento', 'noite', 'luzes', 'fairy lights', 'bokeh'],
  },
  {
    id: 36,
    internalName: 'cinematic_newlyweds',
    intent: 'Criar retrato cinematográfico dramático de casal de noivos.',
    userPhrases: ['Deixa nosso casamento estilo cinema', 'Faz foto de filme dos noivos', 'Noivos de cinema', 'Cena de filme romântico'],
    technicalPrompt:
      'Apply cinematic visual storytelling, controlled dramatic rim lighting, shallow depth of field, sophisticated widescreen color palette, and authentic emotion.',
    category: 'Casamentos',
    complexity: 'high',
    suggestedCredits: 2,
    tags: ['cinema', 'filme', 'noivos', 'dramatico', 'cinematografico'],
  },
  {
    id: 37,
    internalName: 'luxury_wedding',
    intent: 'Criar cenário matrimonial de altíssimo luxo com lustres e flores.',
    userPhrases: ['Quero casamento de luxo', 'Coloca decoração chique', 'Casamento milionário', 'Casamento em palácio'],
    technicalPrompt:
      'Create a luxury palace wedding environment with crystal chandeliers, grand floral installations, polished marble reflections, and realistic perspective alignment.',
    category: 'Casamentos',
    complexity: 'high',
    suggestedCredits: 2,
    tags: ['luxo', 'palacio', 'lustres', 'cristal', 'milionario'],
  },
  {
    id: 38,
    internalName: 'vintage_wedding',
    intent: 'Aplicar estilo clássico nostálgico vintage de casamento.',
    userPhrases: ['Deixa casamento antigo', 'Quero foto vintage', 'Casamento anos 80 ou 90', 'Foto com ar nostálgico de casamento'],
    technicalPrompt:
      'Apply vintage timeless wedding aesthetic, soft warm nostalgic tones, subtle photographic film grain, and creamy highlight transitions without losing details.',
    category: 'Casamentos',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['vintage', 'nostalgico', 'antigo', 'filme', 'classico'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORIA D — PARQUES, NATUREZA E VIAGENS (IDs 39 a 46)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 39,
    internalName: 'sunset_park',
    intent: 'Inserir atmosfera de parque ao entardecer com luz dourada.',
    userPhrases: ['Me coloca no parque ao pôr do sol', 'Quero luz de fim de tarde', 'Foto no parque no por do sol', 'Golden hour no parque'],
    technicalPrompt:
      'Place subject in a realistic park environment during golden hour sunset, with warm low-angle sunlight, long soft shadows, and luminous ambient sky.',
    category: 'Natureza',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['parque', 'por do sol', 'entardecer', 'golden hour', 'tarde'],
  },
  {
    id: 40,
    internalName: 'enchanted_garden',
    intent: 'Criar cenário floral fantasioso de jardim encantado.',
    userPhrases: ['Me coloca num jardim encantado', 'Quero flores e luzes mágicas', 'Jardim de conto de fadas', 'Mundo mágico de flores'],
    technicalPrompt:
      'Create an enchanted garden setting with blooming wisteria and roses, soft ethereal light rays, delicate atmospheric haze, and photographic fairy-tale feeling.',
    category: 'Natureza',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['jardim', 'encantado', 'magico', 'flores', 'fadas'],
  },
  {
    id: 41,
    internalName: 'cinematic_forest',
    intent: 'Criar cenário florestal dramático com raios de sol e névoa.',
    userPhrases: ['Me coloca numa floresta', 'Quero cenário de filme na mata', 'Floresta com névoa', 'Mata fechada cinematográfica'],
    technicalPrompt:
      'Create a cinematic woodland forest setting with atmospheric sunbeams through tree canopies, realistic foliage, mist depth, and natural cinematic lighting.',
    category: 'Natureza',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['floresta', 'mata', 'arvores', 'raios', 'nevoa'],
  },
  {
    id: 42,
    internalName: 'tropical_beach',
    intent: 'Substituir cenário por uma praia paradisíaca tropical.',
    userPhrases: ['Me coloca numa praia bonita', 'Quero praia tropical', 'Foto no Caribe', 'Praia com água cristalina'],
    technicalPrompt:
      'Transport subject to a tropical white-sand beach with crystal clear turquoise ocean, palm tree shadows, and natural bright tropical sunlight aligned with the subject.',
    category: 'Natureza',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['praia', 'mar', 'tropical', 'caribe', 'areia', 'verao'],
  },
  {
    id: 43,
    internalName: 'mountain_adventure',
    intent: 'Criar cenário de montanhas dramáticas e aventura ao ar livre.',
    userPhrases: ['Me coloca numa montanha', 'Quero foto de aventura', 'Pico da montanha', 'Trilha com visual de montanha'],
    technicalPrompt:
      'Place subject atop a dramatic mountain summit with majestic rocky peaks, vast atmospheric horizon, crisp clean sunlight, and adventure photography realism.',
    category: 'Natureza',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['montanha', 'pico', 'aventura', 'rochas', 'altitude'],
  },
  {
    id: 44,
    internalName: 'urban_park',
    intent: 'Criar cenário de parque urbano arborizado e moderno.',
    userPhrases: ['Quero um parque bonito na cidade', 'Muda o fundo pra um parque moderno', 'Parque com prédios ao fundo', 'Parque Ibirapuera / Central Park'],
    technicalPrompt:
      'Integrate subject into a modern landscaped urban park with lush manicured lawns, leafy trees, subtle city architecture in the distant background, and realistic daylight.',
    category: 'Natureza',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['parque', 'urbano', 'cidade', 'arvores', 'moderno'],
  },
  {
    id: 45,
    internalName: 'tropical_waterfall',
    intent: 'Criar cenário exuberante de cachoeira tropical.',
    userPhrases: ['Me coloca numa cachoeira', 'Quero foto em uma cachoeira bonita', 'Foto com queda d água', 'Cachoeira na mata'],
    technicalPrompt:
      'Set subject in front of a natural tropical waterfall with cascading fresh water, mossy rocks, lush rainforest greenery, and gentle mist reflections.',
    category: 'Natureza',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['cachoeira', 'queda d agua', 'rio', 'tropical', 'mist'],
  },
  {
    id: 46,
    internalName: 'dream_destination',
    intent: 'Inserir a pessoa em destino turístico solicitado com proporção realista.',
    userPhrases: ['Me coloca em Paris', 'Quero aparecer em outro país', 'Foto em Londres', 'Me bota em Nova York', 'Viajando na Itália'],
    technicalPrompt:
      'Transport subject to the requested international landmark or dream travel destination, precisely matching scale, perspective, ground contact, and sunlight direction.',
    category: 'Natureza',
    complexity: 'high',
    suggestedCredits: 2,
    tags: ['viagem', 'paris', 'destino', 'turismo', 'europa', 'internacional'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORIA E — FESTAS E EVENTOS (IDs 47 a 54)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 47,
    internalName: 'graduation_party',
    intent: 'Criar cenário de comemoração de festa de formatura.',
    userPhrases: ['Quero uma festa de formatura', 'Coloca decoração de formatura', 'Baile de formatura', 'Festa de formando comemorando'],
    technicalPrompt:
      'Create an energetic graduation party setting with celebratory stage lighting, festive gold and silver accents, and academic achievement atmosphere.',
    category: 'Eventos',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['festa', 'formatura', 'baile', 'comemoracao'],
  },
  {
    id: 48,
    internalName: 'neon_party',
    intent: 'Criar ambiente de festa noturna colorida com iluminação neon.',
    userPhrases: ['Me coloca numa balada', 'Quero luz neon', 'Festa com neon', 'Balada eletrônica com luzes'],
    technicalPrompt:
      'Create a vibrant nightclub or neon party scene with colorful cyan and magenta glow, atmospheric haze, stylish edge reflections, and realistic night vibe.',
    category: 'Eventos',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['balada', 'neon', 'festa', 'nightclub', 'eletronica'],
  },
  {
    id: 49,
    internalName: 'corporate_event',
    intent: 'Criar fotografia em convenção ou evento empresarial profissional.',
    userPhrases: ['Me coloca num evento empresarial', 'Quero foto num congresso', 'Foto em conferência', 'Palestra ou evento corporativo'],
    technicalPrompt:
      'Integrate subject into a modern corporate summit or executive conference setting, with sleek stage design, balanced professional lighting, and corporate ambiance.',
    category: 'Eventos',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['corporativo', 'evento', 'congresso', 'conferencia', 'empresarial'],
  },
  {
    id: 50,
    internalName: 'new_year_party',
    intent: 'Criar atmosfera festiva de celebração de Ano-Novo / Réveillon.',
    userPhrases: ['Coloca festa de Ano-Novo', 'Quero foto de Réveillon', 'Comemoração de virada de ano', 'Foto de ano novo com fogos'],
    technicalPrompt:
      'Create an opulent New Year Eve celebration atmosphere with sparkling golden fireworks in the background, festive champagne toast lighting, and joyful ambience.',
    category: 'Eventos',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['reveillon', 'ano novo', 'virada', 'fogos', 'comemoracao'],
  },
  {
    id: 51,
    internalName: 'june_festival',
    intent: 'Criar ambiente tradicional festivo de Festa Junina / São João.',
    userPhrases: ['Me coloca numa festa junina', 'Quero decoração de São João', 'Festa caipira com bandeirinhas', 'Arraial junino'],
    technicalPrompt:
      'Create an authentic Brazilian Festa Junina setting with colorful paper flags, cozy campfire warmth, traditional rustic wooden stalls, and warm festive illumination.',
    category: 'Eventos',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['festa junina', 'sao joao', 'arraial', 'bandeirinhas', 'caipira'],
  },
  {
    id: 52,
    internalName: 'gender_reveal',
    intent: 'Criar cenário delicado de comemoração de chá revelação.',
    userPhrases: ['Quero decoração de chá revelação', 'Faz um cenário de revelação de bebê', 'Chá revelação azul e rosa', 'Foto de chá revelação'],
    technicalPrompt:
      'Create a delicate gender reveal setting with soft pastel balloon arches, smoke powder accents as requested by user, and joyful family celebratory ambience without inferring undisclosed baby details.',
    category: 'Eventos',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['cha revelacao', 'revelacao', 'bebe', 'pastel', 'baloes'],
  },
  {
    id: 53,
    internalName: 'baby_shower',
    intent: 'Criar cenário comemorativo e acolhedor de chá de bebê.',
    userPhrases: ['Quero um chá de bebê', 'Coloca decoração de bebê', 'Cenário de chá de fraldas', 'Festa de boas-vindas do bebê'],
    technicalPrompt:
      'Create an intimate, cozy baby shower party setting with soft natural pastel decor, gentle morning illumination, cute teddy accents, and warm maternal atmosphere.',
    category: 'Eventos',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['cha de bebe', 'fraldas', 'maternidade', 'acolhedor', 'pastel'],
  },
  {
    id: 54,
    internalName: 'music_festival',
    intent: 'Criar cenário de festival de música com palco e luzes de show.',
    userPhrases: ['Me coloca num festival', 'Quero foto num show', 'Festival de música tipo Lollapalooza ou Rock in Rio', 'Na plateia de um grande show'],
    technicalPrompt:
      'Set subject at a major outdoor music festival with powerful stage lighting arrays, atmospheric smoke beams, lively blurred crowd in the background, and vibrant live energy.',
    category: 'Eventos',
    complexity: 'high',
    suggestedCredits: 2,
    tags: ['festival', 'show', 'musica', 'palco', 'rock', 'luzes'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORIA F — MOTION VISUAL E EFEITOS SURREAIS (IDs 55 a 62)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 55,
    internalName: 'zero_gravity',
    intent: 'Criar efeito surreal de pessoa flutuando sem gravidade.',
    userPhrases: ['Quero ficar sem gravidade', 'Me faz flutuar', 'Me bota voando', 'Me coloca levitando no ar', 'Sem gravidade'],
    technicalPrompt:
      'Position the person in authentic zero-gravity levitation with natural body suspension pose, zero contact with ground, consistent spatial cast shadows, atmospheric depth, and surreal cinematic physics.',
    category: 'Motion visual',
    complexity: 'high',
    suggestedCredits: 2,
    tags: ['gravidade zero', 'flutuar', 'voar', 'levitar', 'sem gravidade', 'suspensao'],
  },
  {
    id: 56,
    internalName: 'floating_mirror',
    intent: 'Criar efeito surreal de espelho gigante flutuando com reflexos coerentes.',
    userPhrases: ['Me coloca flutuando sobre um espelho', 'Quero um espelho gigante no ar', 'Espelho flutuante', 'Reflexo no espelho suspenso'],
    technicalPrompt:
      'Create a surreal composition with a massive floating reflective mirror, physically accurate raytraced reflections, realistic perspective tilt, cinematic light bounce, and original subject fully preserved.',
    category: 'Motion visual',
    complexity: 'high',
    suggestedCredits: 2,
    tags: ['espelho', 'flutuando', 'espelho gigante', 'reflexo', 'surreal'],
  },
  {
    id: 57,
    internalName: 'body_fire',
    intent: 'Criar efeito fantástico de chamas cinematográficas envolvendo o corpo.',
    userPhrases: ['Quero meu corpo pegando fogo', 'Me coloca com chamas nos braços', 'Fogo no corpo', 'Efeito de fogo cinematográfico'],
    technicalPrompt:
      'VFX cinematic visual effect of magical glowing fiery aura and golden ember sparks illuminating the surrounding atmosphere. Safe superhero fantasy VFX style, beautiful artistic warm golden lighting. Maintain original person, facial identity, clothing, and expression intact.',
    category: 'Motion visual',
    complexity: 'high',
    suggestedCredits: 2,
    tags: ['fogo', 'chamas', 'pegando fogo', 'brasas', 'incandescente', 'fire'],
  },
  {
    id: 58,
    internalName: 'floating_portrait',
    intent: 'Criar efeito de levitação sutil e delicada no ar.',
    userPhrases: ['Me deixa flutuando', 'Quero parecer suspenso no ar', 'Levitacao suave', 'Flutuando levemente'],
    technicalPrompt:
      'Create an elegant, surreal levitation portrait with delicate vertical suspension, soft atmospheric ground separation, realistic downward shadows, and serene lighting.',
    category: 'Motion visual',
    complexity: 'high',
    suggestedCredits: 2,
    tags: ['levitacao', 'flutuando', 'suspenso', 'levitar', 'suave'],
  },
  {
    id: 59,
    internalName: 'neon_orbit',
    intent: 'Adicionar anéis de energia e órbitas luminosas neon ao redor do corpo.',
    userPhrases: ['Coloca luzes girando em mim', 'Quero anéis de energia', 'Orbitas de neon ao redor do corpo', 'Circulos de luz brilhante'],
    technicalPrompt:
      'Add luminous neon energy orbits winding smoothly around the subject, with physically consistent specular highlights on skin and clothes, light trails, and volumetric glow.',
    category: 'Motion visual',
    complexity: 'high',
    suggestedCredits: 2,
    tags: ['neon', 'orbita', 'aneis', 'energia', 'luzes girando', 'trail'],
  },
  {
    id: 60,
    internalName: 'cinematic_particles',
    intent: 'Criar atmosfera mágica de partículas luminosas flutuantes.',
    userPhrases: ['Coloca partículas brilhando', 'Quero poeira de luz na foto', 'Brilhos no ar', 'Particulas cinematograficas'],
    technicalPrompt:
      'Add suspended glowing light dust particles across foreground and background depth planes, with volumetric illumination, subtle bokeh glints, and photorealistic integration.',
    category: 'Motion visual',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['particulas', 'poeira de luz', 'brilho', 'glints', 'fagulhas'],
  },
  {
    id: 61,
    internalName: 'frozen_motion',
    intent: 'Criar aparência de ação com tempo congelado e objetos suspensos.',
    userPhrases: ['Quero parecer que parei o tempo', 'Congela tudo ao meu redor', 'Tempo congelado', 'Gotas de agua congeladas no ar'],
    technicalPrompt:
      'Compose high-speed frozen motion photography with dynamic flying droplets, suspended debris or particles frozen in mid-air, maintaining tack-sharp subject focus and optical depth.',
    category: 'Motion visual',
    complexity: 'high',
    suggestedCredits: 2,
    tags: ['tempo congelado', 'congelar', 'gotas no ar', 'acao', 'suspensao'],
  },
  {
    id: 62,
    internalName: 'cinematic_motion_blur',
    intent: 'Simular movimento intenso com desfoque direcional mantendo o sujeito nítido.',
    userPhrases: ['Coloca efeito de velocidade', 'Quero fundo em movimento', 'Rastro de velocidade', 'Motion blur cinematográfico'],
    technicalPrompt:
      'Add cinematic directional motion blur to the background environment to simulate high speed while keeping the foreground subject tack-sharp, conveying dynamic velocity.',
    category: 'Motion visual',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['velocidade', 'motion blur', 'desfoque', 'movimento', 'rastro'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORIA G — FOTOGRAFIA COMERCIAL E CRIATIVA (IDs 63 a 70)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 63,
    internalName: 'product_studio',
    intent: 'Criar fotografia comercial de produto de estúdio.',
    userPhrases: ['Deixa meu produto profissional', 'Quero foto de catálogo', 'Foto de produto com fundo de estúdio', 'Foto profissional do meu item'],
    technicalPrompt:
      'Transform the image into a high-end commercial studio product photograph with controlled gradient softbox illumination, balanced tabletop reflection, and absolute preservation of product form, colors, labels, and branding.',
    category: 'Comercial',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['produto', 'comercial', 'catalogo', 'embalagem', 'estudio'],
  },
  {
    id: 64,
    internalName: 'product_lifestyle',
    intent: 'Mostrar produto em cenário cotidiano e realista de utilização.',
    userPhrases: ['Coloca meu produto numa casa bonita', 'Quero foto do produto sendo usado', 'Foto de produto lifestyle', 'Produto na sala moderna'],
    technicalPrompt:
      'Insert the product into an authentic, tastefully staged everyday lifestyle environment (e.g. modern living room, kitchen, or boutique counter), keeping exact packaging proportions, texture, and logo intact.',
    category: 'Comercial',
    complexity: 'high',
    suggestedCredits: 2,
    tags: ['lifestyle', 'produto', 'casa', 'ambiente', 'uso'],
  },
  {
    id: 65,
    internalName: 'fashion_editorial',
    intent: 'Criar fotografia de campanha de moda editorial.',
    userPhrases: ['Quero foto de revista', 'Deixa parecendo campanha de moda', 'Vogue style', 'Foto editorial de moda'],
    technicalPrompt:
      'Create a high-fashion editorial magazine campaign composition with high-end key lighting, authentic pose geometry, sophisticated color grade, and flawless preservation of model facial identity and garments.',
    category: 'Comercial',
    complexity: 'high',
    suggestedCredits: 2,
    tags: ['moda', 'revista', 'editorial', 'vogue', 'fashion', 'campanha'],
  },
  {
    id: 66,
    internalName: 'food_photography',
    intent: 'Melhorar fotografia gastronômica para cardápio ou anúncio.',
    userPhrases: ['Deixa meu prato mais bonito', 'Quero foto profissional de comida', 'Foto de comida apetitosa', 'Foto para cardápio'],
    technicalPrompt:
      'Elevate culinary photograph into mouth-watering gastronomic imagery with warm appetizing directional lighting, vivid natural colors, shallow depth of field, and strict fidelity to the original dish.',
    category: 'Comercial',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['comida', 'gastronomia', 'prato', 'restaurante', 'cardapio', 'apetitoso'],
  },
  {
    id: 67,
    internalName: 'luxury_real_estate',
    intent: 'Melhorar fotografia imobiliária para alto padrão.',
    userPhrases: ['Deixa esse imóvel mais elegante', 'Melhora a foto dessa casa', 'Foto imobiliária de luxo', 'Foto profissional de arquitetura'],
    technicalPrompt:
      'Enhance architectural and real estate photograph with balanced interior and window exterior exposure, vertical perspective alignment, warm ambient illumination, and faithful preservation of structural dimensions.',
    category: 'Comercial',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['imovel', 'casa', 'arquitetura', 'imobiliaria', 'luxo', 'decoracao'],
  },
  {
    id: 68,
    internalName: 'automotive_cinematic',
    intent: 'Criar fotografia profissional cinematográfica de veículo.',
    userPhrases: ['Deixa meu carro estilo cinema', 'Quero foto de propaganda do carro', 'Foto de carro esportivo', 'Automotivo cinematográfico'],
    technicalPrompt:
      'Create cinematic automotive commercial imagery with dramatic highway or showroom lighting, realistic specular reflections across car bodywork, and exact preservation of car model, badge, and geometry.',
    category: 'Comercial',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['carro', 'automotivo', 'veiculo', 'propaganda', 'moto', 'estrada'],
  },
  {
    id: 69,
    internalName: 'social_profile_portrait',
    intent: 'Criar fotografia profissional moderna para redes sociais e perfil.',
    userPhrases: ['Quero foto pro Instagram', 'Deixa minha foto de perfil melhor', 'Foto pro Insta de alto padrão', 'Foto de perfil bonita'],
    technicalPrompt:
      'Produce an eye-catching modern portrait optimized for social media avatars and feeds, with flattering ring or softbox light, clean background separation, and 100% natural facial identity preservation.',
    category: 'Comercial',
    complexity: 'medium',
    suggestedCredits: 1,
    tags: ['instagram', 'perfil', 'insta', 'rede social', 'avatar', 'feed'],
  },
  {
    id: 70,
    internalName: 'advertising_campaign',
    intent: 'Transformar fotografia em composição publicitária de alto impacto.',
    userPhrases: ['Cria uma propaganda com essa foto', 'Deixa parecendo anúncio profissional', 'Campanha publicitária', 'Foto estilo outdoor / billboard'],
    technicalPrompt:
      'Produce an impactful advertising campaign visual hierarchy with commercial-grade studio lighting, brand-aligned staging, and crisp subject isolation. Preserve trademarks and real items without fabricating false claims or prices.',
    category: 'Comercial',
    complexity: 'high',
    suggestedCredits: 2,
    tags: ['publicidade', 'propaganda', 'anuncio', 'campanha', 'outdoor', 'comercial'],
  },
];

export const TOTAL_COMMANDS_COUNT = 70;
export const BASE_COMMANDS_COUNT = 14;
export const ADVANCED_COMMANDS_COUNT = 56;

/**
 * Busca comando interno pelo nome interno.
 */
export function getCommandByName(name: string): InternalCommand | undefined {
  return COMMANDS_CATALOG.find((c) => c.internalName.toLowerCase() === name.toLowerCase());
}

/**
 * Busca comando interno pelo ID numérico (1 a 70).
 */
export function getCommandById(id: number): InternalCommand | undefined {
  return COMMANDS_CATALOG.find((c) => c.id === id);
}
