# UI/UX Förbättringsförslag

Detta dokument innehåller förslag på förbättringar av användargränssnittet och användarupplevelsen för Organization Chart-applikationen. Förslagen är baserade på analys av nuvarande kodbas och moderna UI/UX-principer.

---

## 1. Loading States & Feedback

### Nuvarande situation
- Begränsad feedback vid datahämtning och åtgärder
- Ingen visuell indikation när systemet bearbetar användaråtgärder

### Förbättringsförslag

#### 1.1 Loading Indicators
- **Skeleton screens** vid initial datahämtning (tree/map view)
- **Spinner eller progress bar** vid längre operationer (t.ex. Supabase-synkronisering)
- **Button loading states** - visa spinner i knappar medan åtgärder pågår
  - Specifikt för: "Save Theme", "Create Node", "Add Metric"
- **Inline loading states** i detail panel när node data laddas

#### 1.2 Operation Feedback
- **Toast notifications** för framgångsrika åtgärder:
  - "Theme saved successfully"
  - "Node created"
  - "Metric added"
- **Error toast notifications** med tydliga felmeddelanden
- **Progress indicators** för bulk-operationer (CSV import, bulk edit)

#### 1.3 Status Messages
- Förbättra `appStatus` meddelanden med:
  - Typ-indikatorer (success, error, warning, info)
  - Auto-dismiss efter 3-5 sekunder (utom errors)
  - Dismissible med "×"-knapp
  - Färgkodning: grönt (success), rött (error), gult (warning), blått (info)

---

## 2. Animationer & Transitions

### Nuvarande situation
- Vissa transitions finns (user-panel slide-in, hover effects)
- Brist på mikroanimationer och smooth transitions mellan vyer

### Förbättringsförslag

#### 2.1 View Transitions
- **Fade/slide transitions** när man växlar mellan Tree och Map view
- **Smooth panel animations** för detail panel när den öppnas/stängs
- **Stagger animations** när nodes renderas i tree view (cascading effect)

#### 2.2 Mikroanimationer
- **Button press feedback** - scale down vid klick, scale up vid release
- **Hover transitions** på alla interaktiva element (0.2-0.3s ease)
- **Node selection animation** - pulse eller scale effect när node väljs
- **Chart animations** - animate in pie charts och bar charts med D3 transitions
- **Form field focus** - smooth highlight när fält får fokus

#### 2.3 Page Transitions
- **Landing page → Main app** - fade out/in eller slide transition
- **Modal animations** - scale + fade när modaler öppnas/stängs

---

## 3. Interaktivitet & Responsivitet

### Nuvarande situation
- Hover effects finns men kan förbättras
- Keyboard navigation är begränsad
- Touch interactions på mobil kan optimeras

### Förbättringsförslag

#### 3.1 Hover States
- **Tydligare hover indicators** på alla clickable elements
- **Tooltips** på ikoner och knappar utan textlabels
- **Preview on hover** - visa kort node info i tooltip innan klick

#### 3.2 Keyboard Navigation
- **Tab navigation** genom hela interface
- **Keyboard shortcuts**:
  - `Escape` - stäng alla paneler/modaler
  - `Enter` - bekräfta formulär
  - `Arrow keys` - navigera i tree view
  - `M` - växla till Map view
  - `T` - växla till Tree view
  - `A` - toggle Admin mode
  - `?` - visa shortcuts overlay

#### 3.3 Touch Optimizations
- **Larger touch targets** (minimum 44x44px) för mobil
- **Swipe gestures**:
  - Swipe left på detail panel för att stänga
  - Swipe right för att öppna admin panel
- **Pull-to-refresh** på tree/map view
- **Pinch-to-zoom** på map view (redan implementerat via D3 zoom)

---

## 4. Visual Hierarchy & Spacing

### Nuvarande situation
- Layout är funktionell men kan ha mer visuell struktur
- Spacing är konsistent men kan förbättras för läsbarhet

### Förbättringsförslag

#### 4.1 Typography Scale
- **Tydligare heading hierarchy**:
  - H1: 2.5rem (landing title, org title)
  - H2: 2rem (section headers)
  - H3: 1.5rem (subsection headers)
  - H4: 1.25rem (card titles)
- **Line height optimization** (1.5-1.6 för body text)
- **Letter spacing** för headings (tracking: 0.02em)

