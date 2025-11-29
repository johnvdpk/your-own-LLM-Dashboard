# VPS File Storage Setup - Zelfbeheerde Opslag

Deze applicatie gebruikt lokale file storage op je eigen VPS, zonder afhankelijkheid van externe vendors. Files worden opgeslagen in een configurable directory en kunnen automatisch worden opgeruimd na een ingestelde tijd.

## Voordelen

- ✅ **Volledige controle**: Alle data blijft op je eigen server
- ✅ **Geen vendor lock-in**: Geen afhankelijkheid van externe services
- ✅ **Kostenbesparend**: Geen maandelijkse kosten voor storage
- ✅ **Privacy**: Data verlaat je server niet
- ✅ **Automatische cleanup**: Files worden automatisch verwijderd na X tijd

## Configuratie

### Environment Variables

Voeg de volgende variabelen toe aan je `.env.local` bestand:

```env
# File Storage Configuration
FILE_STORAGE_DIR=/var/www/storage/uploads
# Of relatief pad vanaf project root:
# FILE_STORAGE_DIR=./storage/uploads

# Public URL voor file access (moet overeenkomen met je domain)
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# File Retention (in uren) - standaard 24 uur
FILE_RETENTION_HOURS=24

# Maximum file size in MB (standaard 10MB)
MAX_FILE_SIZE_MB=10

# Toegestane file types (comma-separated, of * voor alles)
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,text/markdown

# Optioneel: Secret token voor cleanup endpoint (voor cron jobs)
CLEANUP_SECRET_TOKEN=your_secret_token_here
```

### Storage Directory Setup

1. **Kies een storage locatie** op je VPS:
   ```bash
   # Bijvoorbeeld:
   sudo mkdir -p /var/www/storage/uploads
   sudo chown -R $USER:$USER /var/www/storage
   ```

2. **Of gebruik relatief pad** (wordt opgeslagen in project directory):
   ```bash
   mkdir -p storage/uploads
   ```

3. **Zorg voor juiste permissions**:
   ```bash
   chmod 755 storage/uploads
   ```

## Automatische Cleanup Setup

### Optie 1: Cron Job (Aanbevolen)

1. **Genereer een secret token**:
   ```bash
   openssl rand -base64 32
   ```
   Voeg dit toe aan je `.env.local` als `CLEANUP_SECRET_TOKEN`

2. **Voeg cron job toe**:
   ```bash
   crontab -e
   ```

3. **Voeg regel toe** (bijvoorbeeld elk uur):
   ```cron
   0 * * * * curl -X POST https://yourdomain.com/api/cleanup -H "Authorization: Bearer YOUR_SECRET_TOKEN"
   ```

   Of gebruik een script:
   ```bash
   # Maak script: /usr/local/bin/cleanup-files.sh
   #!/bin/bash
   curl -X POST https://yourdomain.com/api/cleanup \
     -H "Authorization: Bearer YOUR_SECRET_TOKEN" \
     -H "Content-Type: application/json"
   ```

   ```cron
   0 * * * * /usr/local/bin/cleanup-files.sh
   ```

### Optie 2: Systemd Timer (Alternatief)

1. **Maak service file**: `/etc/systemd/system/file-cleanup.service`
   ```ini
   [Unit]
   Description=File Cleanup Service
   After=network.target

   [Service]
   Type=oneshot
   User=www-data
   Environment="CLEANUP_SECRET_TOKEN=your_secret_token"
   ExecStart=/usr/bin/curl -X POST https://yourdomain.com/api/cleanup -H "Authorization: Bearer ${CLEANUP_SECRET_TOKEN}"
   ```

2. **Maak timer file**: `/etc/systemd/system/file-cleanup.timer`
   ```ini
   [Unit]
   Description=Run file cleanup hourly
   Requires=file-cleanup.service

   [Timer]
   OnCalendar=hourly
   Persistent=true

   [Install]
   WantedBy=timers.target
   ```

3. **Activeer timer**:
   ```bash
   sudo systemctl enable file-cleanup.timer
   sudo systemctl start file-cleanup.timer
   ```

### Optie 3: Next.js API Route (Eenvoudig, maar minder betrouwbaar)

Je kunt ook een Next.js API route maken die automatisch wordt aangeroepen, maar dit is minder betrouwbaar omdat het afhankelijk is van je Next.js server die draait.

