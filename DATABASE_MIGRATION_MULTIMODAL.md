# Database Migratie: Multimodal Content Support

## Overzicht

De `messages.content` kolom wordt gewijzigd van `String` naar `Json` om multimodal content (text, images, files) te ondersteunen.

## Stap 1: SQL Migratie Uitvoeren

Voer de volgende SQL uit in je PostgreSQL database (via pgAdmin, psql, of een andere database tool):

```sql
-- Step 1: Add a temporary column with JSONB type
ALTER TABLE messages ADD COLUMN content_json JSONB;

-- Step 2: Convert existing string content to JSON (strings become JSON strings)
UPDATE messages SET content_json = to_jsonb(content);

-- Step 3: Drop the old column
ALTER TABLE messages DROP COLUMN content;

-- Step 4: Rename the new column to content
ALTER TABLE messages RENAME COLUMN content_json TO content;
```

## Stap 2: Prisma Schema Synchroniseren

Na de SQL migratie, synchroniseer Prisma:

```bash
npx prisma db push
```

Of als je migrations gebruikt:

```bash
npx prisma migrate resolve --applied convert_content_to_json
npx prisma generate
```

## Stap 3: Verifieer

Test of alles werkt:

1. Start de development server: `npm run dev`
2. Upload een image en verstuur een bericht
3. Controleer of de message correct wordt opgeslagen en geladen

## Belangrijk

- **Backup**: Maak een backup van je database voordat je de migratie uitvoert
- **Data behoud**: Bestaande string content wordt automatisch geconverteerd naar JSON
- **Compatibiliteit**: Oude string messages blijven werken (worden als JSON strings opgeslagen)

## Troubleshooting

Als je errors krijgt:

1. **"column does not exist"**: Controleer of je de SQL stappen in de juiste volgorde hebt uitgevoerd
2. **"cannot cast"**: Zorg dat alle messages een content waarde hebben (geen NULL)
3. **Type errors**: Run `npx prisma generate` om de Prisma client te regenereren

