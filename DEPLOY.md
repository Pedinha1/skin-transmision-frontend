# 🚀 Guia de Deploy - Frontend

## 📋 Configuração de Variáveis de Ambiente

Para que o frontend funcione corretamente em produção, você precisa configurar as seguintes variáveis de ambiente:

### Variáveis Obrigatórias

```env
VITE_API_BASE=https://skin-transmision-backend-production.up.railway.app
VITE_SOCKET_URL=https://skin-transmision-backend-production.up.railway.app
```

### ⚠️ IMPORTANTE

1. **URLs devem ser completas**: Sempre use URLs completas com `https://` ou `http://`
2. **Sem barra no final**: Não coloque `/` no final da URL
3. **Rebuild necessário**: Após alterar variáveis de ambiente, você DEVE fazer rebuild do projeto

## 🔧 Como Configurar

### Netlify

1. Acesse o painel do Netlify
2. Vá em **Site settings** > **Environment variables**
3. Adicione:
   - `VITE_API_BASE` = `https://skin-transmision-backend-production.up.railway.app`
   - `VITE_SOCKET_URL` = `https://skin-transmision-backend-production.up.railway.app`
4. Faça um novo deploy

### Vercel

1. Acesse o painel do Vercel
2. Vá em **Settings** > **Environment Variables**
3. Adicione as variáveis acima
4. Faça um novo deploy

### Railway

1. Acesse o painel do Railway
2. Vá em **Variables**
3. Adicione as variáveis acima
4. Faça um novo deploy

### Build Local

Se estiver fazendo build local:

```bash
# Criar arquivo .env.production
echo "VITE_API_BASE=https://skin-transmision-backend-production.up.railway.app" > .env.production
echo "VITE_SOCKET_URL=https://skin-transmision-backend-production.up.railway.app" >> .env.production

# Fazer build
npm run build
```

## 🔍 Verificando se Está Configurado Corretamente

Após o deploy, abra o console do navegador (F12) e verifique:

```javascript
console.log(import.meta.env.VITE_API_BASE)
```

Deve mostrar a URL completa do backend, não `undefined` ou `http://localhost:8080`.

## ❌ Erros Comuns

### Erro 404 nas requisições

**Causa**: `VITE_API_BASE` não está configurado ou está incorreto.

**Solução**: 
1. Verifique se a variável está configurada no ambiente de produção
2. Faça um novo build e deploy
3. Verifique se a URL está correta (sem barra no final)

### CORS Error

**Causa**: Backend não está configurado para aceitar requisições do frontend.

**Solução**: Configure `FRONTEND_ORIGIN` no backend com a URL do frontend:
```env
FRONTEND_ORIGIN=https://playsnap.com.br
```

### Socket.IO não conecta

**Causa**: `VITE_SOCKET_URL` não está configurado ou está incorreto.

**Solução**: Configure `VITE_SOCKET_URL` com a URL completa do backend.

## 📝 Checklist de Deploy

- [ ] Variável `VITE_API_BASE` configurada com URL completa do backend
- [ ] Variável `VITE_SOCKET_URL` configurada com URL completa do backend
- [ ] Build feito após configurar variáveis
- [ ] Deploy realizado
- [ ] Testado login/registro
- [ ] Testado conexão Socket.IO
- [ ] Backend configurado com `FRONTEND_ORIGIN` correto

---

**Desenvolvido com ❤️ para transmissão de rádio online**

