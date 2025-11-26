# Email Bounce Troubleshooting

Als je emails een "Bounced" status krijgen, zijn hier de meest voorkomende oorzaken en oplossingen:

## Meest Waarschijnlijke Oorzaken

### 1. **RESEND_FROM_EMAIL is niet geverifieerd**

**Probleem:** Het "from" email adres dat je gebruikt is niet geverifieerd in Resend.

**Oplossing:**
- Ga naar je Resend dashboard → "Domains"
- Voeg je domain toe (bijv. `aiadapt.nl`)
- Voeg de DNS records toe die Resend je geeft (SPF, DKIM, DMARC)
- Wacht tot verificatie compleet is (kan enkele minuten tot uren duren)

**Voor development/testing:**
- Gebruik `onboarding@resend.dev` als `RESEND_FROM_EMAIL` (dit is een test email die Resend automatisch verifieert)

### 2. **Verkeerde RESEND_FROM_EMAIL waarde**

**Probleem:** De `RESEND_FROM_EMAIL` environment variable is niet correct ingesteld.

**Check:**
```bash
# In je .env bestand moet staan:
RESEND_FROM_EMAIL=onboarding@resend.dev  # Voor development
# OF
RESEND_FROM_EMAIL=noreply@aiadapt.nl    # Voor productie (moet geverifieerd zijn)
```

**Oplossing:**
- Controleer je `.env` bestand in de `open-router-chat` folder
- Zorg dat `RESEND_FROM_EMAIL` correct is ingesteld
- Herstart je development server na het aanpassen van `.env`

### 3. **Domain DNS Records niet correct**

**Probleem:** Als je je eigen domain gebruikt, zijn de DNS records niet correct ingesteld.

**Check in Resend Dashboard:**
- Ga naar "Domains" → klik op je domain
- Controleer of alle records (SPF, DKIM, DMARC) "Verified" zijn
- Als er records ontbreken of incorrect zijn, pas ze aan bij je DNS provider

**Veelvoorkomende DNS records voor Resend:**
```
Type: TXT
Name: @
Value: (SPF record van Resend)

Type: TXT  
Name: resend._domainkey
Value: (DKIM record van Resend)
```

### 4. **Email adres bestaat niet**

**Probleem:** Het "to" email adres (`john@aiadapt.nl`) bestaat niet of is ongeldig.

**Check:**
- Controleer of het email adres correct gespeld is
- Test of je handmatig naar dit adres kunt mailen
- Controleer of het email adres niet op een blacklist staat

### 5. **API Key problemen**

**Probleem:** De Resend API key is niet correct of heeft geen rechten.

**Check:**
- Ga naar Resend dashboard → "API Keys"
- Controleer of je API key actief is
- Zorg dat `RESEND_API_KEY` in je `.env` correct is (moet beginnen met `re_`)

## Debugging Stappen

1. **Check de server logs:**
   - Kijk in je terminal/console waar de Next.js server draait
   - Zoek naar "Resend API error" of "Failed to send reset email"
   - De logs tonen nu meer details over de fout

2. **Check Resend Dashboard:**
   - Ga naar "Emails" in je Resend dashboard
   - Klik op de bounced email
   - Bekijk de "Bounce Reason" voor meer details

3. **Test met Resend test email:**
   ```env
   RESEND_FROM_EMAIL=onboarding@resend.dev
   ```
   Dit zou altijd moeten werken voor development.

4. **Verifieer environment variables:**
   ```bash
   # In je .env bestand:
   RESEND_API_KEY=re_... (moet beginnen met re_)
   RESEND_FROM_EMAIL=onboarding@resend.dev
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## Snelle Fix voor Development

Als je snel wilt testen zonder domain verificatie:

1. Zet in je `.env`:
   ```env
   RESEND_FROM_EMAIL=onboarding@resend.dev
   ```

2. Herstart je development server:
   ```bash
   # Stop de server (Ctrl+C)
   # Start opnieuw
   npm run dev
   ```

3. Test opnieuw - dit zou moeten werken zonder domain verificatie.

## Voor Productie

Voor productie moet je:

1. **Domain toevoegen in Resend:**
   - Ga naar "Domains" → "Add Domain"
   - Voeg `aiadapt.nl` toe (of je eigen domain)

2. **DNS Records toevoegen:**
   - Resend geeft je specifieke DNS records
   - Voeg deze toe bij je DNS provider (waar je je domain hebt geregistreerd)
   - Wacht tot verificatie compleet is (kan tot 48 uur duren, meestal binnen 1 uur)

3. **Update .env:**
   ```env
   RESEND_FROM_EMAIL=noreply@aiadapt.nl
   NEXT_PUBLIC_APP_URL=https://jouw-app-url.com
   ```

4. **Test:**
   - Stuur een test email naar jezelf
   - Controleer of deze aankomt (niet bounced)

## Hulp Nodig?

Als het probleem blijft bestaan:
- Check de Resend dashboard voor meer details over de bounce
- Bekijk de server logs voor specifieke error messages
- Resend support: support@resend.com

