/**
 * AI Search Service - Busca inteligente
 * Tenta usar Google Gemini API se disponível, senão usa busca simplificada sem API key
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Usar gemini-1.5-flash (mais rápido) ou gemini-pro (mais preciso)
// Se gemini-1.5-flash não funcionar, tente gemini-pro
const GEMINI_MODEL = 'gemini-1.5-flash'; // ou 'gemini-pro'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Base de conhecimento simples para respostas rápidas sem API
const knowledgeBase = {
  'brasil': {
    'capital': 'Brasília',
    'presidente': 'Luiz Inácio Lula da Silva',
    'população': 'Aproximadamente 215 milhões de habitantes',
    'moeda': 'Real (R$)',
    'idioma': 'Português'
  },
  'portugal': {
    'capital': 'Lisboa',
    'moeda': 'Euro (€)',
    'idioma': 'Português'
  },
  'argentina': {
    'capital': 'Buenos Aires',
    'moeda': 'Peso argentino',
    'idioma': 'Espanhol'
  },
  'estados unidos': {
    'capital': 'Washington D.C.',
    'presidente': 'Joe Biden',
    'moeda': 'Dólar americano (US$)',
    'idioma': 'Inglês'
  },
  'frança': {
    'capital': 'Paris',
    'moeda': 'Euro (€)',
    'idioma': 'Francês'
  },
  'espanha': {
    'capital': 'Madrid',
    'moeda': 'Euro (€)',
    'idioma': 'Espanhol'
  },
  'italia': {
    'capital': 'Roma',
    'moeda': 'Euro (€)',
    'idioma': 'Italiano'
  },
  'alemanha': {
    'capital': 'Berlim',
    'moeda': 'Euro (€)',
    'idioma': 'Alemão'
  },
  'japão': {
    'capital': 'Tóquio',
    'moeda': 'Iene (¥)',
    'idioma': 'Japonês'
  },
  'china': {
    'capital': 'Pequim',
    'moeda': 'Yuan (¥)',
    'idioma': 'Mandarim'
  },
  'rússia': {
    'capital': 'Moscou',
    'moeda': 'Rublo',
    'idioma': 'Russo'
  },
  'méxico': {
    'capital': 'Cidade do México',
    'moeda': 'Peso mexicano',
    'idioma': 'Espanhol'
  },
  'chile': {
    'capital': 'Santiago',
    'moeda': 'Peso chileno',
    'idioma': 'Espanhol'
  }
};

// Cache de respostas para evitar chamadas repetidas
const responseCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Limpa o cache de respostas antigas
 */
const cleanCache = () => {
  const now = Date.now();
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      responseCache.delete(key);
    }
  }
};

/**
 * Gera uma chave de cache normalizada para a pergunta
 */
const getCacheKey = (question) => {
  return question.toLowerCase().trim().replace(/[?!.,]/g, '');
};

/**
 * Busca resposta na base de conhecimento local
 */
