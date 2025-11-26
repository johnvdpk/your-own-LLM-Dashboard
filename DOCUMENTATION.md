# Technische Documentatie - OpenRouter Chat Application

## Inhoudsopgave

1. [Overzicht](#overzicht)
2. [Architectuur](#architectuur)
3. [Technische Stack](#technische-stack)
4. [Project Structuur](#project-structuur)
5. [API Documentatie](#api-documentatie)
6. [Componenten Documentatie](#componenten-documentatie)
7. [Design Patterns](#design-patterns)
8. [Data Flow](#data-flow)
9. [Type Definitions](#type-definitions)
10. [Configuratie](#configuratie)
11. [Voorbeelden](#voorbeelden)
12. [Troubleshooting](#troubleshooting)
13. [Uitbreidingsmogelijkheden](#uitbreidingsmogelijkheden)

---

## Overzicht

De OpenRouter Chat Application is een moderne, client-side chat interface gebouwd met Next.js 15 en TypeScript. De applicatie maakt gebruik van OpenRouter als gateway om te communiceren met verschillende Large Language Models (LLMs) zoals Claude, GPT-4, en Gemini via een enkele, elegante interface.

### Kernfunctionaliteiten

- **Multi-Model Support**: Schakelen tussen verschillende LLM providers zonder code wijzigingen
- **Real-time Chat**: Interactieve chat interface met typewriter effect voor antwoorden
- **Modern UI**: Schone, responsieve design met CSS Modules
- **Model Selectie**: Dropdown interface voor het wisselen tussen beschikbare modellen
- **Server-side Security**: API keys worden server-side opgeslagen en nooit blootgesteld aan de client
- **Type Safety**: Volledige TypeScript ondersteuning voor type-safe development

---

## Architectuur

### Algemene Architectuur

De applicatie volgt een **client-server architectuur** met Next.js App Router:

```
┌─────────────────┐
│   Client (UI)   │
│  React Components│
└────────┬────────┘
         │ HTTP POST
         │ /api/chat
         ▼
┌─────────────────┐
│  Next.js API    │
│  Route Handler  │
└────────┬────────┘
         │ SDK Call
         ▼
┌─────────────────┐
│   OpenRouter    │
│      API        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  LLM Providers  │
│ (Claude/GPT/etc)│
└─────────────────┘
```

### Client-Side Architectuur

De client-side gebruikt **React Server Components** en **Client Components**:

- **Server Components**: `app/page.tsx`, `app/layout.tsx` (statische rendering)
- **Client Components**: Alle interactieve componenten (`'use client'` directive)

### State Management

De applicatie gebruikt **React Hooks** voor state management:

- **Local State**: `useState` voor component-specifieke state
- **No Global State**: Geen Redux/Zustand nodig door simpele component hiërarchie
- **State Flow**: Unidirectional data flow van parent naar child components

---

## Technische Stack

### Core Dependencies

| Package | Versie | Doel |
|---------|--------|------|
| `next` | 15.1.4 | React framework met App Router |
| `react` | 19.2.0 | UI library |
| `react-dom` | 19.2.0 | React DOM rendering |
| `typescript` | ^5 | Type-safe JavaScript |
| `@openrouter/sdk` | ^0.1.27 | OpenRouter API client |

### Development Dependencies

| Package | Versie | Doel |
|---------|--------|------|
| `eslint` | ^9 | Code linting |
| `eslint-config-next` | 15.1.0 | Next.js ESLint configuratie |
| `@types/node` | ^20 | Node.js type definitions |
| `@types/react` | ^19 | React type definitions |
| `@types/react-dom` | ^19 | React DOM type definitions |

### Build Tools

- **Next.js Build System**: Geïntegreerde bundling en optimizatie
- **TypeScript Compiler**: Type checking en transpilatie
- **CSS Modules**: Scoped styling per component

---

## Project Structuur

```
open-router-chat/
├── app/                          # Next.js App Router directory
│   ├── api/
│   │   └── chat/
│   │       └── route.ts         # API route handler voor chat requests
│   ├── globals.css               # Globale CSS variabelen en reset
│   ├── layout.tsx                # Root layout component
│   └── page.tsx                  # Home page (entry point)
│
├── components/                   # React componenten
│   ├── Chat/
│   │   ├── Chat/
│   │   │   ├── Chat.tsx          # Hoofd chat component (state management)
│   │   │   └── Chat.module.css   # Chat component styles
│   │   ├── ChatInput/
│   │   │   ├── ChatInput.tsx     # Message input component
│   │   │   └── ChatInput.module.css
│   │   └── Message/
│   │       ├── Message.tsx       # Individuele message component
│   │       └── Message.module.css
│   └── ModelSelector/
│       └── ModelSelector/
│           ├── ModelSelector.tsx # Model selectie dropdown
│           └── ModelSelector.module.css
│
├── lib/                          # Utility functies en configuratie
│   └── openrouter.ts            # OpenRouter SDK initialisatie en helpers
│
├── types/                        # TypeScript type definitions
│   └── chat.ts                  # Chat gerelateerde types
│
├── public/                       # Statische assets
│
├── next.config.ts                # Next.js configuratie
├── tsconfig.json                 # TypeScript configuratie
├── package.json                  # Dependencies en scripts
└── DOCUMENTATION.md              # Deze documentatie
```

### Component Organisatie

Elk component heeft zijn eigen directory met:
- `ComponentName.tsx`: Component logica
- `ComponentName.module.css`: Component-specifieke styles

Dit zorgt voor:
- **Encapsulatie**: Styles zijn scoped tot het component
- **Organisatie**: Duidelijke structuur per component
- **Maintainability**: Eenvoudig te vinden en aan te passen

---

## API Documentatie

### Endpoint: `/api/chat`

#### Methode: `POST`

#### Beschrijving
Deze endpoint handelt chat requests af door ze door te sturen naar OpenRouter API met het geselecteerde model.

#### Request Body

```typescript
{
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  model: string; // Model ID (bijv. 'anthropic/claude-3.5-sonnet')
}
```

#### Request Voorbeeld

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hallo, hoe gaat het?"
    }
  ],
  "model": "anthropic/claude-3.5-sonnet"
}
```

#### Response Success (200)

```typescript
{
  message: {
    role: 'assistant';
    content: string;
  }
}
```

#### Response Error (400)

```json
{
  "error": "Messages array is required"
}
```

#### Response Error (500)

```json
{
  "error": "OpenRouter API key is not configured",
  "details": "Stack trace (alleen in development)"
}
```

#### Error Handling

De API route implementeert meerdere lagen van error handling:

1. **Environment Variable Check**: Controleert of `OPENROUTER_API_KEY` is ingesteld
2. **Request Validation**: Valideert dat `messages` een array is
3. **Response Validation**: Controleert de structuur van OpenRouter response
4. **Try-Catch**: Vangt alle onverwachte errors op

#### Code Referentie

```4:66:open-router-chat/app/api/chat/route.ts
export async function POST(request: NextRequest) {
  try {
    // Check if API key is set
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'OpenRouter API key is not configured' },
        { status: 500 }
      );
    }

    const { messages, model } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    console.log('Sending request to OpenRouter:', { model: model || 'openai/gpt-4o', messageCount: messages.length });

    const completion = await openRouter.chat.send(
      {
        model: model || 'openai/gpt-4o',
        messages: messages as ChatMessage[],
        stream: false,
      },
      {
        headers: getOpenRouterHeaders(),
      }
    );

    console.log('OpenRouter response:', JSON.stringify(completion, null, 2));

    // Check if response has the expected structure
    if (!completion || !completion.choices || !completion.choices[0] || !completion.choices[0].message) {
      console.error('Unexpected response structure:', completion);
      return NextResponse.json(
        { error: 'Unexpected response structure from OpenRouter' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: completion.choices[0].message,
    });
  } catch (error: any) {
    console.error('OpenRouter API error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      { 
        error: error.message || 'Failed to get completion',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
```

---

## Componenten Documentatie

### Chat Component

**Locatie**: `components/Chat/Chat/Chat.tsx`

**Type**: Client Component (`'use client'`)

**Verantwoordelijkheden**:
- State management voor messages en geselecteerde model
- API communicatie met `/api/chat` endpoint
- Typewriter effect implementatie
- Error handling en user feedback

**State**:
```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [selectedModel, setSelectedModel] = useState<string>('anthropic/claude-3.5-sonnet');
const [isLoading, setIsLoading] = useState(false);
const [streamingMessage, setStreamingMessage] = useState<string>('');
```

**Belangrijke Functies**:

- `sendMessage(content: string)`: Verwerkt het verzenden van een bericht
  1. Creëert user message object
  2. Voegt message toe aan state
  3. Roept API aan met alle messages (conversation history)
  4. Implementeert typewriter effect
  5. Voegt assistant response toe aan messages

- `getGreeting()`: Retourneert tijd-afhankelijke groet (Morning/Afternoon/Evening)

**Typewriter Effect Implementatie**:

```56:66:open-router-chat/components/Chat/Chat/Chat.tsx
      // Typewriter effect: add words one by one
      const fullText = data.message.content;
      const words = fullText.split(' ');
      let currentText = '';

      // Faster typewriter effect (20ms per word)
      for (let i = 0; i < words.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 20));
        currentText += (i > 0 ? ' ' : '') + words[i];
        setStreamingMessage(currentText);
      }
```

### ChatInput Component

**Locatie**: `components/Chat/ChatInput/ChatInput.tsx`

**Type**: Client Component

**Props**:
```typescript
interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}
```

**Functionaliteiten**:
- Text input met form submission
- Enter key support
- Disabled state tijdens loading
- Placeholder text voor gebruikersrichtlijnen
- Icon buttons voor toekomstige features (attachments, settings, history)

**State**:
```typescript
const [input, setInput] = useState('');
```

### Message Component

**Locatie**: `components/Chat/Message/Message.tsx`

**Type**: Server Component (geen interactiviteit nodig)

**Props**:
```typescript
{ message: Message }
```

**Functionaliteiten**:
- Rendert individuele chat messages
- Toont verschillende styling voor user vs assistant messages
- Simpele, performante rendering zonder state

### ModelSelector Component

**Locatie**: `components/ModelSelector/ModelSelector/ModelSelector.tsx`

**Type**: Client Component

**Props**:
```typescript
interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}
```

**Functionaliteiten**:
- Dropdown menu voor model selectie
- Click outside detection om dropdown te sluiten
- Visual feedback voor geselecteerd model
- Upgrade indicators voor premium modellen

**Models Array**:

```19:57:open-router-chat/components/ModelSelector/ModelSelector/ModelSelector.tsx
const models: Model[] = [
  {
    id: 'anthropic/claude-3-opus',
    name: 'Opus 4.5',
    description: 'Most capable for complex work',
    provider: 'Anthropic',
    requiresUpgrade: true,
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Sonnet 4.5',
    description: 'Smartest for everyday tasks',
    provider: 'Anthropic',
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Haiku 4.5',
    description: 'Fastest for quick answers',
    provider: 'Anthropic',
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'Most advanced OpenAI model',
    provider: 'OpenAI',
  },
  {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Fast and capable',
    provider: 'OpenAI',
  },
  {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    description: 'Latest Google model',
    provider: 'Google',
  },
];
```

---

## Design Patterns

### 1. Component Composition

De applicatie gebruikt **component composition** in plaats van inheritance:

```typescript
<Chat>
  <ModelSelector />
  <ChatInput />
  <Message />
</Chat>
```

**Voordelen**:
- Herbruikbaarheid
- Testbaarheid
- Duidelijke verantwoordelijkheden

### 2. Props Drilling

State wordt doorgegeven via props van parent naar child:

```typescript
<ChatInput onSend={sendMessage} disabled={isLoading} />
<ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
```

**Reden**: Simpele component hiërarchie maakt state management libraries overbodig.

### 3. Controlled Components

Alle inputs zijn **controlled components**:

```typescript
const [input, setInput] = useState('');
<input value={input} onChange={(e) => setInput(e.target.value)} />
```

**Voordelen**:
- Predictable state
- Eenvoudige validatie
- Consistent gedrag

### 4. Error Boundaries Pattern

Hoewel niet expliciet geïmplementeerd, volgt de applicatie het error boundary pattern door:
- Try-catch blocks in async functies
- Error messages in UI
- Graceful degradation

### 5. Separation of Concerns

Duidelijke scheiding tussen:
- **UI Components**: Rendering en user interaction
- **API Routes**: Server-side logic en external API calls
- **Lib Utilities**: Herbruikbare functies
- **Types**: Type definitions

### 6. CSS Modules Pattern

Elk component heeft zijn eigen CSS Module:

```typescript
import styles from './Component.module.css';
<div className={styles.container} />
```

**Voordelen**:
- Scoped styling (geen CSS conflicts)
- Type safety met TypeScript
- Tree-shaking van ongebruikte styles

---

## Data Flow

### Message Flow Diagram

```
User Input
    │
    ▼
ChatInput Component
    │ (onSend callback)
    ▼
Chat Component (sendMessage)
    │
    ├─► Create User Message Object
    │
    ├─► Add to Messages State
    │
    ├─► POST /api/chat
    │       │
    │       ├─► Request Body: { messages, model }
    │       │
    │       ▼
    │   API Route Handler
    │       │
    │       ├─► Validate Request
    │       │
    │       ├─► Call OpenRouter SDK
    │       │
    │       ├─► Validate Response
    │       │
    │       └─► Return { message }
    │
    ├─► Receive Response
    │
    ├─► Typewriter Effect Loop
    │       │
    │       └─► Update streamingMessage State
    │
    └─► Add Assistant Message to State
```

### State Updates Flow

1. **User types message** → `ChatInput` updates local `input` state
2. **User submits** → `ChatInput` calls `onSend(input)`
3. **Chat receives** → Creates `userMessage`, updates `messages` state
4. **API call** → Sets `isLoading` to `true`
5. **Response received** → Typewriter effect updates `streamingMessage`
6. **Effect complete** → Adds final message, clears `streamingMessage`, sets `isLoading` to `false`

### Model Selection Flow

1. **User clicks ModelSelector** → Opens dropdown
2. **User selects model** → Calls `onModelChange(modelId)`
3. **Chat receives** → Updates `selectedModel` state
4. **Next message** → Uses new `selectedModel` in API call

---

## Type Definitions

### Message Interface

```typescript
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}
```

**Gebruik**: Representeert individuele chat messages in de UI.

### ChatModel Interface

```typescript
export interface ChatModel {
  id: string;
  name: string;
  provider: string;
}
```

**Gebruik**: Type definitie voor model metadata (momenteel niet gebruikt, maar beschikbaar voor uitbreiding).

### ChatMessage Interface (lib/openrouter.ts)

```typescript
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
```

**Gebruik**: Vereenvoudigde message format voor OpenRouter API calls.

### ChatCompletionOptions Interface

```typescript
export interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
}
```

**Gebruik**: Type definitie voor OpenRouter API request options.

---

## Configuratie

### Environment Variables

#### Vereist

**`OPENROUTER_API_KEY`**
- **Beschrijving**: Je OpenRouter API key
- **Locatie**: Server-side alleen (niet exposed aan client)
- **Voorbeeld**: `sk-or-v1-...`
- **Hoe te verkrijgen**: [OpenRouter Dashboard](https://openrouter.ai/)

#### Optioneel

**`NEXT_PUBLIC_SITE_URL`**
- **Beschrijving**: Je site URL voor OpenRouter headers
- **Gebruik**: Wordt gebruikt in `HTTP-Referer` header
- **Voorbeeld**: `http://localhost:3000` of `https://yourdomain.com`

**`NEXT_PUBLIC_SITE_NAME`**
- **Beschrijving**: Je site naam voor OpenRouter headers
- **Gebruik**: Wordt gebruikt in `X-Title` header
- **Voorbeeld**: `My Chat App`
- **Default**: `Chat App`

### TypeScript Configuratie

**`tsconfig.json`** bevat:
- Strict mode enabled
- Path aliases (`@/*` → `./*`)
- Next.js plugin voor optimale integratie
- ES2017 target voor moderne JavaScript features

### Next.js Configuratie

**`next.config.ts`** is momenteel minimaal, maar kan uitgebreid worden met:
- Image optimization
- Environment variable validatie
- Custom headers
- Redirects/rewrites

### OpenRouter SDK Configuratie

```3:5:open-router-chat/lib/openrouter.ts
export const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});
```

De SDK wordt geïnitialiseerd met de API key uit environment variables.

**Headers Helper**:

```8:13:open-router-chat/lib/openrouter.ts
export function getOpenRouterHeaders() {
  return {
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || '',
    'X-Title': process.env.NEXT_PUBLIC_SITE_NAME || 'Chat App',
  };
}
```

Deze headers helpen OpenRouter om gebruik te tracken en analytics te verzamelen.

---

## Voorbeelden

### Voorbeeld 1: Nieuw Model Toevoegen

Om een nieuw model toe te voegen aan de selector:

**Stap 1**: Bewerk `components/ModelSelector/ModelSelector/ModelSelector.tsx`

```typescript
const models: Model[] = [
  // ... bestaande modellen
  {
    id: 'meta/llama-3-70b-instruct',
    name: 'Llama 3 70B',
    description: 'Open source model by Meta',
    provider: 'Meta',
  },
];
```

**Stap 2**: Het model is nu beschikbaar in de dropdown!

### Voorbeeld 2: Custom Styling

Om de chat styling aan te passen:

**Stap 1**: Bewerk `components/Chat/Chat/Chat.module.css`

```css
.chatContainer {
  /* Je custom styles */
  max-width: 1200px;
  margin: 0 auto;
}
```

**Stap 2**: CSS Modules zorgen automatisch voor scoped styling.

### Voorbeeld 3: Typewriter Effect Aanpassen

Om de snelheid van het typewriter effect te wijzigen:

**Bewerk** `components/Chat/Chat/Chat.tsx`:

```typescript
// Langzamer effect (50ms per woord)
for (let i = 0; i < words.length; i++) {
  await new Promise((resolve) => setTimeout(resolve, 50));
  // ...
}

// Sneller effect (10ms per woord)
for (let i = 0; i < words.length; i++) {
  await new Promise((resolve) => setTimeout(resolve, 10));
  // ...
}
```

### Voorbeeld 4: Error Handling Uitbreiden

Om meer gedetailleerde error messages te tonen:

**Bewerk** `components/Chat/Chat/Chat.tsx`:

```typescript
catch (error: any) {
  console.error('Error sending message:', error);
  
  // Extract error details
  const errorMessage = error.message || 'Unknown error';
  const errorCode = error.code || 'UNKNOWN';
  
  const errorMessageObj: Message = {
    id: Date.now().toString(),
    role: 'assistant',
    content: `Error [${errorCode}]: ${errorMessage}`,
    timestamp: new Date(),
  };
  
  setMessages((prev) => [...prev, errorMessageObj]);
}
```

### Voorbeeld 5: Conversation History Limiteren

Om de conversation history te beperken (voor kostenbesparing):

**Bewerk** `components/Chat/Chat/Chat.tsx`:

```typescript
const sendMessage = async (content: string) => {
  // ... user message creation ...
  
  // Limit to last 10 messages
  const recentMessages = messages.slice(-10);
  
  const response = await fetch('/api/chat', {
    // ...
    body: JSON.stringify({
      messages: [...recentMessages, userMessage].map(({ role, content }) => ({
        role,
        content,
      })),
      model: selectedModel,
    }),
  });
  
  // ...
};
```

---

## Troubleshooting

### Probleem: API Key Errors

**Symptomen**:
- Error: "OpenRouter API key is not configured"
- 500 status code in API response

**Oplossingen**:

1. **Controleer `.env.local` bestand**:
   ```bash
   # Zorg dat het bestand bestaat in de root directory
   OPENROUTER_API_KEY=sk-or-v1-your-key-here
   ```

2. **Herstart development server**:
   ```bash
   # Stop de server (Ctrl+C) en start opnieuw
   npm run dev
   ```

3. **Controleer environment variable naam**:
   - Moet exact zijn: `OPENROUTER_API_KEY` (geen typos)

4. **Voor productie**:
   - Zorg dat environment variables zijn ingesteld in je hosting platform
   - Vercel: Settings → Environment Variables
   - Andere platforms: Check hun documentatie

### Probleem: Model Niet Beschikbaar

**Symptomen**:
- Error: "Model not found" of "Invalid model"
- Model verschijnt niet in dropdown

**Oplossingen**:

1. **Controleer model ID**:
   - Model IDs moeten exact overeenkomen met OpenRouter format
   - Format: `provider/model-name`
   - Voorbeeld: `anthropic/claude-3.5-sonnet`

2. **Controleer OpenRouter account**:
   - Sommige modellen vereisen credits
   - Sommige modellen zijn alleen beschikbaar voor bepaalde accounts

3. **Test model ID**:
   ```bash
   # Test via OpenRouter API direct
   curl https://openrouter.ai/api/v1/chat/completions \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model": "anthropic/claude-3.5-sonnet", "messages": [{"role": "user", "content": "test"}]}'
   ```

### Probleem: Typewriter Effect Werkt Niet

**Symptomen**:
- Berichten verschijnen direct zonder animatie
- `streamingMessage` wordt niet getoond

**Oplossingen**:

1. **Controleer browser console**:
   - Zoek naar JavaScript errors
   - Controleer of `setStreamingMessage` wordt aangeroepen

2. **Controleer response structuur**:
   - API moet `{ message: { content: "..." } }` retourneren
   - Check server logs voor response format

3. **Test typewriter effect**:
   ```typescript
   // Voeg console.log toe voor debugging
   console.log('Full text:', fullText);
   console.log('Words:', words);
   ```

### Probleem: Messages Verdwijnen na Refresh

**Symptomen**:
- Chat history is leeg na page refresh
- Messages worden niet opgeslagen

**Oorzaak**: 
- Dit is verwacht gedrag - messages zijn alleen in memory state

**Oplossingen**:

1. **Voeg localStorage toe**:
   ```typescript
   // In Chat.tsx
   useEffect(() => {
     const saved = localStorage.getItem('chatMessages');
     if (saved) {
       setMessages(JSON.parse(saved));
     }
   }, []);
   
   useEffect(() => {
     localStorage.setItem('chatMessages', JSON.stringify(messages));
   }, [messages]);
   ```

2. **Voeg database integratie toe**:
   - Gebruik een database (PostgreSQL, MongoDB, etc.)
   - Sla messages op per gebruiker/sessie

### Probleem: Build Errors

**Symptomen**:
- `npm run build` faalt
- TypeScript errors tijdens build

**Oplossingen**:

1. **Clear build cache**:
   ```bash
   rm -rf .next
   npm run build
   ```

2. **Reinstall dependencies**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

3. **Check TypeScript errors**:
   ```bash
   npx tsc --noEmit
   ```

4. **Check ESLint errors**:
   ```bash
   npm run lint
   ```

### Probleem: CORS Errors

**Symptomen**:
- "CORS policy" errors in browser console
- API calls falen vanuit browser

**Oplossingen**:

1. **Dit zou niet moeten voorkomen**:
   - API routes draaien op dezelfde origin
   - Next.js handelt CORS automatisch af

2. **Als het toch voorkomt**:
   - Check of je de juiste URL gebruikt (`/api/chat` niet `http://localhost:3000/api/chat`)
   - Check Next.js configuratie voor custom headers

### Probleem: Styling Issues

**Symptomen**:
- CSS wordt niet toegepast
- Styles conflicteren met elkaar

**Oplossingen**:

1. **Controleer CSS Module imports**:
   ```typescript
   // Correct
   import styles from './Component.module.css';
   
   // Incorrect
   import './Component.css';
   ```

2. **Controleer className syntax**:
   ```typescript
   // Correct
   <div className={styles.container} />
   
   // Incorrect
   <div className="container" />
   ```

3. **Check voor CSS conflicts**:
   - CSS Modules zouden automatisch scoped moeten zijn
   - Als er conflicten zijn, check globale CSS in `globals.css`

---

## Uitbreidingsmogelijkheden

### 1. Message Persistence

**Implementatie**: Voeg database integratie toe om messages op te slaan.

**Stappen**:
- Kies database (PostgreSQL, MongoDB, SQLite)
- Maak database schema voor messages
- Voeg API routes toe voor CRUD operaties
- Update Chat component om messages te laden

**Voorbeeld Tech Stack**:
- Prisma + PostgreSQL
- MongoDB + Mongoose
- Supabase (PostgreSQL met real-time)

### 2. User Authentication

**Implementatie**: Voeg user accounts toe.

**Stappen**:
- Implementeer NextAuth.js of Auth0
- Voeg login/signup pagina's toe
- Koppel messages aan gebruikers
- Voeg user profile pagina toe

### 3. Streaming Responses

**Implementatie**: Gebruik Server-Sent Events (SSE) voor real-time streaming.

**Stappen**:
- Update API route om `stream: true` te gebruiken
- Implementeer SSE endpoint
- Update Chat component om stream te verwerken
- Verwijder typewriter effect (niet meer nodig)

### 4. Message History/Search

**Implementatie**: Voeg zoekfunctionaliteit toe.

**Stappen**:
- Implementeer search API endpoint
- Voeg search UI component toe
- Index messages in database
- Voeg filters toe (datum, model, etc.)

### 5. File Attachments

**Implementatie**: Voeg ondersteuning toe voor file uploads.

**Stappen**:
- Implementeer file upload API
- Update ChatInput component
- Voeg file preview toe aan Message component
- Verwerk files in OpenRouter API calls

### 6. Multiple Conversations

**Implementatie**: Voeg conversation management toe.

**Stappen**:
- Maak Conversation model in database
- Voeg conversation list sidebar toe
- Update Chat component om conversation context te gebruiken
- Voeg "New Conversation" functionaliteit toe

### 7. Model Settings/Customization

**Implementatie**: Voeg model parameters toe (temperature, max_tokens, etc.).

**Stappen**:
- Voeg settings UI toe
- Update API route om parameters door te geven
- Sla user preferences op
- Voeg presets toe (Creative, Balanced, Precise)

### 8. Export Conversations

**Implementatie**: Voeg export functionaliteit toe.

**Stappen**:
- Implementeer export API endpoint
- Voeg export button toe aan UI
- Ondersteun formats: JSON, Markdown, PDF
- Voeg email export optie toe

### 9. Dark Mode

**Implementatie**: Voeg dark mode toggle toe.

**Stappen**:
- Voeg theme context toe
- Update CSS variabelen voor dark mode
- Voeg toggle button toe aan UI
- Sla preference op in localStorage

### 10. Rate Limiting

**Implementatie**: Voeg rate limiting toe om API kosten te beheersen.

**Stappen**:
- Implementeer rate limiting middleware
- Voeg user limits toe (messages per dag/uur)
- Toon usage statistics in UI
- Voeg upgrade prompts toe

---

## Conclusie

Deze documentatie biedt een compleet overzicht van de OpenRouter Chat Application. Voor vragen of suggesties, raadpleeg de code of maak een issue aan in de repository.

**Belangrijke Links**:
- [Next.js Documentatie](https://nextjs.org/docs)
- [OpenRouter API Documentatie](https://openrouter.ai/docs)
- [React Documentatie](https://react.dev)
- [TypeScript Documentatie](https://www.typescriptlang.org/docs)

---

*Laatste update: 2024*

