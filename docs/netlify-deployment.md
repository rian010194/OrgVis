# Netlify Deployment Guide

## 🚀 Deploya JumpYard Organization Chart på Netlify

### Steg 1: Skapa Netlify-konto
1. Gå till [netlify.com](https://netlify.com)
2. Klicka "Sign up" och logga in med GitHub
3. Auktorisera Netlify att komma åt dina repositories

### Steg 2: Deploya från GitHub
1. I Netlify dashboard, klicka **"New site from Git"**
2. Välj **"GitHub"** som Git provider
3. Välj ditt repository: `rian010194/OrgVis`
4. Konfigurera build settings:
   - **Branch to deploy**: `main`
   - **Build command**: (lämna tomt - ingen build behövs)
   - **Publish directory**: `/` (root directory)
5. Klicka **"Deploy site"**

### Steg 3: Konfigurera Custom Domain (valfritt)
1. I site settings, gå till **"Domain management"**
2. Klicka **"Add custom domain"**
3. Ange din domän (t.ex. `jumpyard-org.yourdomain.com`)
4. Följ instruktionerna för DNS-konfiguration

### Steg 4: Konfigurera Environment Variables (för Supabase)
1. I site settings, gå till **"Environment variables"**
2. Lägg till följande variabler:
   ```
   VITE_SUPABASE_URL=https://cihgptcfhaeujxhpvame.supabase.co
   VITE_SUPABASE_ANON_KEY=din-anon-key-här
   ```

### Steg 5: Uppdatera config för produktion
Skapa en `netlify.toml` fil i root directory:

```toml
[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/js/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000"

[[headers]]
  for = "/css/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000"
```

### Steg 6: Aktivera Supabase (när det är redo)
När du har konfigurerat Supabase enligt QUICK-START.md:

1. Uppdatera `js/config.js` med dina riktiga credentials
2. Ändra tillbaka `index.html` för att använda Supabase:
   ```html
   <script src="js/d3.v7.min.js"></script>
   <script type="module" src="js/config.js"></script>
   <script type="module" src="js/supabase.js"></script>
   <script type="module" src="js/data-supabase.js"></script>
   <script src="js/charts.js"></script>
   <script src="js/ui.js"></script>
   <script src="js/map.js"></script>
   <script type="module" src="js/app.js"></script>
   ```
3. Commita och pusha ändringarna
4. Netlify kommer automatiskt att deploya de nya ändringarna

## 🔧 Netlify Features du kan använda

### Automatic Deployments
- Varje push till `main` branch deployar automatiskt
- Preview deployments för pull requests

### Form Handling
- Kan lägga till kontaktformulär senare
- Netlify hanterar form submissions automatiskt

### Edge Functions
- Kan lägga till serverless functions för API endpoints
- Bra för att hantera komplexa backend-operationer

### Analytics
- Inbyggd analytics för att se besökarstatistik
- A/B testing capabilities

## 🆘 Troubleshooting

### Vanliga problem:

1. **Site visar inte orgchart**
   - Kontrollera att alla filer är pushat till GitHub
   - Kontrollera att build settings är korrekta
   - Titta på Netlify deploy logs

2. **Supabase fungerar inte**
   - Kontrollera CORS-inställningar i Supabase dashboard
   - Lägg till din Netlify URL i Supabase allowed origins
   - Kontrollera environment variables

3. **Slow loading**
   - Aktivera Netlify's CDN
   - Optimera bilder och assets
   - Använd Netlify's image optimization

## 📊 Monitoring

### Netlify Analytics
- Gå till **Analytics** i Netlify dashboard
- Se besökarstatistik, page views, etc.

### Error Tracking
- Netlify visar deploy errors automatiskt
- Använd browser developer tools för frontend errors

## 🎯 Nästa steg efter deployment

1. **Testa applikationen** på den live URL:en
2. **Konfigurera Supabase** enligt QUICK-START.md
3. **Aktivera Supabase** i produktion
4. **Lägg till autentisering** om det behövs
5. **Optimera prestanda** med Netlify features

## 🔗 När du är klar

Din applikation kommer att vara tillgänglig på:
`https://[random-name].netlify.app`

Du kan också lägga till en custom domain senare.
