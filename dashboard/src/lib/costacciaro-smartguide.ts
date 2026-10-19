/**
 * Costacciaro SmartGuide v1.0 — shared, side-effect-contained guide engine.
 * Dashboard-only: never writes volunteer application data.
 * A view change is NOT proof that a server-side mutation was persisted.
 */
export type SmartGuideCheck = () => boolean | Promise<boolean>;
export type SmartGuideOpen = () => void | Promise<void>;
export type SmartGuideStep = {
  id: string;
  title: string;
  instruction: string;
  targetId: string;
  open?: SmartGuideOpen;
  canAdvance?: SmartGuideCheck;
  requiresConfirmation?: boolean;
  confirmText?: string;
};
export type SmartGuideFlow = {
  id: string;
  title: string;
  steps: readonly SmartGuideStep[];
  /** Must read the persisted source (API/read-back), never merely React state. */
  verifySaved?: SmartGuideCheck;
};
export type SmartGuideStatus =
  | { type: "idle" }
  | { type: "ready"; flowId: string; stepIndex: number; step: SmartGuideStep }
  | { type: "blocked"; message: string }
  | { type: "awaiting-confirmation"; message: string }
  | { type: "checking-save" }
  | { type: "complete"; persisted: boolean };

export class CostacciaroSmartGuide {
  private flow: SmartGuideFlow | null = null;
  private index = -1;
  private highlighted: HTMLElement | null = null;
  private token = 0;
  private busy = false;
  private confirmed = false;
  private listener: (status: SmartGuideStatus) => void;

  constructor(listener: (status: SmartGuideStatus) => void) {
    this.listener = listener;
    this.listener({ type: "idle" });
  }
  get current() {
    return this.flow && this.index >= 0 ? this.flow.steps[this.index] : null;
  }
  get stepIndex() { return this.index; }
  private emit(status: SmartGuideStatus) { this.listener(status); }
  private clearHighlight() {
    if (this.highlighted) {
      this.highlighted.removeAttribute("data-smartguide-active");
      this.highlighted = null;
    }
  }
  private async position(step: SmartGuideStep, token: number) {
    await step.open?.();
    // The dashboard may switch tabs and render the target asynchronously.
    for (let attempt = 0; attempt < 15; attempt++) {
      if (token !== this.token) return false;
      const target = document.getElementById(step.targetId);
      if (target && target.getClientRects().length > 0) {
        this.clearHighlight();
        target.setAttribute("data-smartguide-active", "true");
        this.highlighted = target;
        target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        return true;
      }
      await new Promise<void>(resolve => window.setTimeout(resolve, 80));
    }
    return false;
  }
  async start(flow: SmartGuideFlow) {
    if (!flow.steps.length || !flow.steps.every(s => s.id && s.targetId)) {
      this.emit({ type: "blocked", message: "Percorso non configurato correttamente." });
      return false;
    }
    this.stop();
    this.flow = flow;
    this.index = 0;
    return this.focusCurrent();
  }
  private async focusCurrent() {
    const step = this.current;
    if (!step || this.busy) return false;
    this.busy = true;
    this.confirmed = false;
    const token = ++this.token;
    try {
      const found = await this.position(step, token);
      if (token !== this.token) return false;
      if (!found) {
        this.emit({ type: "blocked", message: "Comando non visibile. Apri la sezione o riprova." });
        return false;
      }
      this.emit({ type: "ready", flowId: this.flow!.id, stepIndex: this.index, step });
      return true;
    } catch {
      if (token === this.token) this.emit({ type: "blocked", message: "Impossibile aprire questa operazione." });
      return false;
    } finally { this.busy = false; }
  }
  async refocus() {
    if (!this.current) return false;
    return this.focusCurrent();
  }
  acknowledgeConfirmation() {
    this.confirmed = true;
    const step = this.current;
    if (step && this.flow)
      this.emit({ type: "ready", flowId: this.flow.id, stepIndex: this.index, step });
  }
  async next() {
    if (!this.flow || this.busy || !this.current) return false;
    const step = this.current;
    if (step.requiresConfirmation && !this.confirmed) {
      this.emit({ type: "awaiting-confirmation", message: step.confirmText ?? "Conferma questa operazione prima di proseguire." });
      return false;
    }
    if (step.canAdvance) {
      try {
        if (!await step.canAdvance()) {
          this.emit({ type: "blocked", message: "Completa il passaggio evidenziato prima di continuare." });
          return false;
        }
      } catch {
        this.emit({ type: "blocked", message: "Non è stato possibile verificare il passaggio." });
        return false;
      }
    }
    if (this.index + 1 < this.flow.steps.length) {
      this.index++;
      return this.focusCurrent();
    }
    this.clearHighlight();
    this.emit({ type: "checking-save" });
    if (!this.flow.verifySaved) {
      this.emit({ type: "complete", persisted: false });
      return true;
    }
    try {
      const persisted = await this.flow.verifySaved();
      this.emit({ type: "complete", persisted });
      return persisted;
    } catch {
      this.emit({ type: "blocked", message: "Salvataggio non verificato. Non considerare conclusa l'operazione." });
      return false;
    }
  }
  async previous() {
    if (!this.flow || this.busy || this.index <= 0) return false;
    this.index--;
    return this.focusCurrent();
  }
  stop() {
    this.token++;
    this.clearHighlight();
    this.flow = null;
    this.index = -1;
    this.confirmed = false;
    this.emit({ type: "idle" });
  }
  dispose() { this.stop(); }
}

/** Shared DOM spotlight for legacy and new dashboard flows.
 * Keeps the original amber outline and centered scrolling.
 * Returns false if the element is absent or hidden.
 */
export function focusSmartGuideTarget(id: string, attribute = "data-organizer-guide-focus"): boolean {
  document.querySelectorAll("[data-organizer-guide-focus], [data-smartguide-active]").forEach((node) => {
    const element = node as HTMLElement;
    element.style.outline = "";
    element.style.outlineOffset = "";
    element.removeAttribute("data-organizer-guide-focus");
    element.removeAttribute("data-smartguide-active");
  });
  const target = document.getElementById(id);
  if (!target || !target.getClientRects().length || target.closest(".hidden")) return false;
  target.setAttribute(attribute, "true");
  target.style.outline = "3px solid #fbbf24";
  target.style.outlineOffset = "3px";
  target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  return true;
}