## API Endpoints

### POST /api/upload

Upload een file naar lokale storage.

**Request:**
```typescript
FormData {
  file: File
}
```

**Response:**
```json
{
  "url": "https://yourdomain.com/api/files/filename_1234567890_abc123.jpg",
  "filename": "filename_1234567890_abc123.jpg"
}
```

### GET /api/files/[filename]

Serve een geüploade file.

**Response:** File content met juiste Content-Type headers.

### POST /api/cleanup

Voer cleanup uit van oude files.

**Headers:**
```
Authorization: Bearer YOUR_SECRET_TOKEN
```

**Response:**
```json
{
  "success": true,
  "deletedCount": 5,
  "stats": {
    "totalFiles": 10,
    "totalSize": 5242880,
    "oldestFile": "2024-01-01T00:00:00.000Z",
    "newestFile": "2024-01-01T12:00:00.000Z"
  }
}
```

### GET /api/cleanup

Haal storage statistieken op (zonder cleanup uit te voeren).

**Response:**
```json
{
  "stats": {
    "totalFiles": 10,
    "totalSize": 5242880,
    "oldestFile": "2024-01-01T00:00:00.000Z",
    "newestFile": "2024-01-01T12:00:00.000Z"
  },
  "retentionHours": 24
}
```

## Security Overwegingen

1. **File Type Validatie**: Alleen toegestane file types worden geaccepteerd
2. **File Size Limits**: Maximum file size wordt gecontroleerd
3. **Directory Traversal Protection**: Filenames worden gevalideerd om directory traversal te voorkomen
4. **Authentication**: Upload endpoint vereist authenticatie
5. **Cleanup Authentication**: Cleanup endpoint kan worden beveiligd met secret token

## Monitoring

### Storage Usage Checken

```bash
# Check storage directory size
du -sh /var/www/storage/uploads

# Check aantal files
ls -1 /var/www/storage/uploads | wc -l

# Check oudste file
ls -lt /var/www/storage/uploads | tail -1
```

### Via API

```bash
curl https://yourdomain.com/api/cleanup \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

## Troubleshooting

### Files worden niet verwijderd

1. Check of cron job draait:
   ```bash
   crontab -l
   ```

2. Check cron logs:
   ```bash
   grep CRON /var/log/syslog
   ```

3. Test cleanup endpoint handmatig:
   ```bash
   curl -X POST https://yourdomain.com/api/cleanup \
     -H "Authorization: Bearer YOUR_SECRET_TOKEN"
   ```

### Permission Errors

```bash
# Check permissions
ls -la /var/www/storage/uploads

# Fix permissions (pas aan naar je setup)
sudo chown -R www-data:www-data /var/www/storage
sudo chmod -R 755 /var/www/storage
```

### Storage Directory bestaat niet

De applicatie maakt automatisch de directory aan bij eerste upload. Als dit niet werkt, maak handmatig:

```bash
mkdir -p /var/www/storage/uploads
chmod 755 /var/www/storage/uploads
```

## Best Practices

1. **Backup**: Overweeg regelmatige backups van belangrijke files
2. **Monitoring**: Monitor storage usage om disk space problemen te voorkomen
3. **Retention Policy**: Stel een redelijke retention tijd in (24-48 uur is meestal voldoende)
4. **File Size Limits**: Stel redelijke limits in om disk space te besparen
5. **Logging**: Monitor cleanup logs om te zien hoeveel files worden verwijderd

## Voorbeeld .env.local Configuratie

```env
# File Storage
FILE_STORAGE_DIR=/var/www/storage/uploads
NEXT_PUBLIC_APP_URL=https://yourdomain.com
FILE_RETENTION_HOURS=24
MAX_FILE_SIZE_MB=10
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,text/markdown
CLEANUP_SECRET_TOKEN=your_generated_secret_token_here
```

## Nginx Configuratie (Optioneel)

Als je Nginx gebruikt, kun je files direct serveren zonder Next.js (sneller):

```nginx
location /api/files/ {
    alias /var/www/storage/uploads/;
    expires 1h;
    add_header Cache-Control "public, max-age=3600";
    
    # Security headers
    add_header X-Content-Type-Options "nosniff";
    add_header X-Frame-Options "DENY";
}
```

Dit is optioneel - de Next.js API route werkt ook prima voor kleinere deployments.