#### 4.2 Spacing System
- Implementera konsistent spacing scale:
  - 0.25rem (4px) - tight
  - 0.5rem (8px) - compact
  - 1rem (16px) - normal
  - 1.5rem (24px) - relaxed
  - 2rem (32px) - spacious
- **Card padding** - konsistent 1.5rem för alla cards
- **Section spacing** - 2-3rem mellan större sektioner

#### 4.3 Visual Grouping
- **Card shadows** - subtila shadows för depth (0 2px 8px rgba(0,0,0,0.1))
- **Border radius consistency** - använd samma radius (8-12px) överallt
- **Background variations** - subtila skillnader mellan sections
- **Separators** - subtila divider lines mellan relaterade sections

---

## 5. Form & Input Improvements

### Nuvarande situation
- Formulär är funktionella men kan ha bättre UX
- Begränsad validation feedback

### Förbättringsförslag

#### 5.1 Input States
- **Clear focus states** - tydlig border color och shadow vid fokus
- **Error states** - röd border + error message under fält
- **Success states** - grön checkmark för validerade fält
- **Disabled states** - tydlig visuell skillnad (opacity 0.6, cursor not-allowed)

#### 5.2 Form Validation
- **Real-time validation** - visa felmeddelanden medan användaren skriver
- **Field-level error messages** - tydliga, kontextuella felmeddelanden
- **Required field indicators** - asterisk (*) eller badge
- **Character counters** för textarea-fält (t.ex. Description)

#### 5.3 Input Enhancements
- **Autocomplete suggestions** i node select dropdowns
- **Search/filter** i långa dropdown-listor
- **Multi-select** för vissa fält (t.ex. Support Offices)
- **Date pickers** för framtida date-fält
- **File upload improvements** - drag & drop, preview, progress

---

## 6. Detail Panel Enhancements

### Nuvarande situation
- Detail panel visar information men kan ha bättre organisation

### Förbättringsförslag

#### 6.1 Content Organization
- **Tabs eller accordion** för att organisera information (Info, Metrics, Relations, Users)
- **Sticky header** när panel scrollar (för att behålla node name visible)
- **Breadcrumbs** för att visa hierarki: Root > Department > Team > Node
- **Quick actions toolbar** - pin, export, share, edit (om admin)

#### 6.2 Information Display
- **Expandable sections** för långa listor (Responsibilities, Activities, Outcomes)
- **Metrics cards** - förbättra visuell presentation av metrics med icons
- **Relations visualization** - mini-graph eller diagram för relations
- **Empty states** - när ingen data finns, visa hjälpsam guide text

#### 6.3 Navigation
- **Previous/Next node buttons** - navigera mellan nodes i samma nivå
- **Jump to parent** button
- **Related nodes** section - visa siblings och children

---

## 7. Tree & Map View Improvements

### Nuvarande situation
- Tree och Map views är funktionella men kan ha bättre UX

### Förbättringsförslag

#### 7.1 Tree View
- **Search/filter bar** för att snabbt hitta nodes
- **Expand/collapse all** button
- **Highlight search results** med fade-in animation
- **Breadcrumb trail** ovanför tree som visar current path
- **Node icons** baserat på type (Department, Individual, etc.)
- **Selected node highlight** - tydligare visuell indikation

#### 7.2 Map View
- **Legend** för att förklara node colors och link types
- **Mini-map overview** i hörnet för navigation
- **Zoom controls** (+/- buttons) som komplement till scroll zoom
- **Reset view button** - snabb återställning till default zoom/pan
- **Node clusters** för stora datasets (group nearby nodes)
- **Link labels** på hover - visa relation description

#### 7.3 View Controls
- **View switcher improvements** - smooth transition, loading state
- **Layout options** (hierarchical, radial, force-directed variants)
- **Filter toggles** - visa/dölj specific node types eller relations

---

## 8. Admin Panel Enhancements

### Nuvarande situation
- Admin panel är funktionell men kan ha bättre workflow

### Förbättringsförslag

#### 8.1 Form Improvements
- **Auto-save draft** - spara utkast automatiskt till localStorage
- **Form validation** innan submit
- **Bulk operations** - välj flera nodes för bulk edit
- **Undo/Redo** för node edits
- **Confirmation dialogs** för destructive actions (delete node)

