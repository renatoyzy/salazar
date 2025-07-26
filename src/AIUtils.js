import { GenerateContentResponse, GoogleGenAI } from "@google/genai";
import botConfig from "../config.json" with { type: "json" };
import { createHash } from "crypto";
import 'dotenv/config';

export const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

/**
 * Envia uma requisição para a IA.
 * @param {string} prompt - O prompt a ser enviado para a IA
 * @param {string} model - O modelo de IA a ser utilizado
 * @returns {Promise<GenerateContentResponse>} - A resposta da IA
 * @throws {Error} - Se ocorrer um erro ao enviar a requisição
 */
export async function sendRequisition(prompt, model) {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt
        });
        return response;
    } catch (error) {
        throw error;
    }
}

/**
 * Gera uma resposta da IA com base no prompt fornecido, tentando todos os modelos em ordem.
 * @param {string} prompt - O prompt a ser enviado para a IA
 * @returns {Promise<GenerateContentResponse>} - A resposta da IA
 * @throws {Error} - Se o prompt for inválido ou se ocorrer um erro na geração
 */
export async function aiGenerate(prompt) {
    if (!prompt || typeof prompt !== 'string') {
        throw new Error("O prompt deve ser uma string não vazia.");
    }

    const models = Array.isArray(botConfig.model) ? botConfig.model : [botConfig.model];

    let lastError;
    for (const model of models) {
        try {
            const response = await sendRequisition(prompt, model);
            console.log(`-- O Salazar está usando o modelo ${model}`);
            return response;
        } catch (error) {
            lastError = error;
            // Tenta o próximo modelo
        }
    }
    // Se chegou aqui, todos falharam
    console.error("Erro ao gerar resposta da IA:", lastError);
    throw new Error("Não foi possível obter uma resposta da IA em nenhum modelo.");
}

// Configurações e padrões expandidos
const AI_PATTERNS = {
  // Conectivos e transições típicos de IA
  aiConnectives: [
    'é importante notar que', 'é fundamental destacar', 'vale ressaltar que',
    'é essencial compreender', 'convém mencionar que', 'cabe destacar que',
    'é pertinente observar', 'é crucial entender', 'é interessante notar',
    'dessa forma', 'nesse sentido', 'sob essa perspectiva', 'nesse contexto',
    'assim sendo', 'por conseguinte', 'consequentemente'
  ],

  // Estruturas sintáticas complexas
  complexStructures: [
    /por um lado[^.]*por outro lado/gi,
    /em primeiro lugar[^.]*em segundo lugar/gi,
    /não apenas[^.]*mas também/gi,
    /tanto[^.]*quanto/gi,
    /seja[^.]*seja/gi,
    /quer[^.]*quer/gi
  ],

  // Linguagem acadêmica excessiva
  academicLanguage: [
    'ademais', 'outrossim', 'destarte', 'dessarte', 'conquanto',
    'não obstante', 'todavia', 'contudo', 'entretanto', 'porquanto',
    'doravante', 'hodiernamente', 'mormente', 'deveras', 'amiúde'
  ],

  // Padrões de hedge (linguagem cautelosa típica de IA)
  hedgePatterns: [
    'pode ser que', 'é possível que', 'tende a', 'geralmente',
    'frequentemente', 'em muitos casos', 'na maioria das vezes',
    'potencialmente', 'presumivelmente', 'aparentemente'
  ],

  // Padrões de enumeração excessiva
  enumerationPatterns: [
    /primeiro.*segundo.*terceiro/gi,
    /inicialmente.*posteriormente.*finalmente/gi,
    /primeiramente.*ademais.*por fim/gi
  ],

  // Clichês e frases prontas
  cliches: [
    'nos dias de hoje', 'na era digital', 'no mundo atual',
    'é inegável que', 'não há como negar', 'é fato que',
    'sem sombra de dúvidas', 'é consenso que'
  ]
};

// Pesos para diferentes tipos de análise
const ANALYSIS_WEIGHTS = {
  connectivePatterns: 0.25,
  syntacticComplexity: 0.20,
  lexicalAnalysis: 0.15,
  semanticCoherence: 0.15,
  stylometricAnalysis: 0.15,
  statisticalAnalysis: 0.10
};

/**
 * Classe principal do detector de IA
 */