const searchLocalKnowledge = (question) => {
  const lowerQuestion = question.toLowerCase().trim();
  
  // Normalizar nomes de países (remover acentos e variações)
  const countryVariations = {
    'brasil': ['brasil', 'brazil', 'brasileiro'],
    'portugal': ['portugal', 'português'],
    'argentina': ['argentina', 'argentino'],
    'estados unidos': ['estados unidos', 'eua', 'usa', 'america', 'américa', 'estados unidos da américa'],
    'frança': ['frança', 'france', 'francês'],
    'espanha': ['espanha', 'spain', 'espanhol'],
    'italia': ['itália', 'italia', 'italy', 'italiano'],
    'alemanha': ['alemanha', 'germany', 'alemão'],
    'japão': ['japão', 'japao', 'japan', 'japonês'],
    'china': ['china', 'chinese', 'chinês'],
    'rússia': ['rússia', 'russia', 'russo'],
    'méxico': ['méxico', 'mexico', 'mexicano'],
    'chile': ['chile', 'chileno']
  };
  
  // Função para verificar se a pergunta menciona um país
  const findCountry = () => {
    for (const [country, data] of Object.entries(knowledgeBase)) {
      const variations = countryVariations[country] || [country];
      for (const variation of variations) {
        if (lowerQuestion.includes(variation)) {
          return { country, data };
        }
      }
    }
    return null;
  };
  
  const countryMatch = findCountry();
  
  if (countryMatch) {
    const { country, data } = countryMatch;
    
    // Buscar capital
    if (lowerQuestion.includes('capital') || lowerQuestion.includes('qual a capital')) {
      if (data.capital) {
        return data.capital;
      }
    }
    
    // Buscar presidente
    if (lowerQuestion.includes('presidente') || lowerQuestion.includes('quem é o presidente')) {
      if (data.presidente) {
        return data.presidente;
      }
    }
    
    // Buscar moeda
    if (lowerQuestion.includes('moeda') || lowerQuestion.includes('qual a moeda')) {
      if (data.moeda) {
        return data.moeda;
      }
    }
    
    // Buscar idioma
    if (lowerQuestion.includes('idioma') || lowerQuestion.includes('língua') || lowerQuestion.includes('lingua') || lowerQuestion.includes('qual o idioma')) {
      if (data.idioma) {
        return data.idioma;
      }
    }
    
    // Se perguntou sobre o país mas não especificou o que, dar informação geral
    if (lowerQuestion.includes('sobre') || lowerQuestion.includes('informação')) {
      const info = [];
      if (data.capital) info.push(`Capital: ${data.capital}`);
      if (data.moeda) info.push(`Moeda: ${data.moeda}`);
      if (data.idioma) info.push(`Idioma: ${data.idioma}`);
      if (info.length > 0) {
        return info.join('. ');
      }
    }
  }
  
  // Respostas para perguntas comuns sem país específico
  if (lowerQuestion.includes('qual a capital do brasil') || lowerQuestion === 'capital do brasil') {
    return 'Brasília';
  }
  
  if (lowerQuestion.includes('quem é o presidente do brasil') || lowerQuestion.includes('presidente do brasil')) {
    return 'Luiz Inácio Lula da Silva';
  }
  
  return null;
};

/**
 * Busca usando Wikipedia API (pública, sem key)
 */
const searchWikipedia = async (question) => {
  try {
    // Extrair termos principais da pergunta
    let terms = question
      .toLowerCase()
      .replace(/[?!.,]/g, '')
      .replace(/qual|quem|onde|quando|como|o que|é|a|o|do|da|dos|das|do|da|de|capital|presidente|moeda|idioma/gi, '')
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 3)
      .join('_'); // Wikipedia usa underscore
    
    if (!terms || terms.length < 3) return null;
    
    // Tentar busca direta primeiro
    let searchUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(terms)}`;
    console.log('🔍 [aiSearchService] Tentando Wikipedia:', searchUrl);
    
    let response = await fetch(searchUrl);
    
    // Se não encontrou, tentar com primeira palavra capitalizada
    if (!response.ok && terms.includes('_')) {
      const firstWord = terms.split('_')[0];
      const capitalized = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
      searchUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(capitalized)}`;
      console.log('🔍 [aiSearchService] Tentando Wikipedia (capitalizado):', searchUrl);
      response = await fetch(searchUrl);
    }
    
    if (response.ok) {
      const data = await response.json();
      if (data.extract) {
        // Pegar primeira ou segunda frase (mais informativa)
        const sentences = data.extract.split('.');
        let answer = sentences[0];
        if (answer.length < 30 && sentences[1]) {
          answer += '. ' + sentences[1];
        }
        answer = answer.substring(0, 200).trim();
        
        // Remover informações entre parênteses no final
        answer = answer.replace(/\s*\([^)]*\)\s*$/, '');
        
        return answer || null;
      }
    } else {
      console.log('ℹ️ [aiSearchService] Wikipedia retornou status:', response.status);
    }
  } catch (error) {
    console.log('ℹ️ [aiSearchService] Wikipedia não disponível:', error.message);
  }
  return null;
};

/**
 * Busca uma resposta curta e direta para uma pergunta
 * Tenta primeiro sem API key, depois com Gemini se disponível
 * @param {string} question - A pergunta a ser respondida
 * @returns {Promise<{success: boolean, answer: string, source: string}>}
 */