#### 8.2 Node Creation Workflow
- **Step-by-step wizard** för komplexa nodes (med progress indicator)
- **Template selector** - fördefinierade node templates
- **Duplicate node** - kopiera befintlig node som startpunkt
- **Suggestions** - föreslå parent baserat på context

#### 8.3 Metrics Management
- **Drag-and-drop reordering** av metrics
- **Bulk edit metrics** - edit multiple metrics samtidigt
- **Import/export metrics** - JSON eller CSV format
- **Metric templates** - fördefinierade metric sets

---

## 9. Theme Editor Improvements

### Nuvarande situation
- Theme editor har live preview men kan ha bättre UX

### Förbättringsförslag

#### 9.1 Visual Improvements
- **Color picker enhancements** - bättre color picker UI (HSV wheel)
- **Contrast checker** - varna om låg kontrast mellan text och bakgrund
- **Accessibility warnings** - markera färgkombinationer som inte är WCAG compliant
- **Preview area expansion** - större preview för bättre bedömning

#### 9.2 Preset Management
- **Save custom presets** - spara användardefinierade themes som presets
- **Preset preview thumbnails** - visuella previews av presets
- **Import/export themes** - dela themes mellan organisationer
- **Theme versioning** - spara theme history, möjlighet att återställa

#### 9.3 Real-time Preview
- **Split view** - visa theme editor och main app side-by-side
- **Apply to preview** button - testa theme innan save
- **Reset changes** button - återställ till last saved theme

---

## 10. Mobile Experience

### Nuvarande situation
- Mobile support finns men kan optimeras ytterligare

### Förbättringsförslag

#### 10.1 Layout Adaptations
- **Bottom navigation bar** för primära actions (Tree, Map, Search, Admin)
- **Collapsible sections** - collapse detail panel till card när stängd
- **Swipeable tabs** - swipe mellan admin tabs
- **Floating action button (FAB)** för primary action (create node, etc.)

#### 10.2 Touch Optimizations
- **Long press context menu** - context actions på long press
- **Swipe actions** - swipe left/right på nodes för quick actions
- **Pull-down refresh** för data sync
- **Haptic feedback** vid viktiga actions (om stöds av enhet)

#### 10.3 Performance
- **Lazy loading** - ladda endast synliga nodes i tree view
- **Virtual scrolling** för stora listor
- **Image optimization** - responsive images, lazy loading av logos

---

## 11. Accessibility (A11y)

### Nuvarande situation
- Grundläggande accessibility finns men kan förbättras

### Förbättringsförslag

#### 11.1 ARIA Labels
- **Comprehensive ARIA labels** på alla interactive elements
- **ARIA live regions** för dynamic content updates
- **Role attributes** - correct roles på alla elements
- **State indicators** - aria-expanded, aria-selected, etc.

#### 11.2 Screen Reader Support
- **Alt text** för alla images och icons
- **Descriptive link text** - undvik "click here"
- **Skip links** - hoppa till main content
- **Focus management** - säkerställ synlig focus indicator

#### 11.3 Keyboard Navigation
- **Full keyboard support** - alla functions ska vara keyboard accessible
- **Focus trapping** i modals - tab cycle inom modal
- **Focus restoration** - återställ focus efter modal close

#### 11.4 Visual Accessibility
- **High contrast mode** - alternativ high contrast theme
- **Font size controls** - användarkontrollerad text size
- **Color blind friendly** - säkerställ att information inte bara är färg-kodad

---

## 12. Search & Filtering

### Nuvarande situation
- Begränsad search functionality

### Förbättringsförslag

#### 12.1 Global Search
- **Search bar i header** - sök i alla nodes, relations, metrics
- **Search suggestions** - autocomplete medan användaren skriver
- **Search history** - spara recent searches
- **Advanced search** - filter efter type, metrics, relations

#### 12.2 Filter System
- **Quick filters** - toggle buttons för common filters (type, department)
- **Filter chips** - visuella chips för aktiva filters med remove
- **Filter presets** - spara och namnge filter combinations
- **Clear all filters** button

#### 12.3 Results Display
- **Search results panel** - dedikerad panel med resultat
- **Highlight matches** - markera matchande text i results
- **Result preview** - visa kort info om node i resultat
- **Jump to result** - smooth scroll/focus till selected result

---

## 13. Error Handling & Recovery

### Nuvarande situation
- Basic error handling finns men kan förbättras

