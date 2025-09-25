// interactions.js

/**
 * interactionLibrary innehåller standardinteraktioner per roll.
 * Admin/VD kan senare lägga till fler interaktioner direkt via UI.
 */
export const interactionLibrary = {
  "VD": [
    { label: "Godkänn budget", description: "Godkänner budgeten för nästa kvartal" },
    { label: "Skicka direktiv", description: "Skickar strategiska direktiv till vice VD" }
  ],
  "Vice VD": [
    { label: "Sammanställ rapport", description: "Sammanställer rapport till VD" },
    { label: "Fördela uppgifter", description: "Delar ut arbetsuppgifter till avdelningschefer" }
  ],
  "Avdelningschef": [
    { label: "Följ upp team", description: "Kontrollerar teamets framsteg och status" },
    { label: "Rapportera till VD", description: "Rapporterar viktig information till VD" }
  ],
  "Team": [
    { label: "Lämna in uppgift", description: "Lämnar in arbetsuppgift till chef" },
    { label: "Begär feedback", description: "Ber om feedback från avdelningschef" }
  ],
  "Admin": [
    { label: "Redigera nod", description: "Kan redigera nodinformation" },
    { label: "Ta bort nod", description: "Kan ta bort en nod från organisationen" }
  ]
};

/**
 * Funktion för att dynamiskt lägga till en ny interaktion till en roll.
 * Kan anropas från UI när admin skapar en ny interaktion.
 * 
 * @param {string} role - Rollnamn
 * @param {string} label - Knapptext
 * @param {string} description - Beskrivning
 */
export function addInteraction(role, label, description) {
  if (!interactionLibrary[role]) {
    interactionLibrary[role] = [];
  }
  interactionLibrary[role].push({ label, description });
}