export const searchAnswer = async (question) => {
  console.log('🔍 [aiSearchService] ========== INICIANDO BUSCA ==========');
  console.log('🔍 [aiSearchService] Pergunta recebida:', question);
  console.log('🔍 [aiSearchService] Tipo da pergunta:', typeof question);
  
  if (!question || typeof question !== 'string') {
    console.error('❌ [aiSearchService] Pergunta inválida:', question);
    return { success: false, answer: null, source: 'error' };
  }

  // Verificar cache primeiro
  const cacheKey = getCacheKey(question);
  console.log('🔍 [aiSearchService] Chave do cache:', cacheKey);
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('✅ [aiSearchService] Resposta encontrada no cache:', cached.answer);
    return { success: true, answer: cached.answer, source: 'cache' };
  }
  console.log('ℹ️ [aiSearchService] Não encontrado no cache, buscando...');

  // Limpar cache antigo periodicamente
  cleanCache();
  
  // ============================================
  // MÉTODO 1: Busca na base de conhecimento local (SEM API KEY)
  // ============================================
  console.log('🔍 [aiSearchService] Tentando busca local...');
  const localAnswer = searchLocalKnowledge(question);
  if (localAnswer) {
    console.log('✅ [aiSearchService] Resposta encontrada na base local:', localAnswer);
    responseCache.set(cacheKey, {
      answer: localAnswer,
      timestamp: Date.now()
    });
    return { success: true, answer: localAnswer, source: 'local' };
  }
  
  // ============================================
  // MÉTODO 2: Busca no Wikipedia (SEM API KEY)
  // ============================================
  console.log('🔍 [aiSearchService] Tentando busca no Wikipedia...');
  const wikipediaAnswer = await searchWikipedia(question);
  if (wikipediaAnswer) {
    console.log('✅ [aiSearchService] Resposta encontrada no Wikipedia:', wikipediaAnswer);
    responseCache.set(cacheKey, {
      answer: wikipediaAnswer,
      timestamp: Date.now()
    });
    return { success: true, answer: wikipediaAnswer, source: 'wikipedia' };
  }
  
  // ============================================
  // MÉTODO 3: Tentar Gemini API (SE API KEY ESTIVER CONFIGURADA)
  // ============================================
  if (GEMINI_API_KEY && GEMINI_API_KEY.trim() !== '' && GEMINI_API_KEY !== 'undefined') {
    console.log('🔍 [aiSearchService] API key disponível, tentando Gemini API...');
    console.log('🔍 [aiSearchService] Modelo:', GEMINI_MODEL);
    
    // Validar formato da API key (deve começar com AIza)
    if (!GEMINI_API_KEY.startsWith('AIza')) {
      console.warn('⚠️ [aiSearchService] API key pode estar em formato incorreto (deve começar com "AIza")');
    } else {
      // Tentar usar Gemini API
      try {
        const geminiResult = await searchWithGemini(question, cacheKey);
        if (geminiResult && geminiResult.success) {
          return geminiResult;
        }
      } catch (error) {
        console.log('ℹ️ [aiSearchService] Gemini API falhou, continuando com métodos alternativos');
      }
    }
  } else {
    console.log('ℹ️ [aiSearchService] API key não configurada, usando apenas métodos sem key');
  }
  
  // ============================================
  // MÉTODO 4: Fallback - Resposta genérica
  // ============================================
  console.log('ℹ️ [aiSearchService] Nenhum método encontrou resposta, usando fallback');
  const fallbackAnswer = 'Desculpe, não consegui encontrar uma resposta precisa para essa pergunta. Tente reformular a pergunta ou ser mais específico.';
  
  return { success: true, answer: fallbackAnswer, source: 'fallback' };
};

/**
 * Busca usando Gemini API (requer API key)
 */
