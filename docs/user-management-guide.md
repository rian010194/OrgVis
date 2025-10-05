# Användarhanteringssystem för Stora Organisationer

Detta system är designat för att hantera över 1000 anställda med hierarkiska rättigheter och bulk-import funktionalitet.

## Översikt

Systemet ger dig möjlighet att:
- **Hantera användare i bulk** - Importera hundratals användare från CSV-filer
- **Hierarkiska rättigheter** - Olika administratörer kan hantera specifika avdelningar och deras barn-noder
- **Automatisk rolltilldelning** - Systemet tilldelar roller automatiskt baserat på organisationsnivå
- **Avdelningshantering** - Organisera användare i avdelningar med hierarkiska strukturer
- **Audit-loggar** - Spåra alla användaraktiviteter för säkerhet och compliance

## Installation

### 1. Databas Setup

Kör SQL-skriptet för att sätta upp databasen:

```sql
-- Kör detta i din Supabase SQL editor
\i supabase/setup_user_management.sql
```

### 2. Frontend Integration

Systemet är redan integrerat i din befintliga applikation. Följande filer har lagts till:

- `js/user-management.js` - Kärnfunktionalitet för användarhantering
- `js/user-interface.js` - Användargränssnitt för administration
- `css/user-management.css` - Styling för användarhantering
- `templates/user_import_template.csv` - Mall för bulk-import

### 3. Aktivering

Systemet aktiveras automatiskt när du klickar på "Users"-knappen i huvudapplikationen.

## Användarroller

### Rollhierarki

1. **Superadministratör** (level 1)
   - Fullständig åtkomst till allt
   - Kan hantera alla organisationer
   - Kan skapa och ta bort användare
   - Kan hantera alla noder och rättigheter

2. **Organisationsadministratör** (level 1-2)
   - Kan hantera alla användare i sin organisation
   - Kan skapa och ta bort användare
   - Kan hantera alla noder i organisationen
   - Kan bulk-importera användare

3. **Avdelningsadministratör** (level 3-4)
   - Kan hantera användare i sin avdelning
   - Kan hantera noder i sin avdelning och dess barn
   - Kan skapa nya noder i sin avdelning
   - Kan inte ta bort noder

4. **Teamledare** (level 4-5)
   - Kan hantera användare i sitt team
   - Kan hantera noder i sitt team
   - Kan inte skapa eller ta bort noder

5. **Medlem** (level 5+)
   - Kan endast visa information
   - Ingen redigeringsåtkomst

### Automatisk Rolltilldelning

Systemet tilldelar roller automatiskt baserat på organisationsnivå:

```javascript
// Automatisk rolltilldelning baserat på nivå
if (level <= 1) return 'org_admin';
if (level <= 3) return 'department_admin';
if (level <= 5) return 'team_lead';
return 'member';
```

## Bulk-Import av Användare

### CSV-format

Använd `templates/user_import_template.csv` som mall. Obligatoriska kolumner:

- `employee_id` - Unikt anställnings-ID
- `email` - E-postadress (måste vara unik)
- `first_name` - Förnamn
- `last_name` - Efternamn

Valfria kolumner:

- `department_code` - Avdelningskod (måste existera i databasen)
- `position` - Position/titel
- `level` - Organisationsnivå (1-10, standard: 5)
- `role` - Specifik roll (lämnas tom för auto-tilldelning)
- `manager_employee_id` - Chefens anställnings-ID
- `phone` - Telefonnummer
- `start_date` - Anställningsdatum
- `contract_type` - Anställningstyp

### Import Process

1. **Förbered CSV-fil**
   - Använd mallen som utgångspunkt
   - Kontrollera att alla obligatoriska fält är ifyllda
   - Kontrollera att avdelningskoder existerar

2. **Starta Import**
   - Klicka på "Users"-knappen
   - Gå till "Import"-fliken
   - Dra och släpp CSV-filen eller klicka för att välja
   - Välj standardlösenord för nya användare
   - Klicka "Starta import"

3. **Övervaka Progress**
   - Systemet visar real-time progress
   - Du kan se antal framgångsrika och misslyckade imports
   - Fel visas med detaljerad information

### Import Tips

- **Batch-storlek**: Systemet bearbetar 50 användare åt gången för optimal prestanda
- **Felhantering**: Om en användare misslyckas, fortsätter systemet med resten
- **Duplicat**: Systemet förhindrar duplicerade e-postadresser och anställnings-ID:n
- **Lösenord**: Alla nya användare får samma standardlösenord (kan ändras senare)

## Hierarkiska Nodrättigheter

### Rättighetstyper

- **view** - Kan endast visa noden
- **edit** - Kan redigera noden
- **admin** - Fullständig kontroll över noden

### Rättighetsnedärvning

- Rättigheter kan ärvas från föräldranoder
- Om en användare har rättigheter till en nod, kan dessa gälla för barn-noder också
- Specifika rättigheter på en nod överrider ärvda rättigheter

