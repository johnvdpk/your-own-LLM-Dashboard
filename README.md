# Your Own LLM Dashboard

A modern, customizable chat interface built with Next.js and TypeScript that connects to multiple Large Language Models (LLMs) via OpenRouter. Chat with various AI models including Claude, GPT-4, and Gemini through a single, elegant interface. Includes user authentication, database persistence, and password reset functionality.

## Features

- 🤖 **Multiple AI Models**: Switch between different LLM providers (Anthropic Claude, OpenAI GPT-4, Google Gemini)
- 💬 **Real-time Chat**: Interactive chat interface with typewriter effect for responses
- 🎨 **Modern UI**: Clean, responsive design using CSS Modules
- 🔄 **Model Selection**: Easy dropdown to switch between available models
- ⚡ **Fast & Efficient**: Built with Next.js 15 and React 19
- 🔒 **Secure**: API keys stored server-side, never exposed to the client
- 👤 **User Authentication**: Complete authentication system with NextAuth.js
- 📝 **User Registration**: Sign up with email and password
- 🔑 **Password Reset**: Secure password reset via email
- 💾 **Database Persistence**: PostgreSQL database with Prisma ORM
- 💬 **Chat History**: Save and retrieve chat conversations

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: React 19
- **Styling**: CSS Modules
- **API Integration**: OpenRouter SDK
- **Authentication**: NextAuth.js v5
- **Database**: PostgreSQL with Prisma ORM
- **Email Service**: Resend
- **Password Hashing**: bcryptjs
- **Package Manager**: npm

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- PostgreSQL installed and running
- An OpenRouter API key ([Get one here](https://openrouter.ai/))
- A Resend account for email functionality ([Get one here](https://resend.com))

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/johnvdpk/your-own-LLM-Dashboard.git
cd your-own-LLM-Dashboard/open-router-chat
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up PostgreSQL Database

1. **Create a PostgreSQL database** (using pgAdmin or command line):
   ```sql
   CREATE DATABASE llm_dashboard_db;
   ```

2. **Configure database connection** in `.env.local`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/llm_dashboard_db?schema=public"
   ```
   Replace `username` and `password` with your PostgreSQL credentials.

3. **Run Prisma migrations** to create database tables:
   ```bash
   npx prisma db push
   ```

4. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

5. **Set up database triggers** (optional, for auto-updating `updated_at` fields):
   - Open pgAdmin and connect to your database
   - Run the SQL script from `database/README.md` to create triggers

For detailed database setup instructions, see [database/README.md](../database/README.md).

### 4. Set up Resend for Email (Password Reset)

1. **Create a Resend account** at [resend.com](https://resend.com)
2. **Get your API key** from the Resend dashboard
3. **For development**: You can use the test email `onboarding@resend.dev`
4. **For production**: Verify your domain in Resend

For detailed email setup instructions, see [PASSWORD_RESET_SETUP.md](./PASSWORD_RESET_SETUP.md).

### 5. Set up environment variables

Create a `.env.local` file in the `open-router-chat` directory:

```env
# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Your Chat App

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/llm_dashboard_db?schema=public"

# NextAuth Configuration
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3000

# Email Configuration (Resend)
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Generate NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

### 6. Run the development server

```bash
npm run dev
```

### 7. Open your browser

Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
open-router-chat/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/
│   │   │   │   └── route.ts          # NextAuth.js authentication routes
│   │   │   ├── forgot-password/
│   │   │   │   └── route.ts          # Password reset request endpoint
│   │   │   └── reset-password/
│   │   │       └── route.ts           # Password reset endpoint
│   │   ├── chat/
│   │   │   └── route.ts              # API route for chat requests
│   │   ├── register/
│   │   │   └── route.ts              # User registration endpoint
│   │   └── test-db/
│   │       └── route.ts              # Database connection test
│   ├── login/
│   │   ├── page.tsx                  # Login page
│   │   └── page.module.css
│   ├── reset-password/
│   │   ├── page.tsx                  # Password reset page
│   │   └── page.module.css
│   ├── globals.css                   # Global styles
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Home page
├── components/
│   ├── Auth/
│   │   ├── LoginForm/
│   │   │   ├── LoginForm.tsx         # Login form component
│   │   │   └── LoginForm.module.css
│   │   ├── RegisterForm/
│   │   │   ├── RegisterForm.tsx      # Registration form component
│   │   │   └── RegisterForm.module.css
│   │   ├── ForgotPasswordForm/
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   └── ForgotPasswordForm.module.css
│   │   └── ResetPasswordForm/
│   │       ├── ResetPasswordForm.tsx
│   │       └── ResetPasswordForm.module.css
│   ├── Chat/
│   │   ├── Chat/
│   │   │   ├── Chat.tsx              # Main chat component
│   │   │   └── Chat.module.css
│   │   ├── ChatInput/
│   │   │   ├── ChatInput.tsx         # Message input component
│   │   │   └── ChatInput.module.css
│   │   └── Message/
│   │       ├── Message.tsx           # Individual message component
│   │       └── Message.module.css
│   ├── ModelSelector/
│   │   └── ModelSelector/
│   │       ├── ModelSelector.tsx     # Model selection dropdown
│   │       └── ModelSelector.module.css
│   └── Providers/
│       └── Providers.tsx             # NextAuth provider wrapper
├── lib/
│   ├── auth.ts                       # NextAuth configuration
│   ├── email.ts                      # Email service (Resend)
│   ├── openrouter.ts                 # OpenRouter SDK configuration
│   └── prisma.ts                     # Prisma Client instance
├── prisma/
│   └── schema.prisma                 # Prisma database schema
├── types/
│   └── chat.ts                       # TypeScript type definitions
└── public/                           # Static assets
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
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js session encryption | Yes |
| `NEXTAUTH_URL` | Base URL of your application | Yes |
| `RESEND_API_KEY` | Resend API key for email functionality | Yes (for password reset) |
| `RESEND_FROM_EMAIL` | Email address to send from | Yes (for password reset) |
| `NEXT_PUBLIC_APP_URL` | Public URL for password reset links | Yes (for password reset) |
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

### Authentication Flow

1. User registers with email and password
2. Password is hashed with bcrypt and stored in database
3. User logs in with credentials
4. NextAuth.js creates a JWT session
5. Protected routes check for valid session

### Chat Flow

1. User types a message in the chat input
2. Message is sent to `/api/chat` endpoint
3. API route forwards the request to OpenRouter with the selected model
4. OpenRouter processes the request and returns a response
5. Response is displayed in the chat with a typewriter effect

### Password Reset Flow

1. User clicks "Forgot password?" on login page
2. Enters email address
3. System generates secure token and stores it in database
4. Email is sent via Resend with reset link
5. User clicks link and sets new password
6. Token is validated and marked as used

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

## Database Schema

The application uses PostgreSQL with the following main tables:

- **users**: User accounts with email and hashed passwords
- **chats**: Chat conversations linked to users
- **messages**: Individual messages within chats
- **prompts**: Saved prompts for reuse (future feature)
- **password_reset_tokens**: Secure tokens for password reset

For detailed database documentation, see [database/README.md](../database/README.md).

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add all environment variables in Vercel's dashboard:
   - `OPENROUTER_API_KEY`
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_SITE_URL` (optional)
   - `NEXT_PUBLIC_SITE_NAME` (optional)
4. Set up a PostgreSQL database (Vercel Postgres, Supabase, or external)
5. Run Prisma migrations: `npx prisma db push`
6. Deploy!

### Other Platforms

This is a standard Next.js application and can be deployed to any platform that supports Next.js:
- Vercel (recommended)
- Netlify
- AWS Amplify
- Railway
- Your own server with Node.js

**Important**: Make sure to set up a PostgreSQL database and configure all environment variables on your hosting platform.

## Troubleshooting

### API Key Issues

- Ensure `OPENROUTER_API_KEY` is set in your `.env.local` file
- Check that your API key is valid and has credits
- Verify the key is not exposed in client-side code

### Database Connection Issues

- Verify PostgreSQL is running
- Check `DATABASE_URL` format in `.env.local`
- Ensure database exists and Prisma migrations have been run
- Test connection: Visit `http://localhost:3000/api/test-db`

### Authentication Issues

- Verify `NEXTAUTH_SECRET` is set and is a random string
- Check `NEXTAUTH_URL` matches your application URL
- Ensure database tables are created (run `npx prisma db push`)
- Check browser console and server logs for errors

### Email/Password Reset Issues

- Verify `RESEND_API_KEY` is set correctly
- Check `RESEND_FROM_EMAIL` is a verified email (or use `onboarding@resend.dev` for testing)
- Ensure `NEXT_PUBLIC_APP_URL` is set correctly
- Check Resend dashboard for email delivery status
- See [PASSWORD_RESET_SETUP.md](./PASSWORD_RESET_SETUP.md) for detailed troubleshooting

### Build Errors

- Clear `.next` folder and `node_modules`, then reinstall:
  ```bash
  rm -rf .next node_modules
  npm install
  ```
- Generate Prisma Client:
  ```bash
  npx prisma generate
  ```

### Model Not Responding

- Check if the model ID is correct
- Verify your OpenRouter account has access to the selected model
- Check browser console and server logs for error messages

## Additional Documentation

- [Technical Documentation](./DOCUMENTATION.md) - Detailed technical documentation
- [Database Documentation](../database/README.md) - Database setup and schema
- [Password Reset Setup](./PASSWORD_RESET_SETUP.md) - Email configuration guide
- [Email Troubleshooting](./EMAIL_BOUNCE_TROUBLESHOOTING.md) - Email delivery issues

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [OpenRouter](https://openrouter.ai/)
- Uses [OpenRouter SDK](https://github.com/OpenRouterTeam/openrouter-sdk)
- Authentication with [NextAuth.js](https://next-auth.js.org/)
- Database with [Prisma](https://www.prisma.io/)
- Email with [Resend](https://resend.com/)
