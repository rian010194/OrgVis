# TODO Workflow Guide

## Hur du tar på dig en uppgift

### 1. Välj en uppgift
- Kolla `todo.txt` för tillgängliga uppgifter
- Välj en med status `TODO` och `UNASSIGNED`
- Kontrollera att ingen annan jobbar på samma sak

### 2. Ta på dig uppgiften
```markdown
[ ] Din uppgift här
    Status: IN_PROGRESS
    Priority: HIGH/MEDIUM/LOW
    Assignee: [DITT NAMN]
    Notes: Vad du planerar att göra
```

### 3. Jobba på uppgiften
- Uppdatera `Notes` med framsteg eller problem
- Committa ofta med beskrivande meddelanden
- Pusha regelbundet för att undvika konflikter

### 4. När du är klar
```markdown
[x] Din uppgift här
    Status: REVIEW
    Priority: HIGH/MEDIUM/LOW
    Assignee: [DITT NAMN]
    Notes: Vad som gjordes
    Completed: YYYY-MM-DD
```

### 5. Efter review
```markdown
[x] Din uppgift här
    Status: DONE
    Priority: HIGH/MEDIUM/LOW
    Assignee: [DITT NAMN]
    Notes: Vad som gjordes
    Completed: YYYY-MM-DD
```

## Viktiga regler

### ✅ Gör så här:
- Uppdatera `todo.txt` innan du börjar jobba
- Committa och pusha ofta
- Lägg till detaljerade commit-meddelanden
- Uppdatera status regelbundet

### ❌ Undvik:
- Jobba på samma uppgift som någon annan
- Glömma att uppdatera status
- Låta uppgifter ligga i `IN_PROGRESS` för länge
- Committa stora ändringar utan att pusha

## Status förklaring

- **TODO**: Uppgift är redo att tas på sig
- **IN_PROGRESS**: Någon jobbar aktivt på uppgiften
- **REVIEW**: Uppgift är klar, väntar på granskning
- **DONE**: Uppgift är färdig och godkänd

## Prioritering

- **HIGH**: Måste göras snart, blockerar andra uppgifter
- **MEDIUM**: Viktigt men inte akut
- **LOW**: Kan vänta, nice-to-have features

## Exempel på bra commit-meddelanden

```
feat: Add piechart naming functionality
fix: Resolve Y-axis scaling issue in bar charts
style: Improve tree view compactness
docs: Update README with new features
```

## När du stöter på problem

1. Uppdatera `Notes` med problemet
2. Ändra status till `TODO` om du inte kan fortsätta
3. Lägg till `BLOCKED` i notes om något blockerar
4. Kontakta teamet om du behöver hjälp
