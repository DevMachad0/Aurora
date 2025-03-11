# Aurora

Aurora é uma assistente pessoal corporativa projetada para fornecer apoio personalizado e eficiente, ajudando os usuários com questões diárias, utilizando os dados disponíveis sobre suas preferências e necessidades.

## Funcionalidades

- **Chat com IA**: Interaja com a assistente Aurora para obter respostas rápidas e precisas.
- **Histórico de Conversas**: Visualize e filtre o histórico de conversas com base em data, hora e texto.
- **Autenticação**: Proteja o acesso ao chat e ao histórico de conversas com autenticação baseada em token.
- **Configurações do Usuário**: Visualize e edite as informações do perfil do usuário.
- **Suporte ao Cliente**: Sistema de suporte ao cliente com geração de número de protocolo.

## Estrutura do Projeto

- **/src/routes**: Contém as rotas da API.
  - `authRoutes.js`: Rota para autenticação de usuários.
  - `chatRoutes.js`: Rota para processar mensagens do usuário.
  - `chatHistoryRoutes.js`: Rota para obter o histórico de conversas.
  - `empresaRoutes.js`: Rota para gerenciar dados da empresa.
  - `supportClientRoutes.js`: Rota para gerenciar chamados de suporte ao cliente.
  - `userRoutes.js`: Rota para gerenciar usuários.
  - `storageRoutes.js`: Rota para obter o status de armazenamento.
  - `domainRoutes.js`: Rota para gerenciar domínios.
  - `chat_support.js`: Rota para suporte ao cliente via chat.
  - `chat_support_bot.js`: Configuração do bot de suporte ao cliente.
- **/src/models**: Contém os modelos de dados do Mongoose.
  - `auroraCoreModel.js`: Modelo para dados centrais da Aurora.
  - `chatHistoryModel.js`: Modelo para histórico de conversas.
  - `domainModel.js`: Modelo para domínios.
  - `empresaModel.js`: Modelo para dados da empresa.
  - `supportClientModel.js`: Modelo para clientes de suporte.
  - `userModel.js`: Modelo para usuários.
- **/src/services**: Contém os serviços de lógica de negócios.
  - `auroraCoreService.js`: Serviço para dados centrais da Aurora.
  - `chatService.js`: Serviço para histórico de conversas.
  - `userService.js`: Serviço para gerenciamento de usuários.
- **/src/middleware**: Contém os middlewares.
  - `verifyToken.js`: Middleware para verificar tokens de autenticação.
- **/src/controllers**: Contém os controladores.
  - `authController.js`: Controlador para autenticação de usuários.
- **/src/config**: Contém as configurações.
  - `storageConfig.js`: Configuração para status de armazenamento.
- **/public**: Contém os arquivos estáticos (HTML, CSS, JS).
  - `chat-aurora.html`: Página principal do chat.
  - `chat-history.html`: Página para visualizar o histórico de conversas.
  - `chat-config.html`: Página para configurações do usuário.
  - **/styles**: Contém os arquivos CSS.
    - `chat-aurora.css`: Estilos para a página do chat.
    - `chat-history-desktop.css`: Estilos para a página de histórico de conversas (desktop).
    - `chat-history-mobile.css`: Estilos para a página de histórico de conversas (mobile).
    - `chat-config.css`: Estilos para a página de configurações do usuário.
    - `desktop.css`: Estilos para a página de login (desktop).
    - `mobile.css`: Estilos para a página de login (mobile).
  - **/scripts**: Contém os arquivos JavaScript.
    - `chat-aurora.js`: Lógica do chat.
    - `chat-history.js`: Lógica para filtrar e exibir o histórico de conversas.
    - `config.js`: Lógica para a página de configurações do usuário.
    - **/config**: Contém os scripts de configuração.
      - `verifyToken.js`: Verificação de token no frontend.
- **/aurora_api**: Contém a API da Aurora.
  - `html.html`: Interface de chat para suporte ao cliente.

## Instalação

1. Clone o repositório:
    ```bash
    git clone https://github.com/seu-usuario/aurora.git
    ```
2. Navegue até o diretório do projeto:
    ```bash
    cd aurora
    ```
3. Instale as dependências:
    ```bash
    npm install
    ```

## Configuração

1. Crie um arquivo `.env` na raiz do projeto e adicione as seguintes variáveis:
    ```env
    MONGO_URI=your_mongo_uri
    PORT=3000
    JWT_SECRET=your_jwt_secret
    GEMINI_API_KEY=your_gemini_api_key
    ```

## Uso

1. Inicie o servidor:
    ```bash
    npm start
    ```
2. Abra o navegador e acesse `http://localhost:3000`.

## Contribuição

1. Faça um fork do projeto.
2. Crie uma nova branch:
    ```bash
    git checkout -b minha-nova-funcionalidade
    ```
3. Faça suas alterações e commit:
    ```bash
    git commit -m 'Adiciona nova funcionalidade'
    ```
4. Envie para o repositório remoto:
    ```bash
    git push origin minha-nova-funcionalidade
    ```
5. Abra um Pull Request.

## Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