export class AITextDetector {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.5;
    this.language = options.language || 'pt';
    this.enableCache = options.enableCache !== false;
    this.cache = new Map();
    this.debugMode = options.debug || false;
  }

  /**
   * Análise principal de detecção de IA
   */
  analyze(text, options = {}) {
    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      throw new Error('Texto deve ter pelo menos 10 caracteres');
    }

    const textHash = this.enableCache ? this._generateHash(text) : null;
    if (this.enableCache && this.cache.has(textHash)) {
      return this.cache.get(textHash);
    }

    const preprocessed = this._preprocessText(text);
    const features = this._extractFeatures(preprocessed);
    const scores = this._calculateScores(features);
    const result = this._generateResult(scores, features, options);

    if (this.enableCache && textHash) {
      this.cache.set(textHash, result);
    }

    return result;
  }

  /**
   * Pré-processamento do texto
   */
  _preprocessText(text) {
    return {
      original: text,
      cleaned: text.replace(/\s+/g, ' ').trim(),
      sentences: this._splitSentences(text),
      paragraphs: text.split(/\n\s*\n/).filter(p => p.trim()),
      words: this._tokenizeWords(text),
      wordCount: this._tokenizeWords(text).length
    };
  }

  /**
   * Divisão inteligente de sentenças
   */
  _splitSentences(text) {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 5)
      .map(s => ({
        text: s,
        wordCount: s.split(/\s+/).length,
        hasConnective: AI_PATTERNS.aiConnectives.some(conn => 
          s.toLowerCase().includes(conn)
        )
      }));
  }

  /**
   * Tokenização avançada de palavras
   */
  _tokenizeWords(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\sáàâãéêíóôõúç]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
  }

  /**
   * Extração de características linguísticas
   */
  _extractFeatures(preprocessed) {
    return {
      // Características básicas
      basic: this._extractBasicFeatures(preprocessed),
      
      // Análise de conectivos e transições
      connectives: this._analyzeConnectives(preprocessed),
      
      // Complexidade sintática
      syntax: this._analyzeSyntax(preprocessed),
      
      // Análise lexical
      lexical: this._analyzeLexical(preprocessed),
      
      // Análise semântica
      semantic: this._analyzeSemantic(preprocessed),
      
      // Análise estilométrica
      stylometric: this._analyzeStylometric(preprocessed),
      
      // Análise estatística
      statistical: this._analyzeStatistical(preprocessed)
    };
  }

  /**
   * Características básicas do texto
   */
  _extractBasicFeatures(preprocessed) {
    const { sentences, words, paragraphs } = preprocessed;
    
    return {
      sentenceCount: sentences.length,
      wordCount: words.length,
      paragraphCount: paragraphs.length,
      avgWordsPerSentence: words.length / sentences.length,
      avgSentencesPerParagraph: sentences.length / Math.max(paragraphs.length, 1),
      avgWordLength: words.reduce((sum, w) => sum + w.length, 0) / words.length
    };
  }

  /**
   * Análise de conectivos e padrões de transição
   */
  _analyzeConnectives(preprocessed) {
    const { cleaned } = preprocessed;
    const text = cleaned.toLowerCase();
    
    let connectiveScore = 0;
    const foundConnectives = [];
    
    // Conectivos típicos de IA
    AI_PATTERNS.aiConnectives.forEach(connective => {
      const regex = new RegExp(`\\b${connective}\\b`, 'g');
      const matches = text.match(regex);
      if (matches) {
        connectiveScore += matches.length * 0.1;
        foundConnectives.push({ connective, count: matches.length });
      }
    });

    // Estruturas complexas
    AI_PATTERNS.complexStructures.forEach(pattern => {
      const matches = cleaned.match(pattern);
      if (matches) {
        connectiveScore += matches.length * 0.15;
        foundConnectives.push({ pattern: pattern.source, count: matches.length });
      }
    });

    // Padrões de hedge
    AI_PATTERNS.hedgePatterns.forEach(hedge => {
      if (text.includes(hedge)) {
        connectiveScore += 0.05;
        foundConnectives.push({ hedge, count: 1 });
      }
    });

    return {
      score: Math.min(connectiveScore, 1),
      foundConnectives,
      density: connectiveScore / Math.max(preprocessed.sentences.length, 1)
    };
  }

  /**
   * Análise de complexidade sintática
   */
  _analyzeSyntax(preprocessed) {
    const { sentences } = preprocessed;
    
    // Análise de comprimento das sentenças
    const sentenceLengths = sentences.map(s => s.wordCount);
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const lengthVariation = this._calculateVariation(sentenceLengths);
    
    // Sentenças muito longas (típico de IA)
    const longSentences = sentenceLengths.filter(len => len > 25).length;
    const longSentenceRatio = longSentences / sentences.length;
    
    // Análise de subordinadas e coordenadas
    const complexSentences = sentences.filter(s => 
      (s.text.match(/,/g) || []).length > 2 ||
      /que|quando|onde|como|porque|se|embora|ainda que/gi.test(s.text)
    ).length;
    
    const complexityRatio = complexSentences / sentences.length;
    
    let syntaxScore = 0;
    if (avgLength > 20) syntaxScore += 0.2;
    if (longSentenceRatio > 0.3) syntaxScore += 0.3;
    if (complexityRatio > 0.4) syntaxScore += 0.2;
    if (lengthVariation < 0.3) syntaxScore += 0.15; // Pouca variação = típico de IA
    
    return {
      score: Math.min(syntaxScore, 1),
      avgSentenceLength: avgLength,
      lengthVariation,
      longSentenceRatio,
      complexityRatio
    };
  }

  /**
   * Análise lexical avançada
   */
  _analyzeLexical(preprocessed) {
    const { words } = preprocessed;
    
    // Diversidade lexical (Type-Token Ratio)
    const uniqueWords = new Set(words);
    const ttr = uniqueWords.size / words.length;
    
    // Análise de frequência de palavras
    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // Palavras muito frequentes (pode indicar repetição de IA)
    const highFreqWords = Object.entries(wordFreq)
      .filter(([word, freq]) => freq > 3 && word.length > 3)
      .length;
    
    // Linguagem acadêmica excessiva
    let academicScore = 0;
    AI_PATTERNS.academicLanguage.forEach(word => {
      if (words.includes(word)) {
        academicScore += 0.1;
      }
    });
    
    // Clichês
    let clicheScore = 0;
    const text = preprocessed.cleaned.toLowerCase();
    AI_PATTERNS.cliches.forEach(cliche => {
      if (text.includes(cliche)) {
        clicheScore += 0.15;
      }
    });
    
    let lexicalScore = 0;
    if (ttr < 0.4) lexicalScore += 0.2; // Baixa diversidade
    if (highFreqWords > words.length * 0.05) lexicalScore += 0.15;
    lexicalScore += Math.min(academicScore, 0.3);
    lexicalScore += Math.min(clicheScore, 0.4);
    
    return {
      score: Math.min(lexicalScore, 1),
      typeTokenRatio: ttr,
      academicLanguageScore: academicScore,
      clicheScore: clicheScore,
      highFrequencyWords: highFreqWords
    };
  }

  /**
   * Análise semântica básica
   */
  _analyzeSemantic(preprocessed) {
    const { sentences, cleaned } = preprocessed;
    
    // Coerência temática (análise simplificada)
    const topics = this._extractSimpleTopics(cleaned);
    const topicConsistency = this._calculateTopicConsistency(topics);
    
    // Análise de fluxo lógico
    const logicalFlow = this._analyzeLogicalFlow(sentences);
    
    // Repetição de ideias (típico de IA)
    const ideaRepetition = this._analyzeIdeaRepetition(sentences);
    
    let semanticScore = 0;
    if (topicConsistency > 0.8) semanticScore += 0.1; // Muito consistente pode ser IA
    if (logicalFlow > 0.7) semanticScore += 0.15; // Fluxo muito linear
    if (ideaRepetition > 0.3) semanticScore += 0.2; // Muita repetição
    
    return {
      score: Math.min(semanticScore, 1),
      topicConsistency,
      logicalFlow,
      ideaRepetition
    };
  }

  /**
   * Análise estilométrica
   */
  _analyzeStylometric(preprocessed) {
    const { words, sentences } = preprocessed;
    
    // Análise de pontuação
    const punctuationDensity = this._analyzePunctuation(preprocessed.original);
    
    // Padrões de capitalização
    const capitalizationPatterns = this._analyzeCapitalization(preprocessed.original);
    
    // Variação estilística
    const styleVariation = this._analyzeStyleVariation(sentences);
    
    let stylometricScore = 0;
    if (punctuationDensity.commaRatio > 0.15) stylometricScore += 0.1;
    if (styleVariation < 0.3) stylometricScore += 0.15; // Pouca variação estilística
    
    return {
      score: Math.min(stylometricScore, 1),
      punctuationDensity,
      capitalizationPatterns,
      styleVariation
    };
  }

  /**
   * Análise estatística avançada
   */
  _analyzeStatistical(preprocessed) {
    const { words, sentences } = preprocessed;
    
    // Distribuição de comprimento de palavras
    const wordLengths = words.map(w => w.length);
    const wordLengthVariation = this._calculateVariation(wordLengths);
    
    // Análise de entropia
    const entropy = this._calculateEntropy(words);
    
    // Padrões de repetição
    const repetitionPatterns = this._analyzeRepetitionPatterns(words);
    
    let statisticalScore = 0;
    if (entropy < 0.6) statisticalScore += 0.15; // Baixa entropia
    if (wordLengthVariation < 0.25) statisticalScore += 0.1;
    if (repetitionPatterns.score > 0.3) statisticalScore += 0.2;
    
    return {
      score: Math.min(statisticalScore, 1),
      entropy,
      wordLengthVariation,
      repetitionPatterns
    };
  }

  /**
   * Cálculo das pontuações finais
   */
  _calculateScores(features) {
    const weightedScores = {
      connectives: features.connectives.score * ANALYSIS_WEIGHTS.connectivePatterns,
      syntax: features.syntax.score * ANALYSIS_WEIGHTS.syntacticComplexity,
      lexical: features.lexical.score * ANALYSIS_WEIGHTS.lexicalAnalysis,
      semantic: features.semantic.score * ANALYSIS_WEIGHTS.semanticCoherence,
      stylometric: features.stylometric.score * ANALYSIS_WEIGHTS.stylometricAnalysis,
      statistical: features.statistical.score * ANALYSIS_WEIGHTS.statisticalAnalysis
    };

    const totalScore = Object.values(weightedScores).reduce((sum, score) => sum + score, 0);
    
    return {
      individual: weightedScores,
      total: Math.min(totalScore, 1),
      confidence: this._calculateConfidence(totalScore, features)
    };
  }

  /**
   * Geração do resultado final
   */
  _generateResult(scores, features, options) {
    const isAI = scores.total >= this.threshold;
    const confidence = Math.round(scores.confidence * 100);
    
    const result = {
      isAI,
      confidence,
      score: scores.total,
      threshold: this.threshold,
      reliability: this._calculateReliability(features.basic.wordCount)
    };

    if (options.detailed) {
      result.details = {
        scores: scores.individual,
        features,
        indicators: this._generateIndicators(features, scores),
        recommendations: this._generateRecommendations(scores, features)
      };
    }

    if (this.debugMode) {
      result.debug = {
        analysisWeights: ANALYSIS_WEIGHTS,
        processingInfo: this._getProcessingInfo(features)
      };
    }

    return result;
  }

  // Métodos auxiliares
  _generateHash(text) {
    return createHash('md5').update(text).digest('hex');
  }

  _calculateVariation(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean;
  }

  _calculateEntropy(words) {
    const freq = {};
    words.forEach(word => freq[word] = (freq[word] || 0) + 1);
    const total = words.length;
    return -Object.values(freq).reduce((entropy, count) => {
      const p = count / total;
      return entropy + p * Math.log2(p);
    }, 0) / Math.log2(total);
  }

  _calculateConfidence(score, features) {
    const textLength = features.basic.wordCount;
    let confidence = score;
    
    // Ajustar confiança baseada no tamanho do texto
    if (textLength < 50) confidence *= 0.7;
    else if (textLength < 100) confidence *= 0.85;
    else if (textLength > 500) confidence *= 1.1;
    
    return Math.min(confidence, 1);
  }

  _calculateReliability(wordCount) {
    if (wordCount < 30) return 'baixa';
    if (wordCount < 100) return 'moderada';
    if (wordCount < 300) return 'alta';
    return 'muito alta';
  }

  _generateIndicators(features, scores) {
    const indicators = [];
    
    if (scores.individual.connectives > 0.15) {
      indicators.push('Alto uso de conectivos formais típicos de IA');
    }
    if (features.syntax.avgSentenceLength > 22) {
      indicators.push('Sentenças excessivamente longas');
    }
    if (features.lexical.typeTokenRatio < 0.4) {
      indicators.push('Baixa diversidade lexical');
    }
    if (features.lexical.academicLanguageScore > 0.2) {
      indicators.push('Linguagem acadêmica excessiva');
    }
    if (features.statistical.entropy < 0.6) {
      indicators.push('Baixa entropia textual');
    }
    
    return indicators;
  }

  _generateRecommendations(scores, features) {
    const recommendations = [];
    
    if (scores.total > 0.8) {
      recommendations.push('Texto apresenta múltiplos indicadores de geração por IA');
    } else if (scores.total > 0.6) {
      recommendations.push('Possível texto gerado por IA - verificação manual recomendada');
    }
    
    return recommendations;
  }

  // Métodos de análise específica (implementações simplificadas)
  _extractSimpleTopics(text) {
    // Implementação simplificada de extração de tópicos
    const words = text.toLowerCase().split(/\s+/);
    const topics = {};
    words.forEach(word => {
      if (word.length > 5) {
        topics[word] = (topics[word] || 0) + 1;
      }
    });
    return Object.entries(topics).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }

  _calculateTopicConsistency(topics) {
    // Cálculo básico de consistência temática
    if (topics.length === 0) return 0;
    const total = topics.reduce((sum, [, count]) => sum + count, 0);
    const entropy = topics.reduce((ent, [, count]) => {
      const p = count / total;
      return ent - p * Math.log2(p);
    }, 0);
    return 1 - (entropy / Math.log2(topics.length));
  }

  _analyzeLogicalFlow(sentences) {
    // Análise básica de fluxo lógico
    let flowScore = 0;
    for (let i = 1; i < sentences.length; i++) {
      if (sentences[i].hasConnective) {
        flowScore += 0.1;
      }
    }
    return Math.min(flowScore, 1);
  }

  _analyzeIdeaRepetition(sentences) {
    // Análise básica de repetição de ideias
    const ideas = sentences.map(s => s.text.toLowerCase().substring(0, 20));
    const uniqueIdeas = new Set(ideas);
    return 1 - (uniqueIdeas.size / ideas.length);
  }

  _analyzePunctuation(text) {
    const totalChars = text.length;
    const commas = (text.match(/,/g) || []).length;
    const periods = (text.match(/\./g) || []).length;
    const semicolons = (text.match(/;/g) || []).length;
    
    return {
      commaRatio: commas / totalChars,
      periodRatio: periods / totalChars,
      semicolonRatio: semicolons / totalChars
    };
  }

  _analyzeCapitalization(text) {
    const words = text.split(/\s+/);
    const capitalizedWords = words.filter(w => /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(w)).length;
    return {
      capitalizationRatio: capitalizedWords / words.length
    };
  }

  _analyzeStyleVariation(sentences) {
    // Análise básica de variação estilística
    const lengths = sentences.map(s => s.wordCount);
    return this._calculateVariation(lengths);
  }

  _analyzeRepetitionPatterns(words) {
    const ngrams = this._generateNgrams(words, 2);
    const freq = {};
    ngrams.forEach(ngram => {
      const key = ngram.join(' ');
      freq[key] = (freq[key] || 0) + 1;
    });
    
    const repeated = Object.values(freq).filter(count => count > 1).length;
    return {
      score: repeated / ngrams.length,
      repeatedNgrams: repeated
    };
  }

  _generateNgrams(words, n) {
    const ngrams = [];
    for (let i = 0; i <= words.length - n; i++) {
      ngrams.push(words.slice(i, i + n));
    }
    return ngrams;
  }

  _getProcessingInfo(features) {
    return {
      textComplexity: features.basic.avgWordsPerSentence > 15 ? 'alta' : 'baixa',
      analysisDepth: 'completa',
      featuresExtracted: Object.keys(features).length
    };
  }
}

// Funções utilitárias exportadas
export function createDetector(options = {}) {
  return new AITextDetector(options);
}

export function detectAI(text, options = {}) {
  const detector = new AITextDetector(options);
  return detector.analyze(text, options);
}

export function isLikelyAI(text, threshold = 0.5) {
  const result = detectAI(text, { threshold });
  return result.isAI;
}

export function detectAIBatch(texts, options = {}) {
  const detector = new AITextDetector(options);
  return texts.map((text, index) => ({
    index,
    preview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    result: detector.analyze(text, options)
  }));
}

export function analyzeTextQuality(text, options = {}) {
  const detector = new AITextDetector({ ...options, detailed: true });
  const result = detector.analyze(text, { detailed: true });
  
  return {
    aiDetection: result,
    qualityMetrics: {
      readability: result.details.features.basic.avgWordsPerSentence < 20 ? 'boa' : 'complexa',
      lexicalRichness: result.details.features.lexical.typeTokenRatio > 0.5 ? 'alta' : 'baixa',
      styleConsistency: result.details.features.stylometric.styleVariation > 0.3 ? 'variada' : 'uniforme'
    }
  };
}