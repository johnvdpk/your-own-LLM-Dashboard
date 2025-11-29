# File en Image Support - Implementatie Gids

## Overzicht

Dit document beschrijft de stappen die nodig zijn om file en image input/output te ondersteunen in de OpenRouter chat applicatie. Momenteel ondersteunt de applicatie alleen tekst-based modellen.

## OpenRouter Multimodal Support

Volgens de [OpenRouter models pagina](https://openrouter.ai/models) ondersteunen sommige modellen:
- **Input Modalities**: Text, Image, File, Audio, Video
- **Output Modalities**: Text, Image, Embeddings

### Multimodal Message Structuur

OpenRouter gebruikt de OpenAI-compatibele message structuur voor multimodal content:

```typescript
{
  role: 'user' | 'assistant' | 'system',
  content: string | Array<{
    type: 'text' | 'image_url' | 'file',
    text?: string,
    image_url?: {
      url: string
    },
    file?: {
      url: string,
      filename?: string
    }
  }>
}
```

## Benodigde Stappen

### 1. Type Definitions Uitbreiden

**Bestand**: `types/chat.ts` en `types/api.ts`

De huidige `Message` interface ondersteunt alleen `content: string`. Dit moet worden uitgebreid naar een union type die zowel string als een array van content items kan bevatten.

**Huidige structuur:**
```typescript
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}
```

**Nieuwe structuur:**
```typescript
export type MessageContent = 
  | string 
  | Array<{
      type: 'text' | 'image_url' | 'file';
      text?: string;
      image_url?: {
        url: string;
      };
      file?: {
        url: string;
        filename?: string;
      };
    }>;

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: MessageContent;
  timestamp: Date;
}
```

### 2. OpenRouter Types Uitbreiden

**Bestand**: `lib/openrouter.ts`

De `ChatMessage` interface moet worden aangepast om multimodal content te ondersteunen:

```typescript
export type ChatMessageContent = 
  | string 
  | Array<{
      type: 'text' | 'image_url' | 'file';
      text?: string;
      image_url?: {
        url: string;
      };
      file?: {
        url: string;
        filename?: string;
      };
    }>;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: ChatMessageContent;
}
```

### 3. File Upload API Endpoint

**Nieuw bestand**: `app/api/upload/route.ts`

Een nieuwe API route is nodig om files te uploaden. Deze route:
- Accepteert multipart/form-data
- Valideert file types en sizes
- Upload files naar blob storage (zie sectie "Blob Storage")
- Retourneert een URL naar de geüploade file

**Basis implementatie:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type and size
    // Upload to blob storage
    // Return URL
    
    return NextResponse.json({ url: '...' });
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

### 4. ChatInput Component Uitbreiden

**Bestand**: `components/Chat/ChatInput/ChatInput.tsx`

De ChatInput component moet worden uitgebreid met:
- File input (hidden input + button)
- Image preview voorafgaand aan verzenden
- Drag & drop support
- File type validatie

**Nieuwe state:**
```typescript
const [attachments, setAttachments] = useState<Array<{
  type: 'image' | 'file';
  url: string;
  filename: string;
  preview?: string; // Voor images
}>>([]);
```

**Functionaliteit:**
- File selectie via button of drag & drop
- Image preview in de input area
- File verwijdering voordat verzenden
- Upload files naar `/api/upload` voordat message wordt verzonden

### 5. Message Component Uitbreiden

**Bestand**: `components/Chat/Message/Message.tsx`

De Message component moet worden aangepast om:
- Images te renderen (img tags)
- Files te renderen (download links)
- Mixed content (text + images/files) te ondersteunen

**Nieuwe render logica:**
```typescript
function renderContent(content: MessageContent) {
  if (typeof content === 'string') {
    return parseContent(content); // Bestaande logica
  }
  
  // Array van content items
  return content.map((item, index) => {
    if (item.type === 'text' && item.text) {
      return <div key={index}>{parseContent(item.text)}</div>;
    }
    if (item.type === 'image_url' && item.image_url) {
      return <img key={index} src={item.image_url.url} alt="Message image" />;
    }
    if (item.type === 'file' && item.file) {
      return <a key={index} href={item.file.url} download>{item.file.filename || 'Download'}</a>;
    }
    return null;
  });
}
```

### 6. API Route Aanpassingen

**Bestand**: `app/api/completions/route.ts`

De completions route moet worden aangepast om:
- Multimodal messages te accepteren
- Content validatie uit te breiden (niet alleen string checken)
- OpenRouter API calls te maken met multimodal content

**Validatie aanpassing:**
```typescript
// Huidige validatie (regel 53):
if (typeof msg.content !== 'string') {
  return NextResponse.json(
    { error: 'Message content must be a string' },
    { status: 400 }
  );
}

// Nieuwe validatie:
if (typeof msg.content !== 'string' && !Array.isArray(msg.content)) {
  return NextResponse.json(
    { error: 'Message content must be a string or array' },
    { status: 400 }
  );
}
```

### 7. Database Schema Aanpassing

**Bestand**: `prisma/schema.prisma`

De `Message` model moet worden aangepast om multimodal content op te slaan. De `content` field moet van `String` naar `Json` worden veranderd:

```prisma
model Message {
  id        String   @id @default(cuid())
  chatId    String
  chat      Chat     @relation(fields: [chatId], references: [id], onDelete: Cascade)
  role      String   // 'user' | 'assistant' | 'system'
  content   Json     // Was: String, nu: Json voor multimodal support
  createdAt DateTime @default(now())
  timestamp DateTime @default(now())

  @@index([chatId])
}
```

**Migratie:**
```bash
npx prisma migrate dev --name add_multimodal_content
```

## Blob Storage

### Is Blob Storage Nodig?

**Ja, blob storage is nodig** voor de volgende redenen:

1. **File Opslag**: Geüploade files moeten ergens worden opgeslagen
2. **URL Generatie**: OpenRouter API verwacht URLs naar files/images, niet base64 data
3. **Performance**: Base64 encoding maakt messages zeer groot
4. **Persistence**: Files moeten beschikbaar blijven voor toekomstige chat sessies

### Blob Storage Opties

#### Optie 1: Lokale VPS Storage (Aanbevolen - Zelfbeheerd) ✅

**Voordelen:**
- Volledige controle over data
- Geen vendor lock-in
- Geen maandelijkse kosten
- Privacy: data blijft op eigen server
- Automatische cleanup na X tijd

**Implementatie:**
Deze applicatie heeft al lokale VPS storage geïmplementeerd! Zie `VPS_STORAGE_SETUP.md` voor volledige setup instructies.

**Environment variables:**
```env
FILE_STORAGE_DIR=/var/www/storage/uploads
NEXT_PUBLIC_APP_URL=https://yourdomain.com
FILE_RETENTION_HOURS=24
MAX_FILE_SIZE_MB=10
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf
```

**Features:**
- Automatische file cleanup via cron job
- Security validatie (file types, sizes)
- Public URL generatie
- Storage statistics API

#### Optie 2: Vercel Blob Storage (Voor Vercel deployments)

**Voordelen:**
- Geïntegreerd met Vercel
- Eenvoudige setup
- Automatische CDN
- Goede performance

**Setup:**
```bash
npm install @vercel/blob
```

**Environment variables:**
```
BLOB_READ_WRITE_TOKEN=your_token_here
```

**Implementatie:**
```typescript
import { put } from '@vercel/blob';

const blob = await put(file.name, file, {
  access: 'public',
});

return { url: blob.url };
```

#### Optie 3: AWS S3

**Voordelen:**
- Zeer schaalbaar
- Goedkoop voor grote volumes
- Wereldwijde beschikbaarheid

**Setup:**
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Environment variables:**
```
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=eu-west-1
AWS_S3_BUCKET=your_bucket_name
```

#### Optie 4: Cloudinary

**Voordelen:**
- Uitstekende image processing
- Automatische format conversie
- Image optimization

**Setup:**
```bash
npm install cloudinary
```

### Blob Storage Workflow

1. **Upload**: User selecteert file → Upload naar blob storage → Krijgt URL terug
2. **Message Creation**: URL wordt toegevoegd aan message content
3. **API Call**: OpenRouter API ontvangt message met file URL
4. **Response**: OpenRouter kan nieuwe files/images genereren (voor image output modellen)
5. **Storage**: Generated files moeten ook worden opgeslagen indien nodig

## Image Output Support

Sommige modellen kunnen images genereren als output. Voor deze modellen:

1. **Response Parsing**: Check of response content image URLs bevat
2. **Image Storage**: Download generated images en sla op in blob storage
3. **Display**: Render images in Message component

**Voorbeeld response:**
```json
{
  "message": {
    "role": "assistant",
    "content": [
      {
        "type": "text",
        "text": "Hier is de gegenereerde afbeelding:"
      },
      {
        "type": "image_url",
        "image_url": {
          "url": "https://generated-image-url.com/image.png"
        }
      }
    ]
  }
}
```

## Implementatie Prioriteit

### Fase 1: Image Input (Basis)
1. Type definitions uitbreiden
2. File upload API (met blob storage)
3. ChatInput component - image upload
4. Message component - image display
5. API route aanpassingen

### Fase 2: File Input
1. File type validatie
2. File preview/download in Message component
3. File size limits

### Fase 3: Image Output
1. Response parsing voor image URLs
2. Image download en storage
3. Image display in assistant messages

### Fase 4: Advanced Features
1. Drag & drop
2. Multiple file upload
3. File compression
4. Image editing (crop, resize)

## Security Overwegingen

1. **File Type Validation**: Alleen toegestane types accepteren
2. **File Size Limits**: Maximum file size instellen
3. **Virus Scanning**: Overweeg virus scanning voor uploads
4. **Access Control**: Zorg dat alleen geautoriseerde users files kunnen uploaden
5. **URL Expiration**: Overweeg signed URLs met expiration voor privacy

## Testing

Test cases:
1. Image upload en weergave
2. File upload en download
3. Mixed content (text + images)
4. Large file handling
5. Invalid file type rejection
6. Image output rendering

## Referenties

- [OpenRouter Models](https://openrouter.ai/models)
- [OpenAI Multimodal Messages](https://platform.openai.com/docs/guides/vision)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
- [Next.js File Uploads](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#request-body)

