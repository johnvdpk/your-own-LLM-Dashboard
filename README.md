# Your Own LLM Dashboard

A modern, customizable chat interface built with Next.js and TypeScript that connects to multiple Large Language Models (LLMs) via OpenRouter. Chat with various AI models including Claude, GPT-4, and Gemini through a single, elegant interface.

## Features

- 🤖 **Multiple AI Models**: Switch between different LLM providers (Anthropic Claude, OpenAI GPT-4, Google Gemini)
- 💬 **Real-time Chat**: Interactive chat interface with typewriter effect for responses
- 🎨 **Modern UI**: Clean, responsive design using CSS Modules
- 🔄 **Model Selection**: Easy dropdown to switch between available models
- ⚡ **Fast & Efficient**: Built with Next.js 15 and React 19
- 🔒 **Secure**: API keys stored server-side, never exposed to the client

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: React 19
- **Styling**: CSS Modules
- **API Integration**: OpenRouter SDK
- **Package Manager**: npm

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- An OpenRouter API key ([Get one here](https://openrouter.ai/))

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/johnvdpk/your-own-LLM-Dashboard.git
   cd your-own-LLM-Dashboard/open-router-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_SITE_NAME=Your Chat App
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
open-router-chat/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # API route for chat requests
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/
│   ├── Chat/
│   │   ├── Chat/
│   │   │   ├── Chat.tsx         # Main chat component
│   │   │   └── Chat.module.css
│   │   ├── ChatInput/
│   │   │   ├── ChatInput.tsx    # Message input component
│   │   │   └── ChatInput.module.css
│   │   └── Message/
│   │       ├── Message.tsx      # Individual message component
│   │       └── Message.module.css
│   └── ModelSelector/
│       └── ModelSelector/
│           ├── ModelSelector.tsx # Model selection dropdown
│           └── ModelSelector.module.css
├── lib/
│   └── openrouter.ts            # OpenRouter SDK configuration
├── types/
│   └── chat.ts                  # TypeScript type definitions
└── public/                      # Static assets
```

## Available Scripts

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key | Yes |
| `NEXT_PUBLIC_SITE_URL` | Your site URL (for OpenRouter headers) | No |
| `NEXT_PUBLIC_SITE_NAME` | Your site name (for OpenRouter headers) | No |

### Supported Models

The application comes pre-configured with the following models:

- **Anthropic Claude 3.5 Sonnet** (default)
- **Anthropic Claude 3 Opus**
- **Anthropic Claude 3 Haiku**
- **OpenAI GPT-4o**
- **OpenAI GPT-4 Turbo**
- **Google Gemini 3 Pro**

You can add more models by editing the `models` array in `components/ModelSelector/ModelSelector/ModelSelector.tsx`.

## How It Works

1. User types a message in the chat input
2. Message is sent to `/api/chat` endpoint
3. API route forwards the request to OpenRouter with the selected model
4. OpenRouter processes the request and returns a response
5. Response is displayed in the chat with a typewriter effect

## Customization

### Changing the Default Model

Edit `components/Chat/Chat/Chat.tsx` and modify the initial state:

```typescript
const [selectedModel, setSelectedModel] = useState<string>('your-model-id-here');
```

### Adding More Models

Edit `components/ModelSelector/ModelSelector/ModelSelector.tsx` and add to the `models` array:

```typescript
{
  id: 'provider/model-id',
  name: 'Display Name',
  description: 'Model description',
  provider: 'Provider Name',
}
```

### Styling

All styles are in CSS Modules. Each component has its own `.module.css` file. Modify these files to customize the appearance.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add your environment variables in Vercel's dashboard
4. Deploy!

### Other Platforms

This is a standard Next.js application and can be deployed to any platform that supports Next.js:
- Vercel (recommended)
- Netlify
- AWS Amplify
- Railway
- Your own server with Node.js

## Troubleshooting

### API Key Issues

- Ensure `OPENROUTER_API_KEY` is set in your `.env.local` file
- Check that your API key is valid and has credits
- Verify the key is not exposed in client-side code

### Build Errors

- Clear `.next` folder and `node_modules`, then reinstall:
  ```bash
  rm -rf .next node_modules
  npm install
  ```

### Model Not Responding

- Check if the model ID is correct
- Verify your OpenRouter account has access to the selected model
- Check browser console and server logs for error messages

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [OpenRouter](https://openrouter.ai/)
- Uses [OpenRouter SDK](https://github.com/OpenRouterTeam/openrouter-sdk)
