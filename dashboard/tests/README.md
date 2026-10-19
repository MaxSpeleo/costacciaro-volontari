# Costacciaro 2026 — collaudo browser isolato

Suite preliminare con Playwright. Tutti gli esiti sono FAIL-CLOSED: un prerequisito mancante è un fallimento, non un successo. I test non usano account reali, non inviano comunicazioni e non cambiano dati operativi.

## Esecuzione locale esplicita

Da `dashboard/`:

```bash
npm ci
npm install --no-save @playwright/test
npx playwright install chromium
npx playwright test
```

Il server di prova parte localmente e la modalità viene impostata su TEST. La pagina può richiedere l'autenticazione organizzatore: in tal caso i test delle funzionalità **falliscono** e restano NON VERIFICATI finché non si dispone di un ambiente di test autenticato e isolato. Non inserire credenziali o dati reali negli script.

Per collaudare una Preview protetta occorrono URL e sessione di test autorizzati; l'HTTP 200 della pagina non dimostra che SmartGuide funzioni.

## Ambito e limiti iniziali

- Identità della pagina: smoke tecnico
- Menu SmartGuide: asserzione DOM e clic reali
- Validazione messaggio TEST vuoto: asserzione UI
- Dispositivi: Chromium desktop e viewport smartphone

**Non verificati da questa prima suite:** assegnazione persistente dopo riapertura, ricezione messaggi, backend operativo, ruoli, confronto visuale, integrazione email/WhatsApp. Non segnare SUPERATO per nessuna di queste aree finché mancano test specifici con read-back indipendente.

Non attivare workflow GitHub Actions o browser a consumo senza verificare prima i limiti del servizio e l'autorizzazione ZERO-CREDITS. Lo sviluppo resta sul ramo WORKING.