const searchWithGemini = async (question, cacheKey) => {

  try {
    console.log('🔍 [aiSearchService] Fazendo requisição para Gemini API...');
    console.log('🔍 [aiSearchService] URL:', GEMINI_API_URL);
    console.log('🔍 [aiSearchService] Pergunta completa:', question);

    const prompt = `Você é um assistente de rádio online. Responda a seguinte pergunta de forma CLARA, CONCISA e DIRETA. 
    
Regras:
- Se for uma pergunta sobre capital, responda apenas o nome da capital (ex: "Brasília")
- Se for sobre presidente, responda apenas o nome (ex: "Luiz Inácio Lula da Silva")
- Se for sobre definição, dê uma resposta curta em até 15 palavras
- Se for sobre cálculo, dê apenas o resultado numérico
- Se for sobre data/ano, dê apenas a data ou ano
- Sempre responda em português brasileiro
- Não use frases como "A resposta é" ou "É", apenas dê a resposta direta

Pergunta: ${question}

Resposta:`;

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 150,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
      ]
    };
    
    // Validar API key antes de fazer a requisição
    if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '' || GEMINI_API_KEY === 'undefined') {
      console.error('❌ [aiSearchService] API key inválida ou não definida');
      return { success: false, answer: null, source: 'no_api_key' };
    }
    
    const requestUrl = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
    console.log('📡 [aiSearchService] URL da requisição:', requestUrl.replace(GEMINI_API_KEY, 'KEY_HIDDEN'));
    console.log('📡 [aiSearchService] Modelo:', GEMINI_MODEL);
    console.log('📡 [aiSearchService] Body da requisição:', JSON.stringify(requestBody, null, 2));
    
    let response;
    try {
      console.log('📡 [aiSearchService] Fazendo requisição fetch...');
      response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      console.log('📡 [aiSearchService] Requisição concluída');
    } catch (fetchError) {
      console.error('❌ [aiSearchService] ========== ERRO DE REDE ==========');
      console.error('❌ [aiSearchService] Erro de fetch:', fetchError);
      console.error('❌ [aiSearchService] Mensagem:', fetchError?.message);
      console.error('❌ [aiSearchService] Tipo:', fetchError?.name);
      console.error('❌ [aiSearchService] Stack:', fetchError?.stack);
      
      // Verificar se é erro de CORS
      if (fetchError?.message?.includes('CORS') || fetchError?.message?.includes('cors')) {
        console.error('❌ [aiSearchService] Erro de CORS detectado. A API pode não permitir requisições do navegador.');
        return { success: false, answer: null, source: 'cors_error' };
      }
      
      return { success: false, answer: null, source: 'network_error', error: fetchError?.message };
    }

    console.log('📡 [aiSearchService] Status da resposta:', response.status);
    console.log('📡 [aiSearchService] Response OK:', response.ok);
    console.log('📡 [aiSearchService] Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
        console.error('❌ [aiSearchService] ========== ERRO NA API ==========');
        console.error('❌ [aiSearchService] Status:', response.status);
        console.error('❌ [aiSearchService] Status Text:', response.statusText);
        console.error('❌ [aiSearchService] Erro completo:', errorText);
        
        // Tentar parsear como JSON se possível
        try {
          const errorJson = JSON.parse(errorText);
          console.error('❌ [aiSearchService] Erro JSON:', JSON.stringify(errorJson, null, 2));
          
          // Extrair mensagem de erro mais específica
          if (errorJson.error) {
            const errorMessage = errorJson.error.message || errorJson.error.status || 'Erro desconhecido';
            const errorCode = errorJson.error.code || response.status;
            console.error('❌ [aiSearchService] Código do erro:', errorCode);
            console.error('❌ [aiSearchService] Mensagem do erro:', errorMessage);
            
            return { 
              success: false, 
              answer: null, 
              source: 'api_error', 
              error: errorMessage,
              code: errorCode,
              fullError: errorJson
            };
          }
        } catch (e) {
          // Não é JSON, continuar com texto
          console.error('❌ [aiSearchService] Erro não é JSON, usando texto:', errorText);
        }
      } catch (textError) {
        console.error('❌ [aiSearchService] Erro ao ler resposta de erro:', textError);
        errorText = `Erro HTTP ${response.status}: ${response.statusText}`;
      }
      
      return { 
        success: false, 
        answer: null, 
        source: 'api_error', 
        error: errorText,
        status: response.status
      };
    }

    console.log('✅ [aiSearchService] Resposta OK, processando JSON...');
    const data = await response.json();
    console.log('📊 [aiSearchService] Dados recebidos:', JSON.stringify(data, null, 2));
    
    // Verificar se há bloqueio de segurança
    if (data?.promptFeedback?.blockReason) {
      console.warn('⚠️ [aiSearchService] Resposta bloqueada por segurança:', data.promptFeedback.blockReason);
      return { success: false, answer: null, source: 'blocked' };
    }
    
    // Verificar se há candidatos
    if (!data?.candidates || data.candidates.length === 0) {
      console.warn('⚠️ [aiSearchService] Nenhum candidato encontrado na resposta');
      console.warn('⚠️ [aiSearchService] Estrutura completa:', JSON.stringify(data, null, 2));
      return { success: false, answer: null, source: 'no_candidates' };
    }
    
    // Verificar se o candidato foi bloqueado
    if (data.candidates[0]?.finishReason === 'SAFETY') {
      console.warn('⚠️ [aiSearchService] Resposta bloqueada por segurança (finishReason: SAFETY)');
      return { success: false, answer: null, source: 'safety_blocked' };
    }
    
    // Extrair a resposta do Gemini - tentar múltiplos caminhos
    let answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // Se não encontrou, tentar caminho alternativo
    if (!answer && data?.candidates?.[0]?.content?.parts) {
      answer = data.candidates[0].content.parts.find(part => part.text)?.text;
    }
    
    // Se ainda não encontrou, tentar outro caminho
    if (!answer && data?.candidates?.[0]?.output) {
      answer = data.candidates[0].output;
    }
    
    console.log('📝 [aiSearchService] Resposta bruta extraída:', answer);
    console.log('📝 [aiSearchService] Tipo da resposta:', typeof answer);
    console.log('📝 [aiSearchService] Tamanho da resposta:', answer?.length);
    
    if (answer) {
      // Limpar a resposta
      answer = answer.trim();
      
      // Remover prefixos comuns
      answer = answer.replace(/^(resposta:|a resposta é:|a resposta:|é:|a resposta para|resposta para)\s*/i, '');
      
      // Remover citações e aspas
      answer = answer.replace(/^["']|["']$/g, '');
      
      // Remover pontuação final excessiva
      answer = answer.replace(/\.+$/, '').trim();
      
      // Remover quebras de linha e espaços múltiplos
      answer = answer.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
      
      // Capitalizar primeira letra
      if (answer.length > 0) {
        answer = answer.charAt(0).toUpperCase() + answer.slice(1);
      }
      
      // Adicionar ponto final se não terminar com pontuação e não for muito curta
      if (!/[.!?]$/.test(answer) && answer.length > 3) {
        answer = answer + '.';
      }
      
      console.log('✅ [aiSearchService] Resposta encontrada e formatada:', answer);
      
      // Salvar no cache
      responseCache.set(cacheKey, {
        answer,
        timestamp: Date.now()
      });
      console.log('💾 [aiSearchService] Resposta salva no cache');
      
      console.log('✅ [aiSearchService] ========== BUSCA CONCLUÍDA COM SUCESSO ==========');
      return { success: true, answer, source: 'gemini' };
    }
    
    console.warn('⚠️ [aiSearchService] Nenhuma resposta encontrada nos dados da API');
    console.warn('⚠️ [aiSearchService] Estrutura dos dados:', JSON.stringify(data, null, 2));
    return { success: false, answer: null, source: 'no_answer' };
    
  } catch (error) {
    console.error('❌ [aiSearchService] ========== ERRO CAPTURADO ==========');
    console.error('❌ [aiSearchService] Erro completo:', error);
    console.error('❌ [aiSearchService] Mensagem:', error?.message);
    console.error('❌ [aiSearchService] Stack:', error?.stack);
    return { success: false, answer: null, source: 'error' };
  }
};

