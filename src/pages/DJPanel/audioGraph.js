/**
 * Sistema de Grafo de Áudio WebRTC
 * 
 * Garante um único AudioContext global e grafo correto:
 * MediaElementSource → Hub (GainNode) → Analyser + MediaStreamDestination
 */

/**
 * Inicializa o AudioContext global (singleton)
 */
export const getGlobalAudioContext = (audioContextRef) => {
  if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    console.log('✅ AudioContext global criado');
  }
  
  // Retomar se suspenso
  if (audioContextRef.current.state === 'suspended') {
    audioContextRef.current.resume().catch(err => {
      console.warn('⚠️ Erro ao retomar AudioContext:', err);
    });
  }
  
  return audioContextRef.current;
};

/**
 * Cria o grafo de áudio completo
 * MediaElementSource → Hub → Analyser + MediaStreamDestination
 */
export const createAudioGraph = ({
  audioContext,
  audioElement,
  mediaSourceRef,
  hubRef,
  analyserRef,
  broadcastDestinationRef,
  broadcastGainRef,
  broadcastStreamRef,
  onHubCreated
}) => {
  console.log('🔧 Criando grafo de áudio...');
  
  // 1. Criar MediaElementSource (apenas uma vez por elemento)
  if (!mediaSourceRef.current) {
    try {
      if (audioElement.srcObject) {
        console.warn('⚠️ Elemento de áudio tem srcObject, não pode criar MediaElementSource');
        return false;
      }
      
      mediaSourceRef.current = audioContext.createMediaElementSource(audioElement);
      console.log('✅ MediaElementSource criado');
    } catch (error) {
      if (error.message && error.message.includes('already connected')) {
        console.log('ℹ️ MediaElementSource já existe para este elemento');
        // Não podemos criar um novo MediaElementSource, mas podemos criar o hub
        // O MediaElementSource existente provavelmente está conectado a algo
        // Vamos criar o hub e tentar conectá-lo quando possível
        if (!hubRef.current) {
          console.log('🔄 Criando hub mesmo sem MediaElementSource no ref');
          hubRef.current = audioContext.createGain();
          hubRef.current.gain.value = 1.0;
          console.log('✅ Hub criado (será conectado quando MediaElementSource for encontrado)');
        }
        // Continuar mesmo sem MediaElementSource no ref - o hub será conectado depois
      } else {
        console.error('❌ Erro ao criar MediaElementSource:', error);
        return false;
      }
    }
  }
  
  // 2. Criar Hub (GainNode central) - sempre em 100%, não afetado pelo mixer
  if (!hubRef.current) {
    hubRef.current = audioContext.createGain();
    hubRef.current.gain.value = 1.0; // Sempre 100% - volume do mixer não afeta o broadcast
    console.log('✅ Hub (GainNode) criado (volume fixo em 100%)');
  } else {
    // Garantir que o hub sempre está em 100%
    hubRef.current.gain.value = 1.0;
  }
  
  // 3. Conectar MediaElementSource → Hub (se MediaElementSource estiver no ref)
  if (mediaSourceRef.current && hubRef.current) {
    try {
      // Desconectar conexões antigas do MediaElementSource
      try {
        mediaSourceRef.current.disconnect();
      } catch (e) {
        // Pode não estar conectado
      }
      
      mediaSourceRef.current.connect(hubRef.current);
      console.log('✅ MediaElementSource → Hub conectado');
    } catch (error) {
      console.error('❌ Erro ao conectar MediaElementSource ao Hub:', error);
      // Não retornar false aqui - o hub pode ser conectado depois
      console.log('ℹ️ Continuando sem conectar MediaElementSource ao Hub agora');
    }
  } else if (!mediaSourceRef.current && hubRef.current) {
    console.log('ℹ️ Hub criado mas MediaElementSource não está no ref - será conectado quando disponível');
  }
  
  // 4. Criar Analyser para visualização
  if (!analyserRef.current) {
    analyserRef.current = audioContext.createAnalyser();
    analyserRef.current.fftSize = 256; // Maior para melhor análise
    analyserRef.current.smoothingTimeConstant = 0.8;
    console.log('✅ Analyser criado');
  }
  
  // 5. NÃO conectar Hub → Analyser aqui diretamente
  // CRÍTICO: O analyser deve ser conectado através do localVolumeGainNode no DJPanel
  // para permitir controle de volume local sem afetar o broadcast
  // A conexão hub → analyser → localVolumeGain → destination será feita no DJPanel
  // Isso garante que quando o volume é 0, o áudio é completamente mudo
  if (hubRef.current && analyserRef.current) {
    console.log('ℹ️ Hub e Analyser criados - conexão será feita via localVolumeGainNode no DJPanel');
  }
  
  // 6. Criar MediaStreamDestination para WebRTC
  if (!broadcastDestinationRef.current) {
    broadcastDestinationRef.current = audioContext.createMediaStreamDestination();
    broadcastStreamRef.current = broadcastDestinationRef.current.stream;
    console.log('✅ MediaStreamDestination criado');
  }
  
  // 7. Criar GainNode para controlar volume do broadcast
  if (!broadcastGainRef.current) {
    broadcastGainRef.current = audioContext.createGain();
    broadcastGainRef.current.gain.value = 1.0; // Sempre 100% - volume do mixer não afeta o broadcast
    console.log('✅ Broadcast GainNode criado (volume fixo em 100%)');
  } else {
    // Garantir que o volume do broadcast sempre está em 100%
    broadcastGainRef.current.gain.value = 1.0;
  }
  
  // 8. Conectar Hub → Broadcast Gain → MediaStreamDestination
  if (hubRef.current && broadcastGainRef.current && broadcastDestinationRef.current) {
    try {
      // Desconectar conexões antigas do Broadcast Gain
      try {
        broadcastGainRef.current.disconnect();
      } catch (e) {
        // Pode não estar conectado
      }
      
      hubRef.current.connect(broadcastGainRef.current);
      broadcastGainRef.current.connect(broadcastDestinationRef.current);
      console.log('✅ Hub → Broadcast Gain → MediaStreamDestination conectado');
    } catch (error) {
      console.error('❌ Erro ao conectar Hub ao Broadcast:', error);
      // Não retornar false - o hub pode não estar recebendo áudio ainda, mas a estrutura está correta
      console.log('ℹ️ Continuando mesmo com erro na conexão do Broadcast');
    }
  }
  
  // Se o MediaElementSource não está no ref mas o hub foi criado, ainda podemos continuar
  // O hub será conectado ao MediaElementSource quando ele for encontrado
  const hasMediaSource = !!mediaSourceRef.current;
  const hasHub = !!hubRef.current;
  const hasDestination = !!broadcastDestinationRef.current;
  
  if (hasHub && hasDestination) {
    console.log('✅ Grafo de áudio criado!');
    if (hasMediaSource) {
      console.log('📊 Estrutura completa: MediaElementSource → Hub → [Analyser + Broadcast]');
    } else {
      console.log('📊 Estrutura parcial: Hub → [Analyser + Broadcast] (MediaElementSource será conectado depois)');
    }
    
    if (onHubCreated) {
      onHubCreated(hubRef.current);
    }
    
    return true;
  } else {
    console.error('❌ Não foi possível criar grafo de áudio - faltam componentes essenciais');
    return false;
  }
};

