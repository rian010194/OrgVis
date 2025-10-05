# JumpYard Organization Chart - Supabase Backend

Detta projekt använder Supabase som backend för att hantera organisationsdata, metrics och relationer.

## Setup Instructions

### 1. Installera Supabase CLI

```bash
npm install -g supabase
```

### 2. Logga in på Supabase

```bash
supabase login
```

### 3. Starta lokal utveckling

```bash
# Starta Supabase lokalt
supabase start

# Kör migrations
supabase db push

# Seed databasen med testdata
supabase db seed
```

### 4. Konfigurera Frontend

1. Gå till [Supabase Dashboard](https://supabase.com/dashboard)
2. Skapa ett nytt projekt
3. Kopiera din project URL och anon key
4. Uppdatera `js/supabase.js` med dina credentials:

```javascript
const SUPABASE_URL = 'https://your-project-ref.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### 5. Deploya till Production

```bash
# Länka till ditt Supabase projekt
supabase link --project-ref your-project-ref

# Deploya migrations
supabase db push

# Deploya Edge Functions (om du har några)
supabase functions deploy
```

## Databas Schema

### Nodes Table
- `id` (TEXT, PRIMARY KEY) - Unik identifierare för noden
- `name` (TEXT) - Namn på noden
- `type` (TEXT) - Typ av nod (Unit, Group, Department, etc.)
- `role` (TEXT) - Rollbeskrivning
- `parent_id` (TEXT, FOREIGN KEY) - Referens till parent-nod
- `support_office_id` (TEXT) - Referens till support office
- `responsibilities` (JSONB) - Array av ansvarsområden
- `outcomes` (JSONB) - Array av deliverables
- `created_at` (TIMESTAMP) - Skapad datum
- `updated_at` (TIMESTAMP) - Uppdaterad datum

### Metrics Table
- `id` (UUID, PRIMARY KEY) - Unik identifierare
- `node_id` (TEXT, FOREIGN KEY) - Referens till nod
- `name` (TEXT) - Namn på metric
- `type` (TEXT) - Typ av visualisering (pie, bar, line, table)
- `unit` (TEXT) - Enhet för metric
- `data` (JSONB) - Metric data
- `created_at` (TIMESTAMP) - Skapad datum
- `updated_at` (TIMESTAMP) - Uppdaterad datum

### Relations Table
- `id` (UUID, PRIMARY KEY) - Unik identifierare
- `from_node_id` (TEXT, FOREIGN KEY) - Från-nod
- `to_node_id` (TEXT, FOREIGN KEY) - Till-nod
- `description` (TEXT) - Beskrivning av relationen
- `created_at` (TIMESTAMP) - Skapad datum
- `updated_at` (TIMESTAMP) - Uppdaterad datum

## API Endpoints

Supabase genererar automatiskt REST API endpoints:

### Nodes
- `GET /rest/v1/nodes` - Hämta alla noder
- `GET /rest/v1/nodes?id=eq.{id}` - Hämta specifik nod
- `POST /rest/v1/nodes` - Skapa ny nod
- `PATCH /rest/v1/nodes?id=eq.{id}` - Uppdatera nod
- `DELETE /rest/v1/nodes?id=eq.{id}` - Ta bort nod

### Metrics
- `GET /rest/v1/metrics?node_id=eq.{nodeId}` - Hämta metrics för nod
- `POST /rest/v1/metrics` - Skapa ny metric
- `PATCH /rest/v1/metrics?id=eq.{metricId}` - Uppdatera metric
- `DELETE /rest/v1/metrics?id=eq.{metricId}` - Ta bort metric

### Relations
- `GET /rest/v1/relations` - Hämta alla relationer
- `POST /rest/v1/relations` - Skapa ny relation
- `DELETE /rest/v1/relations?from_node_id=eq.{fromId}&to_node_id=eq.{toId}` - Ta bort relation

## Real-time Features

Supabase stöder real-time subscriptions för live uppdateringar:

```javascript
// Prenumerera på nod-ändringar
const subscription = supabase
  .channel('nodes_changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'nodes' }, 
    (payload) => {
      console.log('Node changed:', payload);
    }
  )
  .subscribe();
```

## Säkerhet

- Row Level Security (RLS) är aktiverat på alla tabeller
- För närvarande tillåter policies alla operationer (kan begränsas senare)
- Autentisering kan läggas till när det behövs

## Utveckling

### Lägga till nya migrations

```bash
# Skapa ny migration
supabase migration new add_new_feature

# Redigera migration-filen i supabase/migrations/
# Kör migration
supabase db push
```

### Lägga till Edge Functions

```bash
# Skapa ny function
supabase functions new my-function

# Deploya function
supabase functions deploy my-function
```

## Troubleshooting

### Vanliga problem

1. **Connection issues**: Kontrollera att SUPABASE_URL och SUPABASE_ANON_KEY är korrekt konfigurerade
2. **CORS errors**: Lägg till din frontend URL i Supabase dashboard under Settings > API
3. **RLS errors**: Kontrollera att policies är korrekt konfigurerade

### Loggar

```bash
# Visa Supabase logs
supabase logs

# Visa specifika logs
supabase logs --type api
supabase logs --type db
```
