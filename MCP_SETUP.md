# MCP (Model Context Protocol) Setup Guide

Deze gids legt uit hoe je MCP servers kunt configureren en gebruiken in het LLM Dashboard.

## Wat is MCP?

Model Context Protocol (MCP) is een open protocol dat AI-modellen in staat stelt om externe tools en gegevensbronnen te benaderen via een gestandaardiseerde interface. Dit maakt het mogelijk om de functionaliteit van je LLM dashboard uit te breiden met tools zoals browser automatisering, database queries, file system access, en meer.

## Configuratie

MCP servers worden geconfigureerd via environment variables in je `.env` bestand.

### Basis Configuratie

Voor elke MCP server die je wilt gebruiken, voeg je de volgende environment variables toe:

```env
# Server naam (gebruik hoofdletters en underscores)
MCP_SERVER_<SERVER_NAME>_COMMAND=<command>
MCP_SERVER_<SERVER_NAME>_ARGS=["arg1", "arg2"]  # Optioneel, JSON array
```

### Voorbeeld: Playwright MCP Server

Als je de Playwright MCP server wilt gebruiken (de server staat in `open-router-chat/playwright`):

**Stap 1**: Bouw de Playwright MCP server eerst:
```bash
cd open-router-chat/playwright
npm install
npm run build
```

**Stap 2**: Voeg de configuratie toe aan je `.env`:
```env
# Playwright MCP Server
MCP_SERVER_PLAYWRIGHT_COMMAND=node
MCP_SERVER_PLAYWRIGHT_ARGS=["C:\\Users\\johnv\\Dropbox\\Own Projects\\code\\open-router-chat\\playwright\\build\\index.js"]
```

Of gebruik een relatief pad (vanuit `open-router-chat/open-router-chat`):
```env
# Playwright MCP Server (relatief pad)
MCP_SERVER_PLAYWRIGHT_COMMAND=node
MCP_SERVER_PLAYWRIGHT_ARGS=["..\\playwright\\build\\index.js"]
```

**Let op**: 
- Gebruik absolute paden voor bestanden
- Op Windows, gebruik dubbele backslashes (`\\`) of forward slashes (`/`)
- Zorg ervoor dat de MCP server eerst gebouwd is (`npm run build` in de playwright directory)
- Je kunt ook relatieve paden gebruiken vanaf de workspace root, maar absolute paden zijn betrouwbaarder

### Optionele Environment Variables voor de Server

Als de MCP server specifieke environment variables nodig heeft, kun je die toevoegen:

```env
MCP_SERVER_<SERVER_NAME>_ENV_<KEY>=<value>
```

Bijvoorbeeld:
```env
MCP_SERVER_PLAYWRIGHT_ENV_DEBUG=true
MCP_SERVER_PLAYWRIGHT_ENV_TIMEOUT=30000
```

## Beschikbare MCP Servers

### Playwright MCP Server

De Playwright MCP server biedt browser automatisering tools:

**Tools:**
- `navigate_to_url` - Navigeer naar een URL
- `take_screenshot` - Maak een screenshot van de huidige pagina
- `get_page_content` - Haal tekst content van de pagina op
- `click_element` - Klik op een element met CSS selector
- `fill_input` - Vul een input veld in
- `wait_for_element` - Wacht tot een element verschijnt
- `close_browser` - Sluit de browser

**Configuratie voorbeeld:**
```env
MCP_SERVER_PLAYWRIGHT_COMMAND=node
MCP_SERVER_PLAYWRIGHT_ARGS=["C:\\path\\to\\playwright\\build\\index.js"]
```

## API Endpoints

### GET /api/mcp/servers

Haalt een lijst op van alle geconfigureerde MCP servers en hun beschikbare tools.

**Response:**
```json
{
  "servers": [
    {
      "name": "playwright",
      "tools": [
        {
          "name": "navigate_to_url",
          "description": "Navigate to a URL in the browser",
          "inputSchema": {
            "type": "object",
            "properties": {
              "url": {
                "type": "string",
                "description": "The URL to navigate to"
              }
            },
            "required": ["url"]
          }
        }
      ]
    }
  ]
}
```

### POST /api/mcp/tools/call

Roept een MCP tool aan.

**Request:**
```json
{
  "serverName": "playwright",
  "toolName": "navigate_to_url",
  "arguments": {
    "url": "https://example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "content": [
    {
      "type": "text",
      "text": "Successfully navigated to https://example.com\nPage title: Example Domain"
    }
  ]
}
```

## Gebruik in de Chat

Je kunt MCP tools gebruiken door ze aan te roepen via de API. In de toekomst kan dit geïntegreerd worden in de chat interface zodat de LLM automatisch tools kan aanroepen wanneer nodig.

### Voorbeeld: Browser Automatisering

```typescript
// Navigeer naar een website
const response = await fetch('/api/mcp/tools/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    serverName: 'playwright',
    toolName: 'navigate_to_url',
    arguments: { url: 'https://google.com' }
  })
});

// Maak een screenshot
const screenshot = await fetch('/api/mcp/tools/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    serverName: 'playwright',
    toolName: 'take_screenshot',
    arguments: { path: 'google.png', fullPage: true }
  })
});
```

## Troubleshooting

### Server niet gevonden

**Probleem**: `MCP server "playwright" not found`

**Oplossing**:
1. Controleer of de environment variables correct zijn ingesteld
2. Zorg dat de server naam overeenkomt (case-insensitive)
3. Herstart de Next.js development server na het toevoegen van environment variables

### Connection Error

**Probleem**: `Failed to connect to MCP server`

**Oplossing**:
1. Controleer of het command pad correct is
2. Zorg dat de MCP server gebouwd is (als nodig)
3. Test het command handmatig in de terminal
4. Controleer of alle dependencies geïnstalleerd zijn

### Tool Call Fails

**Probleem**: Tool call retourneert een error

**Oplossing**:
1. Controleer de tool arguments - ze moeten overeenkomen met het inputSchema
2. Bekijk de server logs voor meer details
3. Test de tool handmatig via de MCP server

## Toekomstige Uitbreidingen

Mogelijke toekomstige features:
- UI component om beschikbare MCP tools te tonen
- Automatische tool calling door de LLM wanneer relevant
- Tool call history en logging
- MCP server management interface
- Support voor meerdere MCP server types

## Referenties

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [MCP SDK](https://github.com/modelcontextprotocol/sdk)
- [Playwright MCP Server Example](../playwright)

