# Chat de Empresas - Frontend

Frontend em React + TypeScript + Tailwind CSS para chat com LLM sobre informações de empresas.

## 🚀 Tecnologias

- React 18
- TypeScript
- Tailwind CSS
- Vite

## 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn

## 🔧 Instalação

1. Clone o repositório
2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:

```bash
VITE_API_URL=http://localhost:3000
```

## 🏃 Como executar

### Modo de desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

### Build para produção

```bash
npm run build
```

### Preview da build de produção

```bash
npm run preview
```

## 🎨 Funcionalidades

- ✅ Interface de chat moderna e responsiva
- ✅ Envio de mensagens para LLM backend
- ✅ Exibição de histórico de conversas
- ✅ Indicador de carregamento durante respostas
- ✅ Tratamento de erros
- ✅ Design responsivo com Tailwind CSS

## 🔌 API Backend

O frontend espera que o backend exponha o seguinte endpoint:

### POST `/api/chat`

**Request:**

```json
{
  "message": "string"
}
```

**Response:**

```json
{
  "response": "string"
}
```

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── ChatContainer.tsx    # Container principal do chat
│   ├── MessageList.tsx       # Lista de mensagens
│   ├── MessageBubble.tsx     # Componente de mensagem individual
│   └── ChatInput.tsx         # Input para enviar mensagens
├── services/
│   └── api.ts                # Serviço de comunicação com backend
├── types/
│   └── chat.ts               # Tipos TypeScript
├── App.tsx                   # Componente principal
├── main.tsx                  # Entry point
└── index.css                 # Estilos globais com Tailwind
```

## 🎯 Customização

### Alterar URL do Backend

Modifique a variável `VITE_API_URL` no arquivo `.env`

### Personalizar cores

Edite o arquivo `tailwind.config.js` para modificar o tema:

```js
export default {
  theme: {
    extend: {
      colors: {
        // suas cores personalizadas
      },
    },
  },
};
```

## 📝 Licença

Este projeto está sob a licença MIT.
