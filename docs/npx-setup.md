# Setup med npx (utan global installation)

## 🚀 Använd npx istället för global installation

Eftersom global installation av Supabase CLI inte fungerar på ditt system, kan vi använda `npx` istället.

### Steg 1: Logga in på Supabase
```bash
npx supabase login
```

### Steg 2: Skapa nytt projekt (om du inte har ett)
```bash
npx supabase projects create organization-chart
```

### Steg 3: Länka till ditt projekt
```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

### Steg 4: Kör migrations
```bash
npx supabase db push
```

### Steg 5: Seed databasen
```bash
npx supabase db seed
```

## 📋 Komplett kommando-sekvens

Kör dessa kommandon i ordning:

```bash
# 1. Logga in
npx supabase login

# 2. Skapa projekt (om du inte har ett)
npx supabase projects create organization-chart

# 3. Länka till projektet (ersätt YOUR_PROJECT_REF med ditt projekt-ref)
npx supabase link --project-ref YOUR_PROJECT_REF

# 4. Deploya databas-schema
npx supabase db push

# 5. Lägg till testdata
npx supabase db seed
```

## 🔍 Hitta ditt Project Ref

Om du redan har ett Supabase-projekt:
1. Gå till [supabase.com/dashboard](https://supabase.com/dashboard)
2. Välj ditt projekt
3. Gå till Settings > General
4. Kopiera "Reference ID" (det är ditt project-ref)

## ⚡ Snabbare alternativ

Om du vill komma igång snabbast, följ **QUICK-START.md** istället - det kräver ingen CLI alls!
