# Supabase Setup Instructions

## Steg 1: Kör Huvudskriptet

Kopiera och kör hela innehållet av `supabase/setup_database_multi_org.sql` i din Supabase SQL-editor.

Detta skript skapar:
- `organizations` tabell (med branding JSONB-fält)
- `nodes` tabell
- `metrics` tabell  
- `relations` tabell
- JumpYard demo-organisation med exempeldata

## Steg 2: Skapa Demo-organisation

Kör sedan `supabase/setup_demo_org.sql` för att skapa en demo-organisation som matchar dina localStorage-inställningar.

## Steg 3: Verifiera Setup

Efter att ha kört båda skripten, kontrollera att allt fungerar:

```sql
-- Kontrollera att tabellerna skapades
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('organizations', 'nodes', 'metrics', 'relations');

-- Kontrollera att demo-organisationen finns
SELECT * FROM organizations WHERE id = 'demo_org';

-- Kontrollera att noder skapades
SELECT COUNT(*) FROM nodes WHERE organization_id = 'demo_org';
```

## Steg 4: Testa Applikationen

1. **Öppna applikationen** i webbläsaren
2. **Öppna Developer Console** (F12)
3. **Kontrollera att Supabase-anslutningen fungerar**:
   ```javascript
   // I konsolen, kör:
   debugThemeEditor()
   ```
4. **Testa theme editor**:
   - Öppna Edit Theme panelen
   - Ändra organisationens namn
   - Kontrollera att headern uppdateras i realtid

## Steg 5: Felsökning

### Om du får anslutningsfel:
- Kontrollera att `js/config.js` har rätt Supabase URL och API-nyckel
- Kontrollera att Row Level Security-policies är korrekt konfigurerade

### Om theme editor inte fungerar:
- Kontrollera att `js/theme-editor-supabase.js` laddas korrekt
- Kontrollera att `orgDb` objektet är tillgängligt i konsolen

### Om data inte sparas:
- Kontrollera att organisationen finns i `organizations` tabellen
- Kontrollera att `current_organization_id` är satt i localStorage

## Steg 6: Produktionsoptimering

För produktion, överväg att:
1. **Begränsa RLS-policies** för bättre säkerhet
2. **Lägg till användarautentisering** med Supabase Auth
3. **Implementera backup-strategi** för organisationsdata
4. **Optimera databasindex** baserat på användningsmönster

## Support

Om du stöter på problem:
1. Kontrollera Supabase Dashboard för felmeddelanden
2. Använd `debugThemeEditor()` funktionen i konsolen
3. Kontrollera Network-fliken för misslyckade API-anrop