/**
 * Verifica se há dados de áudio fluindo (RMS > 0)
 */
export const checkAudioDataFlow = (analyserRef) => {
  if (!analyserRef.current) {
    return { hasData: false, rms: 0, max: 0, avg: 0 };
  }
  
  const analyser = analyserRef.current;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  const floatArray = new Float32Array(bufferLength);
  
  // Verificar frequência
  analyser.getByteFrequencyData(dataArray);
  
  // Verificar domínio do tempo (mais preciso para detectar silêncio)
  analyser.getFloatTimeDomainData(floatArray);
  
  // Calcular RMS (Root Mean Square) do domínio do tempo
  let sumSquares = 0;
  for (let i = 0; i < floatArray.length; i++) {
    sumSquares += floatArray[i] * floatArray[i];
  }
  const rms = Math.sqrt(sumSquares / floatArray.length);
  
  // Calcular max e avg do domínio de frequência
  let max = 0;
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    if (dataArray[i] > max) max = dataArray[i];
    sum += dataArray[i];
  }
  const avg = sum / dataArray.length;
  
  const hasData = rms > 0.001 || max > 0; // Threshold mínimo
  
  return { hasData, rms, max, avg: avg.toFixed(2) };
};

/**
 * Atualiza o volume do broadcast
 * NOTA: O volume do broadcast sempre fica em 100% - não é afetado pelo mixer do DJ
 */
export const updateBroadcastVolume = (broadcastGainRef, volume) => {
  if (broadcastGainRef.current) {
    // Volume do broadcast sempre em 100% - não é afetado pelo mixer do DJ
    broadcastGainRef.current.gain.value = 1.0;
    console.log(`🔊 Volume do broadcast fixado em 100% (não afetado pelo mixer)`);
  }
};

