# MCP Integratie Samenvatting

## Wat is geïmplementeerd?

Het LLM Dashboard is nu uitgerust met MCP (Model Context Protocol) client functionaliteit. Dit maakt het mogelijk om externe tools en services te gebruiken via gestandaardiseerde MCP servers.

## Implementatie Overzicht

### 1. Dependencies
- ✅ `@modelcontextprotocol/sdk` toegevoegd aan `package.json`

### 2. Core Library (`lib/mcp.ts`)
- ✅ MCP client connection management
- ✅ Server configuratie via environment variables
- ✅ Tool listing functionaliteit
- ✅ Tool calling functionaliteit
- ✅ Connection pooling en hergebruik

### 3. API Routes
- ✅ `GET /api/mcp/servers` - Lijst van geconfigureerde servers en hun tools
- ✅ `POST /api/mcp/tools/call` - Roep een MCP tool aan

### 4. Types (`types/api.ts`)
- ✅ TypeScript types voor MCP API requests/responses
- ✅ Type safety voor alle MCP gerelateerde data

### 5. Documentatie
- ✅ `MCP_SETUP.md` - Complete setup guide
- ✅ Configuratie voorbeelden
- ✅ Troubleshooting guide

## Architectuur

```
┌─────────────────┐
│  Frontend (UI)  │
└────────┬────────┘
         │ HTTP API
         ▼
┌─────────────────┐
│  Next.js API    │
│  Routes         │
│  /api/mcp/*     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MCP Client     │
│  (lib/mcp.ts)   │
└────────┬────────┘
         │ Stdio Transport
         ▼
┌─────────────────┐
│  MCP Servers    │
│  (Playwright,   │
│   etc.)         │
└─────────────────┘
```

## Gebruik

### 1. Configureer een MCP Server

Voeg environment variables toe aan `.env`:

```env
MCP_SERVER_PLAYWRIGHT_COMMAND=node
MCP_SERVER_PLAYWRIGHT_ARGS=["C:\\Users\\johnv\\Dropbox\\Own Projects\\code\\open-router-chat\\playwright\\build\\index.js"]
```

Of gebruik een relatief pad:
```env
MCP_SERVER_PLAYWRIGHT_COMMAND=node
MCP_SERVER_PLAYWRIGHT_ARGS=["..\\playwright\\build\\index.js"]
```

### 2. Haal beschikbare servers op

```typescript
const response = await fetch('/api/mcp/servers');
const { servers } = await response.json();
```

### 3. Roep een tool aan

```typescript
const response = await fetch('/api/mcp/tools/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    serverName: 'playwright',
    toolName: 'navigate_to_url',
    arguments: { url: 'https://example.com' }
  })
});
```

## Mogelijkheden

### Huidige Functionaliteit
- ✅ Connectie met MCP servers via stdio transport
- ✅ Dynamische server detectie via environment variables
- ✅ Tool discovery en listing
- ✅ Tool execution met argument validatie
- ✅ Connection management en pooling

### Toekomstige Uitbreidingen

1. **UI Integratie**
   - Component om beschikbare tools te tonen
   - Tool selector in chat interface
   - Visual feedback voor tool calls

2. **Automatische Tool Calling**
   - LLM kan automatisch tools aanroepen wanneer relevant
   - Tool descriptions worden toegevoegd aan system prompt
   - Function calling support in completions API

3. **Advanced Features**
   - Tool call history en logging
   - Server management interface
   - Health checks en monitoring
   - Support voor meerdere transport types (SSE, WebSocket)

4. **Integratie met Chat**
   - Tools beschikbaar maken aan LLM via system messages
   - Automatische tool selection op basis van user query
   - Tool results integreren in chat responses

## Beste Aanpak voor Verdere Integratie

### Optie 1: Direct Tool Calling (Huidige Implementatie)
**Voordelen:**
- Volledige controle over wanneer tools worden aangeroepen
- Expliciete tool calls vanuit de frontend
- Eenvoudig te debuggen

**Gebruik wanneer:**
- Je specifieke tools wilt aanroepen op basis van user input
- Je tool calls wilt loggen en monitoren
- Je een UI wilt voor tool selection

### Optie 2: LLM-Assisted Tool Calling
**Voordelen:**
- LLM kan automatisch tools selecteren wanneer nodig
- Meer natuurlijke interactie
- Minder expliciete tool calls nodig

**Implementatie:**
1. Voeg tool descriptions toe aan system prompt
2. Parse LLM responses voor tool call requests
3. Execute tools en voeg results toe aan conversation
4. Stuur updated conversation terug naar LLM

**Voorbeeld flow:**
```
User: "Maak een screenshot van google.com"
  ↓
LLM: [tool_call: navigate_to_url, tool_call: take_screenshot]
  ↓
Execute tools
  ↓
LLM: "Ik heb een screenshot gemaakt en opgeslagen als screenshot.png"
```

### Optie 3: Hybrid Approach (Aanbevolen)
Combineer beide benaderingen:
- Expliciete tool calls voor user-initiated actions
- LLM-assisted calls voor context-aware tool usage
- UI component voor tool discovery en manual calls

## Configuratie Voorbeelden

### Playwright MCP Server

```env
MCP_SERVER_PLAYWRIGHT_COMMAND=node
MCP_SERVER_PLAYWRIGHT_ARGS=["C:\\Users\\johnv\\Dropbox\\Own Projects\\code\\open-router-chat\\playwright\\build\\index.js"]
```

Of relatief pad:
```env
MCP_SERVER_PLAYWRIGHT_COMMAND=node
MCP_SERVER_PLAYWRIGHT_ARGS=["..\\playwright\\build\\index.js"]
```

### Meerdere Servers

```env
# Playwright
MCP_SERVER_PLAYWRIGHT_COMMAND=node
MCP_SERVER_PLAYWRIGHT_ARGS=["C:\\path\\to\\playwright\\build\\index.js"]

# Database Server (voorbeeld)
MCP_SERVER_DATABASE_COMMAND=node
MCP_SERVER_DATABASE_ARGS=["C:\\path\\to\\database\\server.js"]
MCP_SERVER_DATABASE_ENV_DB_URL=postgresql://localhost:5432/mydb
```

## Troubleshooting

Zie `MCP_SETUP.md` voor gedetailleerde troubleshooting informatie.

## Volgende Stappen

1. **Test de integratie:**
   ```bash
   # Installeer dependencies
   npm install
   
   # Configureer .env met MCP server
   # Start development server
   npm run dev
   
   # Test API endpoints
   curl http://localhost:3000/api/mcp/servers
   ```

2. **Bouw UI componenten** (optioneel):
   - Tool selector component
   - Tool call history
   - Server status indicators

3. **Integreer met chat** (optioneel):
   - Voeg tool descriptions toe aan system prompt
   - Implementeer automatic tool calling
   - Parse en execute tool calls uit LLM responses

## Referenties

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [MCP Setup Guide](./MCP_SETUP.md)

