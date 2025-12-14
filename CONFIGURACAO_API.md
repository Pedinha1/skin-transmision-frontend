# Configuração da API do Google Gemini

## Passo a passo para configurar a API key:

1. **Crie ou edite o arquivo `.env` na pasta `skin-transmision-frontend`**

2. **Adicione a seguinte linha no arquivo `.env`:**
   ```
   VITE_GEMINI_API_KEY=AIzaSyDbVMCsJfDtzarmxar-c4mQlh6t5DHF7AU
   ```

3. **Certifique-se de que o arquivo `.env` está na raiz do projeto frontend:**
   ```
   skin-transmision-frontend/
   ├── .env          ← Arquivo aqui
   ├── src/
   ├── package.json
   └── ...
   ```

4. **REINICIE o servidor de desenvolvimento** após adicionar a API key:
   - Pare o servidor (Ctrl+C)
   - Inicie novamente com `npm run dev` ou `yarn dev`

5. **Verifique no console do navegador** se a API key está sendo lida corretamente:
   - Procure por: `🔍 [aiSearchService] API key existe: true`
   - Procure por: `🔍 [aiSearchService] API key length: 39`

## Informações do seu projeto:
- **API Key:** AIzaSyDbVMCsJfDtzarmxar-c4mQlh6t5DHF7AU
- **Projeto:** projects/368835152660
- **Número do Projeto:** 368835152660

## Modelo usado:
- **gemini-1.5-flash** (mais rápido e eficiente)

## Troubleshooting:

Se ainda der erro após configurar:
1. Verifique se o arquivo `.env` está na pasta correta
2. Verifique se não há espaços extras na API key
3. Reinicie o servidor de desenvolvimento
4. Limpe o cache do navegador (Ctrl+Shift+R)
5. Verifique os logs no console do navegador para ver o erro específico

