# Aurora

Aurora é uma assistente pessoal corporativa projetada para fornecer apoio personalizado e eficiente, ajudando os usuários com questões diárias, utilizando os dados disponíveis sobre suas preferências e necessidades.

## Funcionalidades

- **Chat com IA**: Interaja com a assistente Aurora para obter respostas rápidas e precisas.
- **Histórico de Conversas**: Visualize e filtre o histórico de conversas com base em data, hora e texto.
- **Autenticação**: Proteja o acesso ao chat e ao histórico de conversas com autenticação baseada em token.

## Estrutura do Projeto

- **/src/routes**: Contém as rotas da API.
  - `chatRoutes.js`: Rota para processar mensagens do usuário.
  - `chatHistoryRoutes.js`: Rota para obter o histórico de conversas.
- **/public**: Contém os arquivos estáticos (HTML, CSS, JS).
  - `chat-aurora.html`: Página principal do chat.
  - `chat-history.html`: Página para visualizar o histórico de conversas.
  - **/styles**: Contém os arquivos CSS.
    - `chat-aurora.css`: Estilos para a página do chat.
    - `chat-history-desktop.css`: Estilos para a página de histórico de conversas (desktop).
    - `chat-history-mobile.css`: Estilos para a página de histórico de conversas (mobile).
  - **/scripts**: Contém os arquivos JavaScript.
    - `chat-aurora.js`: Lógica do chat.
    - `chat-history.js`: Lógica para filtrar e exibir o histórico de conversas.

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
