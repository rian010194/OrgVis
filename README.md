Organisationsstruktur – Interaktiv Prototyp

Ett webbaserat visualiseringsverktyg för att visa, utforska och administrera en organisationsstruktur.
Systemet kombinerar trädvy, kartvy (D3.js) och adminfunktioner för redigering av noder och relationer.

🧱 Projektstruktur
Organisation/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── data.js          # Hanterar laddning, lagring och indexering av org-data
│   ├── map.js           # D3.js-baserad kartvy för att visualisera hierarkin
│   └── ui.js            # UI-logik, event-hantering och adminpanel
├── mock/
│   └── org.json         # Exempeldata över organisationens noder och relationer
├── img/
│   └── logo.png
└── Dokumentation.pptx   # Referensmaterial och presentationsunderlag

⚙️ Funktioner
Trädvy
Visar organisationens hierarki utifrån org.json.
Klick på nod öppnar en detaljpanel med mer information.

Kartvy
Bygger samma struktur med D3.js.
Dynamisk layout med zoom och panorering.
Expanderbara nivåer.

Detaljpanel
Visar information om vald nod (roll, ansvar, relationer).
Dynamiskt genererad via ui.js.

Adminläge
Lägg till, redigera och ta bort noder direkt i UI.
Möjlighet att justera relationer (Inputs/Outputs).
Ändringar sparas lokalt under sessionen.

📦 Dataformat (mock/org.json)
{
  "id": "coo",
  "name": "COO",
  "type": "Individual",
  "role": "Ansvarar för drift och kvalitet inom organisationen.",
  "parent": "leadership_team",
  "children": ["operations_unit", "it_unit"],
  "inputs": [{"from": "safety_department", "desc": "Incidentrapporter"}],
  "outputs": [{"to": "operations_unit", "desc": "Operativa prioriteringar"}]
}

🧩 Teknikstack
HTML5 / CSS3 / JavaScript (ES6)
D3.js v7 – för dynamisk visualisering av organisationsstrukturen

Modulär kodstruktur med separata komponenter:
OrgStore (datahantering)
OrgMap (visualisering)
OrgUI (användargränssnitt)

Mock-data används som grund för framtida API-integration.

🚀 Så här startar du
Klona eller ladda ned projektet.
Öppna index.html i webbläsaren.
Växla mellan trädvy och kartvy via knapparna i toppmenyn.
Aktivera admin-läge för att redigera noder.

💡 Tips: Använd en lokal utvecklingsserver (t.ex. VS Code Live Server) om du får CORS-fel vid laddning av JSON-data.

🛠️ Vidareutveckling
Koppla till backend-API för att spara ändringar permanent
Förbättra textkodning och teckenhantering (UTF-8)
Lägg till sökfunktion, filtrering och export
Utöka D3-layout med animationer, rak linjedragning och responsivitet
Vill du att jag sparar den här texten som en färdig README.md-fil som du kan lägga till i projektet?