/**
 * Verifica se a pergunta é uma pergunta de conhecimento geral que pode ser buscada
 * @param {string} text - O texto a ser verificado
 * @returns {boolean}
 */
export const isKnowledgeQuestion = (text) => {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  
  // Palavras-chave que indicam perguntas de conhecimento
  const knowledgeKeywords = [
    'qual',
    'quem',
    'onde',
    'quando',
    'como',
    'por que',
    'porque',
    'o que é',
    'o que significa',
    'quantos',
    'quantas',
    'quanto',
    'quanta',
    'capital',
    'presidente',
    'país',
    'estado',
    'cidade',
    'rio',
    'montanha',
    'definição',
    'significado',
    'inventor',
    'descobriu',
    'fundou',
    'criou',
    'nasceu',
    'morreu',
    'ano',
    'data',
    'altura',
    'peso',
    'distância',
    'população',
    'moeda',
    'língua',
    'idioma'
  ];
  
  // Verificar se contém palavras-chave de conhecimento
  const hasKeyword = knowledgeKeywords.some(keyword => lowerText.includes(keyword));
  
  // Verificar se é uma pergunta (termina com ?)
  const isQuestion = lowerText.includes('?');
  
  return hasKeyword || isQuestion;
};

/**
 * Formata a resposta para ser falada pelo robô
 * @param {string} question - A pergunta original
 * @param {string} answer - A resposta encontrada
 * @returns {string}
 */
export const formatSpokenAnswer = (question, answer) => {
  // Se a resposta já é curta, retorná-la diretamente
  if (answer.split(' ').length <= 5) {
    return answer;
  }
  
  return answer;
};

export default {
  searchAnswer,
  isKnowledgeQuestion,
  formatSpokenAnswer
};


