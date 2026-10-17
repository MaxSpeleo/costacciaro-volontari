# Costacciaro 2026 — censimento operazioni dashboard organizzatori
Stato: inventario statico da `dashboard/src/routes/organizzatori.tsx`, ramo WORKING TEST, 17/10/2026. Non equivale a collaudo browser o verifica dei permessi backend.

## Operazioni rilevate
| Gruppo | Azioni visibili o previste nel codice | Guida attuale |
|---|---|---|
| Accesso e profilo | verifica accesso organizzatore, cambio profilo, accesso vista volontario | non guidata |
| Modalità dati | selezione PROVA/OPERATIVO, ripristino PROVA, avviso introduttivo | non guidata; test isolamento necessario |
| Panoramica | riepilogo copertura, navigazione alle sezioni, ritorno in alto | navigazione semplice |
| Priorità | vedere posti scoperti, nuove comunicazioni, conferme in attesa, aprire turno critico | guida introduttiva |
| Regia | controllo turno, situazione squadre e fabbisogno | guida introduttiva |
| Configurazione turno | scegliere data, fascia, attività, cambiare fabbisogno | guida introduttiva |
| Squadre | selezione squadra, aggiunta/rimozione membri, spostamento con conferma conflitti, modifica impostazioni, fissaggio squadra | assegnazione guidata completa 4 fasi; altre modifiche solo introduttive |
| Assegnazioni suggerite | generare proposta, visualizzare anteprima, confermare o annullare | guida introduttiva |
| Elenco volontari | cercare, filtrare, controllare disponibilità, consultare turni individuali | guida introduttiva |
| Rubrica | cercare contatti, scegliere persona, telefono/email/WhatsApp | guida introduttiva |
| Comunicazioni | nuovo messaggio, destinatari, modelli predefiniti, invio, consultare inviati/ricevuti, segnare letto, archiviare, risposte | guida introduttiva; nessun invio automatico da guida |
| Catalogo attività | selezione macro/sottogruppi, aggiungere, rinominare o eliminare | guida introduttiva |
| Condivisione | generare/salvare file, email, WhatsApp, condividi testo | non guidata |
| Preferenze e assistenza | attivare/disattivare notifiche sonore, aprire spiegazioni contestuali ?, mostrare/nascondere guida | spiegazioni puntuali |
| Vista personale | «Il mio Costacciaro», consultazione propria situazione/messaggi | navigazione, da verificare come organizzatore e come volontario |

## Gaps per il sistema «Cosa vuoi fare?»
1. Rendere accessibili dal menu anche modalità PROVA, condivisione, profilo, notifiche, gestione messaggi ricevuti e propria vista turni; non confondere azioni organizzatore con vista volontario.
2. Trasformare le guide introduttive in percorsi collegati al campo o pulsante reale, con avanzamento basato su stato e verifica del risultato, senza simulare un'operazione compiuta.
3. Assicurare una sola evidenziazione quadrata per elemento, scroll che posizioni comando e istruzione insieme, barra non coperta da scorrimenti interni.
4. Verificare separatamente autorizzazioni, conferme di spostamento, isolamento dati PROVA/OPERATIVO, persistenza e ricezione messaggi; nessuna azione distruttiva o invio senza conferma.
5. Verificare build/preview e prove PC; versione OPERATIVA protetta.

## Non confermato
Funzioni esterne a questa route, capacità dei servizi backend, dati Google Sheets, flusso mobile volontari, invii reali e permessi non sono validati da questa ispezione statica. Non dichiarare copertura completa dell'app finché le altre route e i servizi correlati non sono esaminati.