### Förbättringsförslag

#### 13.1 Error Messages
- **User-friendly messages** - undvik tekniska felmeddelanden
- **Actionable suggestions** - ge förslag på vad användaren kan göra
- **Error recovery options** - "Try again", "Contact support", etc.
- **Error categorization** - network errors, validation errors, etc.

#### 13.2 Offline Support
- **Offline indicator** - visa när användaren är offline
- **Queue actions** - spara actions när offline, sync när online
- **Offline data access** - tillåt visning av cached data
- **Connection status** - visuell indikation av connection state

#### 13.3 Error Boundaries
- **Graceful degradation** - om en feature failar, visa fallback
- **Partial failure handling** - om en del av data inte laddas, visa resten
- **Retry mechanisms** - auto-retry med exponential backoff

---

## 14. Onboarding & Help

### Nuvarande situation
- Begränsad onboarding och hjälp

### Förbättringsförslag

#### 14.1 Onboarding
- **Welcome tour** - guide new users genom huvudfeatures
- **Interactive tutorials** - step-by-step guides med highlights
- **Feature discovery** - tooltips för nya features
- **Skip option** - låt erfarna användare hoppa över onboarding

#### 14.2 Help System
- **Contextual help** - "?" icons som öppnar relevanta help sections
- **Help overlay** - F1 öppnar help modal
- **Video tutorials** - embedded tutorials för complex features
- **FAQ section** - vanliga frågor och svar

#### 14.3 Documentation
- **In-app documentation** - länk till fullständig dokumentation
- **Keyboard shortcuts cheat sheet** - overlay med alla shortcuts
- **Feature tips** - periodiska tips om features användaren inte använt

---

## 15. Performance & Optimization

### Nuvarande situation
- Performance är ok men kan optimeras

### Förbättringsförslag

#### 15.1 Rendering Optimization
- **Virtual scrolling** för tree view med många nodes
- **Lazy loading** - ladda endast synliga nodes
- **Debounce/throttle** - optimera resize handlers och scroll events
- **Canvas/WebGL** för very large datasets (fallback från SVG)

#### 15.2 Data Optimization
- **Pagination** för stora listor
- **Incremental loading** - ladda data progressivt
- **Caching strategy** - cache frequently accessed data
- **Compression** - compress data över nätverket

#### 15.3 User Experience
- **Optimistic updates** - uppdatera UI innan server response
- **Skeleton screens** - visa placeholder content medan data laddas
- **Progressive enhancement** - core features fungerar även utan JavaScript

---

## Prioriteringsrekommendationer

### Högt Prioritet (Quick Wins)
1. Loading states för knappar och operations
2. Toast notifications för feedback
3. Förbättrade hover states och tooltips
4. Keyboard shortcuts
5. Error messages med actionable suggestions

### Medium Prioritet (Significant Impact)
1. Search och filter system
2. Detail panel organisation med tabs/accordion
3. Form validation och error states
4. Mobile optimizations (swipe gestures, FAB)
5. Theme editor improvements (preset saving, contrast checker)

### Lägsta Prioritet (Nice to Have)
1. Advanced animations
2. Onboarding tour
3. Keyboard shortcuts cheat sheet
4. Help system overlay
5. Virtual scrolling (om performance kräver det)

---

## Implementation Notes

- **Incremental rollout** - implementera förbättringar stegvis, testa efter varje steg
- **User testing** - få feedback från användare innan stora ändringar
- **A/B testing** - testa olika approaches för större changes
- **Performance monitoring** - mät performance innan och efter ändringar
- **Accessibility testing** - testa med screen readers och keyboard navigation

---

## Tekniska Implementation Tips

### CSS Variables för Consistency
```css
:root {
  --transition-fast: 0.15s ease;
  --transition-normal: 0.3s ease;
  --transition-slow: 0.5s ease;
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}
```

### Toast Notification System
Skapa en reusable toast component som kan användas överallt:
- Success toast (grön)
- Error toast (röd)
- Warning toast (gul)
- Info toast (blå)

### Keyboard Shortcuts Handler
Implementera central keyboard handler som mappar shortcuts till actions.

---

*Dokument skapat: 2025-01-XX*
*Baserat på kodanalys av: index.html, css/style.css, css/layout.css, css/detail-panel.css, js/ui.js, js/app.js, js/map.js*




