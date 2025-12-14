/**
 * AI Search Service - Busca inteligente usando Google Gemini API
 * Fornece respostas curtas e diretas para perguntas do chat
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

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
 * Busca uma resposta curta e direta para uma pergunta usando o Gemini
 * @param {string} question - A pergunta a ser respondida
 * @returns {Promise<{success: boolean, answer: string, source: string}>}
 */
export const searchAnswer = async (question) => {
  if (!question || typeof question !== 'string') {
    return { success: false, answer: null, source: 'error' };
  }

  // Verificar cache primeiro
  const cacheKey = getCacheKey(question);
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('🔍 Resposta encontrada no cache:', cached.answer);
    return { success: true, answer: cached.answer, source: 'cache' };
  }

  // Limpar cache antigo periodicamente
  cleanCache();

  // Verificar se a API key está configurada
  if (!GEMINI_API_KEY) {
    console.warn('⚠️ VITE_GEMINI_API_KEY não configurada. Usando respostas locais.');
    return { success: false, answer: null, source: 'no_api_key' };
  }

  try {
    console.log('🔍 Buscando resposta para:', question);

    const prompt = `Você é um assistente de rádio online. Responda a seguinte pergunta de forma MUITO CURTA e DIRETA, em no máximo 10 palavras. Apenas a resposta, sem explicações adicionais. Se for uma pergunta sobre capital, país, definição, etc, responda apenas com o nome/termo.

Pergunta: ${question}

Resposta curta:`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.1,
          maxOutputTokens: 50,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API Gemini:', response.status, errorText);
      return { success: false, answer: null, source: 'api_error' };
    }

    const data = await response.json();
    
    // Extrair a resposta do Gemini
    let answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (answer) {
      // Limpar a resposta
      answer = answer.trim();
      
      // Remover prefixos comuns
      answer = answer.replace(/^(resposta:|a resposta é:|a resposta:|é:)\s*/i, '');
      
      // Remover pontuação final excessiva
      answer = answer.replace(/\.+$/, '').trim();
      
      // Capitalizar primeira letra
      answer = answer.charAt(0).toUpperCase() + answer.slice(1);
      
      // Adicionar ponto final se não terminar com pontuação
      if (!/[.!?]$/.test(answer)) {
        answer = answer + '.';
      }
      
      console.log('✅ Resposta encontrada:', answer);
      
      // Salvar no cache
      responseCache.set(cacheKey, {
        answer,
        timestamp: Date.now()
      });
      
      return { success: true, answer, source: 'gemini' };
    }
    
    return { success: false, answer: null, source: 'no_answer' };
    
  } catch (error) {
    console.error('❌ Erro ao buscar resposta:', error);
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