### Exempel på Rättighetsstruktur

```
Organisation (org_admin: admin)
├── HR-avdelning (department_admin: edit)
│   ├── Rekrytering (team_lead: edit)
│   └── Utbildning (team_lead: edit)
├── IT-avdelning (department_admin: edit)
│   ├── Utveckling (team_lead: edit)
│   └── Support (team_lead: edit)
```

## Avdelningshantering

### Skapa Avdelningar

1. Gå till "Avdelningar"-fliken
2. Klicka "Lägg till avdelning"
3. Fyll i:
   - Namn
   - Kod (kort identifierare)
   - Beskrivning
   - Föräldraavdelning (valfritt)

### Avdelningskoder

Använd korta, beskrivande koder:
- `EXEC` - Executive Leadership
- `HR` - Human Resources
- `IT` - Information Technology
- `FIN` - Finance
- `MKT` - Marketing
- `OPS` - Operations

## Säkerhet och Audit

### Aktivitetsloggar

Systemet loggar automatiskt:
- Inloggningar och utloggningar
- Användarhantering (skapande, redigering, borttagning)
- Nodrättighetsändringar
- Bulk-import aktiviteter

### Sessionhantering

- Automatisk sessionförnyelse
- Sessioner löper ut efter 24 timmar
- Säker token-baserad autentisering

### Lösenordshantering

- Lösenord hashas med SHA-256
- Standardlösenord för nya användare
- Användare kan ändra sina lösenord

## API och Integration

### JavaScript API

```javascript
// Hämta användare
const users = await userManager.getUsers({
  department_id: 'dept-uuid',
  role: 'member',
  is_active: true
});

// Skapa användare
const result = await userManager.createUser({
  employee_id: 'EMP123',
  email: 'user@company.com',
  name: 'John Doe',
  // ... andra fält
});

// Bulk-import
const result = await userManager.bulkImportUsers(file, {
  defaultPassword: 'temp123',
  sendWelcomeEmail: true
});

// Tilldela nodrättigheter
await userManager.assignNodePermission(userId, nodeId, 'edit', {
  includeChildren: true,
  canManageChildren: false
});
```

### Database Functions

```sql
-- Hämta användarrättigheter för en nod
SELECT get_user_node_permissions('user-uuid', 'node-id', 'org-id');

-- Skapa användare
SELECT create_user(
  'EMP123',
  'user@company.com',
  'John Doe',
  'John',
  'Doe',
  'hashed-password',
  'org-id',
  'dept-uuid',
  'Developer',
  5,
  'member'
);

-- Bulk-skapande av användare
SELECT bulk_create_users(
  'org-id',
  'admin-user-uuid',
  '[{"employee_id": "EMP123", ...}]'::jsonb
);
```

## Felsökning

### Vanliga Problem

1. **Import misslyckas**
   - Kontrollera CSV-format
   - Verifiera att avdelningskoder existerar
   - Kontrollera att e-postadresser är unika

2. **Rättighetsproblem**
   - Kontrollera användarroll
   - Verifiera nodrättigheter
   - Kontrollera ärvda rättigheter

3. **Session-problem**
   - Kontrollera att sessionen inte har löpt ut
   - Rensa localStorage om nödvändigt
   - Logga in igen

### Debugging

Aktivera debug-läge i `js/config.js`:

```javascript
export const SUPABASE_CONFIG = {
  // ... andra inställningar
  debug: true
};
```

## Prestanda

### Optimeringar för Stora Organisationer

- **Indexering**: Databasen är optimerad med index för snabba sökningar
- **Batch-processing**: Bulk-import bearbetar användare i grupper om 50
- **Caching**: Användarstatistik cachas för snabbare laddning
- **Pagination**: Användarlistor pagineras för bättre prestanda

### Rekommenderade Gränser

- **Max användare per organisation**: 10,000+
- **Max bulk-import**: 1,000 användare per gång
- **Session-timeout**: 24 timmar
- **Concurrent imports**: 1 åt gången

## Support och Utveckling

### Loggar och Monitoring

Systemet loggar alla viktiga händelser. Kontrollera konsolen för fel och varningar.

### Utveckling

För att utveckla systemet vidare:

1. **Lägg till nya roller**: Uppdatera `auto_assign_role_by_level` funktionen
2. **Utöka rättigheter**: Modifiera `get_user_node_permissions` funktionen
3. **Nya import-format**: Utöka `processCSVData` funktionen
4. **UI-förbättringar**: Modifiera `user-interface.js`

### Säkerhetsuppdateringar

- Uppdatera lösenordshashing regelbundet
- Granska aktivitetsloggar för misstänkt aktivitet
- Uppdatera session-timeouts efter säkerhetsbehov

---

**Notera**: Detta system är designat för produktionsmiljöer med stora organisationer. Se till att testa alla funktioner grundligt innan du använder det i produktion.
