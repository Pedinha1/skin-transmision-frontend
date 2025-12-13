# 🎵 Play DJ - Frontend

Frontend do sistema de transmissão de rádio online com painel DJ, player para ouvintes, chat em tempo real e streaming via Socket.IO.

## 📋 Requisitos

- **Node.js** 18+ ([Download](https://nodejs.org))
- **NPM** ou **Yarn**

## 🚀 Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp env-example .env
# Edite o arquivo .env com suas configurações

# 3. Iniciar servidor de desenvolvimento
npm run dev

# 4. Build para produção
npm run build
npm run preview
```

## ⚙️ Configuração

Crie um arquivo `.env` na raiz do projeto baseado no `env-example`:

```env
VITE_API_BASE=http://localhost:8080
VITE_SOCKET_URL=http://localhost:8080
VITE_PUBLIC_KEY=
VITE_THEME=dark
```

## 🎮 Funcionalidades

### Painel DJ
- Controle completo de reprodução
- Mixagem de áudio (player + microfone)
- Visualizador de espectro de áudio
- Chat em tempo real
- Sistema de pedidos de música
- Configuração de nome da rádio
- Streaming direto via Socket.IO

### Player Ouvinte
- Reprodução automática do stream
- Chat em tempo real
- Sistema de pedidos de música
- Interface responsiva
- Detecção automática de transmissão

### Streaming
- Streaming direto via Socket.IO
- Conexão automática quando DJ inicia
- Suporte a MediaSource API
- Formato: WebM/Opus

## 🛠️ Estrutura do Projeto

```
frontend/
├── src/
│   ├── pages/            # Páginas principais
│   │   ├── DJPanel/      # Painel do DJ
│   │   ├── ListenerPlayer/ # Player do ouvinte
│   │   └── Login/        # Página de login
│   ├── components/       # Componentes React
│   │   ├── ChatPanel/
│   │   ├── MixerConsole/
│   │   ├── GraphicEQ/
│   │   └── ...
│   ├── services/         # Serviços
│   │   ├── apiClient/
│   │   └── socketClient/
│   ├── context/          # Context API
│   ├── styles/          # Estilos globais
│   ├── utils/           # Utilitários
│   ├── App.jsx          # Componente principal
│   └── main.jsx         # Entry point
├── public/              # Arquivos estáticos
├── .env                 # Variáveis de ambiente (não commitar)
├── env-example          # Exemplo de variáveis de ambiente
└── package.json
```

## 📦 Dependências Principais

- **React** - Framework UI
- **React Router** - Roteamento
- **Socket.IO Client** - Cliente Socket.IO
- **Styled Components** - Estilização
- **Axios** - Cliente HTTP

## 🔧 Scripts

```bash
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build de produção
```

## 🎨 Tecnologias

- **React 19** - Framework UI moderno
- **Vite** - Build tool rápida
- **Styled Components** - CSS-in-JS
- **Socket.IO Client** - Comunicação em tempo real
- **Web Audio API** - Processamento de áudio
- **MediaSource API** - Streaming de mídia

## 🔐 Segurança

- Não commite arquivos `.env` no Git
- Use HTTPS em produção
- Configure CORS adequadamente no backend

## 📝 Notas

- O streaming usa **Socket.IO** para receber chunks de áudio
- O sistema detecta automaticamente quando o DJ inicia a transmissão
- O nome da rádio pode ser configurado no painel DJ
- O nome da rádio é sincronizado automaticamente com os ouvintes

## 🐛 Troubleshooting

### Erro: Conexão Socket.IO falhou

1. Verifique se o backend está rodando
2. Verifique `VITE_SOCKET_URL` no `.env`
3. Verifique se a porta está correta

### Erro: API não encontrada

1. Verifique se o backend está rodando
2. Verifique `VITE_API_BASE` no `.env`
3. Verifique CORS no backend

### Erro: Áudio não toca

1. Verifique o console do navegador (F12)
2. Verifique se o DJ está transmitindo
3. Verifique se o MediaSource está suportado pelo navegador

## 📄 Licença

Este projeto é privado e proprietário.

## 👤 Autor

**Pedinha1**
- Email: piripa24horas@gmail.com

---

**Desenvolvido com ❤️ para transmissão de rádio online**

