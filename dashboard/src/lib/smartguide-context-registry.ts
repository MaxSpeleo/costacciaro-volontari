/** SmartGuide registry: single source for every contextual guide's instructions and DOM anchors.
 * This is configuration only. Completion checks remain in the dashboard until migrated and verified.
 */
export const smartGuideContextCopy = {
    staffing: ["Scegli data e fascia", "Apri la modifica del turno e controlla il numero di persone necessarie.", "Verifica che il fabbisogno sia corretto prima di terminare."],
    priority: ["Apri il primo turno con posti scoperti", "Aggiungi volontari disponibili alla squadra, senza modificare altri turni.", "Controlla la copertura del turno selezionato."],
    people: ["Trova la squadra", "Seleziona giorno, fascia e attività.", "Controlla le persone presenti e modifica la squadra se necessario."],
    assign: ["Apri le assegnazioni suggerite", "Genera e verifica l’anteprima senza modificare le squadre.", "Conferma i nominativi solo dopo averli controllati."],
    contacts: ["Cerca il volontario", "Usa la rubrica per trovare la persona.", "Apri il contatto desiderato; non inviare comunicazioni automaticamente."],
    messages: ["Apri le comunicazioni", "Scegli a chi scrivere e componi il messaggio.", "Rileggi destinatari e testo prima dell'invio."],
    activities: ["Consulta le attività", "Individua l'attività o il sottogruppo da gestire.", "Verifica i cambiamenti prima di chiudere."],
    regia: ["Seleziona data e fascia della regia.", "Apri una delle attività visualizzate nel quadro di regia.", "Verifica la squadra del turno aperto e la sua copertura."],
    myturns: ["Apri l’elenco delle persone", "Cerca il volontario e controlla i turni assegnati.", "Verifica data, fascia e attività; per correggere torna alla gestione squadre."],
    inbox: ["Apri i messaggi ricevuti", "Leggi le comunicazioni e seleziona quelle da gestire.", "Se opportuno, segna il messaggio come letto o archivialo."],
    sent: ["Apri i messaggi inviati", "Controlla destinatari e cronologia degli invii.", "Verifica le comunicazioni prima di chiudere."],
    personal: ["Apri la vista personale", "Consulta i turni e le comunicazioni destinati al volontario.", "Per le modifiche organizzative torna alla gestione squadre."],
    preferences: ["Consulta le preferenze", "Controlla notifiche sonore, guida e modalità dati.", "Non cambiare PROVA/OPERATIVO senza verificare le conseguenze."],
    sharing: ["Apri la sezione di condivisione", "Scegli il canale e controlla il contenuto.", "Condividi soltanto dopo una verifica dei destinatari."],
    overview: ["Panoramica", "Consulta i dati riepilogativi.", "Scegli un'altra operazione quando necessario."],
  } as const;
export type SmartGuideContextChoice = keyof typeof smartGuideContextCopy;
export const smartGuideContextTargets: Record<SmartGuideContextChoice, string[]> = {
    overview: [],
    staffing: ["guide-shift", "guide-staffing-target", "guide-staffing-target"],
    priority: ["priorities-workspace", "guide-team", "guide-team"],
    people: ["guide-shift", "guide-people", "guide-team"],
    assign: ["guide-people", "guide-people", "guide-team"],
    regia: ["guide-regia-shift", "guide-regia-activities", "guide-team"],
    myturns: ["guide-people", "guide-people", "guide-team"],
    contacts: ["organizer-contacts", "organizer-contacts", "organizer-contacts"],
    messages: ["organizer-messages", "organizer-messages", "organizer-messages"],
    inbox: ["organizer-messages", "organizer-messages", "organizer-messages"],
    sent: ["organizer-messages", "organizer-messages", "organizer-messages"],
    activities: ["organizer-activities", "organizer-activities", "organizer-activities"],
    personal: ["organizer-personal", "organizer-personal", "organizer-personal"],
    preferences: ["organizer-preferences", "organizer-preferences", "organizer-preferences"],
    sharing: ["organizer-sharing", "organizer-sharing", "organizer-sharing"],
  };
export function smartGuideContextAnchor(choice: SmartGuideContextChoice, step: number): string | null {
  return smartGuideContextTargets[choice]?.[step] || null;
}

/** Shared contextual-guide progression guard. A missing target or unmet prerequisite blocks advancement. */
export function smartGuideContextCanAdvance(
  choice: SmartGuideContextChoice,
  step: number,
  state: { targetAvailable: boolean; priorityAvailable: boolean; regiaOpened: boolean; proposalReady: boolean; proposalConfirmed: boolean; peopleDone: boolean; priorityCovered: boolean; staffingDone: boolean },
): boolean {
  if (!Number.isInteger(step) || step < 0 || step >= smartGuideContextCopy[choice].length || !state.targetAvailable) return false;
  if (choice === "regia" && step >= 1 && !state.regiaOpened) return false;
  if (choice === "priority" && step === 0 && !state.priorityAvailable) return false;
  if (choice === "assign" && step === 1 && !state.proposalReady) return false;
  if (choice === "assign" && step === 2 && !state.proposalConfirmed) return false;
  if (choice === "staffing" && step > 0 && !state.staffingDone) return false;
  if (choice === "priority" && step > 0 && !state.priorityCovered) return false;
  if (choice === "people" && step > 0 && !state.peopleDone) return false;
  return true;
}

/** One navigation policy for all contextual guides. */
export function smartGuideContextTransition(
  choice: SmartGuideContextChoice,
  current: number,
  direction: "next" | "back",
  allowed: boolean,
): number | null {
  const count = smartGuideContextCopy[choice].length;
  if (!Number.isInteger(current) || current < 0 || current >= count) return null;
  if (direction === "back") return Math.max(0, current - 1);
  if (!allowed) return current;
  return current + 1 < count ? current + 1 : null;
}
