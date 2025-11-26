# Wachtwoord Reset Setup

Deze applicatie gebruikt **Resend** voor het versturen van wachtwoord reset emails. Resend is een moderne email service die makkelijk te gebruiken is en een gratis tier heeft (3000 emails per maand).

## Stap 1: Resend Account Aanmaken

1. Ga naar [resend.com](https://resend.com)
2. Maak een gratis account aan
3. Verifieer je email adres

## Stap 2: API Key Ophalen

1. Log in op je Resend dashboard
2. Ga naar "API Keys" in het menu
3. Klik op "Create API Key"
4. Geef de key een naam (bijv. "Open Router Chat")
5. Kopieer de API key (je ziet hem maar één keer!)

## Stap 3: Email Domain Verifiëren (Optioneel voor productie)

Voor development kun je de test email gebruiken, maar voor productie moet je een domain verifiëren:

1. Ga naar "Domains" in het Resend dashboard
2. Klik op "Add Domain"
3. Voeg je domain toe (bijv. `example.com`)
4. Voeg de DNS records toe die Resend je geeft
5. Wacht tot de verificatie compleet is

**Voor development/testing:** Je kunt ook het test email adres gebruiken dat Resend je geeft (bijv. `onboarding@resend.dev`)

## Stap 4: Environment Variables Instellen

Voeg de volgende variabelen toe aan je `.env` bestand in de `open-router-chat` folder:

```env
# Resend Email Configuration
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com

# App URL (voor reset links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Voor development:**
- `RESEND_FROM_EMAIL` kan `onboarding@resend.dev` zijn (test email)
- `NEXT_PUBLIC_APP_URL` moet `http://localhost:3000` zijn voor local development

**Voor productie:**
- `RESEND_FROM_EMAIL` moet een geverifieerd email adres zijn van je domain
- `NEXT_PUBLIC_APP_URL` moet je productie URL zijn (bijv. `https://yourapp.com`)

## Stap 5: Database Migratie Uitvoeren

Voer de Prisma migratie uit om de password reset token tabel aan te maken:

```bash
cd open-router-chat
npx prisma db push
```

Of als je migrations gebruikt:

```bash
npx prisma migrate dev --name add_password_reset_tokens
```

## Hoe Het Werkt

1. **Wachtwoord Vergeten:**
   - Gebruiker klikt op "Vergeten?" bij het login formulier
   - Vult email adres in
   - Systeem genereert een secure token en slaat deze op in de database
   - Email wordt verstuurd met reset link

2. **Wachtwoord Resetten:**
   - Gebruiker klikt op link in email
   - Komt op `/reset-password?token=...` pagina
   - Vult nieuw wachtwoord in
   - Token wordt gevalideerd (niet verlopen, niet gebruikt)
   - Wachtwoord wordt gehashed en opgeslagen
   - Token wordt gemarkeerd als gebruikt

## Veiligheid

- Tokens zijn cryptografisch secure (32 bytes random)
- Tokens verlopen na 1 uur
- Tokens kunnen maar één keer gebruikt worden
- Email enumeration wordt voorkomen (altijd success response)
- Wachtwoorden worden gehashed met bcrypt (10 rounds)

## Alternatieve Email Services

Als je Resend niet wilt gebruiken, kun je ook andere services gebruiken:

- **SendGrid** - Populair, gratis tier (100 emails/dag)
- **Mailgun** - Goed, gratis tier (5000 emails/maand eerste 3 maanden)
- **Nodemailer met SMTP** - Werkt met elke SMTP server (meer configuratie nodig)

Om een andere service te gebruiken, pas dan `lib/email.ts` aan.

