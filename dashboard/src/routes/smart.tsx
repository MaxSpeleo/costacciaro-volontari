import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  CheckCheck,
  LogIn,
  LogOut,
  Mail,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/smart")({
  component: SmartDashboard,
});

type Role = "loading" | "guest" | "organizer" | "volunteer" | "unlinked";

type Volunteer = {
  id: string;
  name: string;
  group_name: string | null;
  phone: string | null;
  email: string | null;
};

type Team = {
  id: string;
  name: string;
  day: string;
  slot: string;
  place: string;
  activity: string;
  target: number;
  member_ids: string[];
  pinned: boolean;
};

type Message = {
  id: string;
  message_type: "notice" | "direct" | "team" | "shift";
  title: string;
  body: string;
  urgent: boolean;
  target_volunteer_id: string | null;
  target_team_id: string | null;
  target_day: string | null;
  target_slot: string | null;
  target_activity: string | null;
  created_at: string;
};

const messageLabel: Record<Message["message_type"], string> = {
  notice: "Bacheca",
  direct: "Diretto",
  team: "Squadra",
  shift: "Turno",
};

function SmartDashboard() {
  const [role, setRole] = useState<Role>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(false);
  const authCallbackHandled = useRef(false);
  const [volunteerId, setVolunteerId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Volunteer | null>(null);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"turni" | "messaggi" | "persone">("turni");
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeType, setComposeType] = useState<Message["message_type"]>("notice");
  const [composeTitle, setComposeTitle] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeUrgent, setComposeUrgent] = useState(false);
  const [targetVolunteer, setTargetVolunteer] = useState("");
  const [targetTeam, setTargetTeam] = useState("");
  const [targetDay, setTargetDay] = useState("");
  const [targetSlot, setTargetSlot] = useState("");
  const [targetActivity, setTargetActivity] = useState("");

  const resolveRole = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) {
      setRole("guest");
      setVolunteerId(null);
      setProfile(null);
      return;
    }

    const organizer = await supabase
      .from("dashboard_organizers")
      .select("user_id")
      .eq("user_id", session.user.id)
      .eq("active", true)
      .maybeSingle();

    if (!organizer.error && organizer.data) {
      setRole("organizer");
      setVolunteerId(null);
      return;
    }

    const mapping = await supabase
      .from("dashboard_volunteer_accounts")
      .select("volunteer_id")
      .eq("user_id", session.user.id)
      .eq("active", true)
      .maybeSingle();

    if (!mapping.error && mapping.data?.volunteer_id) {
      setRole("volunteer");
      setVolunteerId(mapping.data.volunteer_id);
      return;
    }

    setRole("unlinked");
  }, []);

  useEffect(() => {
    async function completeAuthCallback() {
      if (authCallbackHandled.current) return;
      authCallbackHandled.current = true;

      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const type = url.searchParams.get("type");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setAuthMessage("Il link di accesso non è stato completato. Richiedi un nuovo link.");
        } else {
          if (type === "recovery") setRecoveryMode(true);
          window.history.replaceState({}, document.title, "/smart");
        }
      }

      await resolveRole();
    }

    void completeAuthCallback();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
      void resolveRole();
    });
    return () => data.subscription.unsubscribe();
  }, [resolveRole]);

  const loadData = useCallback(async () => {
    if (role !== "organizer" && role !== "volunteer") return;
    setLoadingData(true);
    setDataError("");

    try {
      const [teamResult, messageResult] = await Promise.all([
        supabase
          .from("dashboard_teams")
          .select("id,name,day,slot,place,activity,target,member_ids,pinned")
          .order("day")
          .order("slot"),
        supabase
          .from("dashboard_messages")
          .select("id,message_type,title,body,urgent,target_volunteer_id,target_team_id,target_day,target_slot,target_activity,created_at")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      if (teamResult.error) throw teamResult.error;
      if (messageResult.error) throw messageResult.error;
      setTeams((teamResult.data ?? []) as Team[]);
      setMessages((messageResult.data ?? []) as Message[]);

      if (role === "organizer") {
        const v = await supabase
          .from("dashboard_volunteers")
          .select("id,name,group_name,phone,email")
          .eq("source_present", true)
          .order("name");
        if (v.error) throw v.error;
        setVolunteers((v.data ?? []) as Volunteer[]);
      } else if (volunteerId) {
        const [p, receipts] = await Promise.all([
          supabase
            .from("dashboard_volunteers")
            .select("id,name,group_name,phone,email")
            .eq("id", volunteerId)
            .maybeSingle(),
          supabase
            .from("dashboard_message_receipts")
            .select("message_id,read_at")
            .eq("volunteer_id", volunteerId),
        ]);
        if (p.error) throw p.error;
        if (receipts.error) throw receipts.error;
        setProfile((p.data ?? null) as Volunteer | null);
        setReadIds(new Set((receipts.data ?? []).filter((r) => r.read_at).map((r) => r.message_id)));
      }
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Errore caricamento dati Smart.");
    } finally {
      setLoadingData(false);
    }
  }, [role, volunteerId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const unreadCount = useMemo(
    () => role === "volunteer" ? messages.filter((m) => !readIds.has(m.id)).length : 0,
    [messages, readIds, role],
  );

  const myTeams = useMemo(() => {
    if (role !== "volunteer" || !volunteerId) return teams;
    return teams.filter((team) => team.member_ids.includes(volunteerId));
  }, [role, teams, volunteerId]);

  async function organizerLogin() {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password) return;
    setAuthMessage("Accesso in corso…");
    const { error } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    });
    setAuthMessage(error ? "Email o password non valide." : "");
  }

  async function organizerFirstAccess() {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setAuthMessage("Inserisci l'email autorizzata.");
      return;
    }
    setAuthMessage("Invio link sicuro per completare l'accesso…");
    const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo: `${window.location.origin}/smart?type=recovery`,
    });
    setAuthMessage(
      error
        ? "Non riesco a inviare il link. Verifica che l'indirizzo sia quello autorizzato."
        : "Controlla la mail: il link ti permette di scegliere la password e poi entrare nella Dashboard.",
    );
  }

  async function volunteerLogin() {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return;
    setAuthMessage("Invio link di accesso…");
    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: { emailRedirectTo: `${window.location.origin}/smart` },
    });
    setAuthMessage(error ? "Invio non riuscito." : "Controlla la tua email: il link apre solo i dati associati al tuo account.");
  }

  async function requestPasswordReset() {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setAuthMessage("Inserisci prima l'email dell'organizzatore.");
      return;
    }
    setAuthMessage("Invio link di recupero…");
    const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo: `${window.location.origin}/smart?type=recovery`,
    });
    setAuthMessage(
      error
        ? "Recupero non disponibile da questa preview. Non fare altri tentativi: il collegamento deve essere autorizzato."
        : "Controlla la mail: apri il link, scegli una nuova password e poi entrerai nella Dashboard.",
    );
  }

  async function saveRecoveredPassword() {
    if (newPassword.length < 10) {
      setAuthMessage("Usa una password di almeno 10 caratteri.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setAuthMessage(error ? "Password non aggiornata." : "Password aggiornata.");
    if (!error) {
      setNewPassword("");
      setRecoveryMode(false);
      await resolveRole();
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setTeams([]);
    setMessages([]);
    setVolunteers([]);
    setReadIds(new Set());
    setRole("guest");
  }

  async function markRead(message: Message, acknowledge = false) {
    if (role !== "volunteer" || !volunteerId) return;
    const payload = {
      message_id: message.id,
      volunteer_id: volunteerId,
      read_at: new Date().toISOString(),
      acknowledged_at: acknowledge ? new Date().toISOString() : null,
    };
    const { error } = await supabase
      .from("dashboard_message_receipts")
      .upsert(payload, { onConflict: "message_id,volunteer_id" });
    if (!error) {
      setReadIds((current) => new Set([...current, message.id]));
    }
  }

  async function sendMessage() {
    if (role !== "organizer") return;
    if (!composeTitle.trim() || !composeBody.trim()) {
      setDataError("Titolo e messaggio sono obbligatori.");
      return;
    }

    const payload = {
      message_type: composeType,
      title: composeTitle.trim(),
      body: composeBody.trim(),
      urgent: composeUrgent,
      target_volunteer_id: composeType === "direct" ? targetVolunteer || null : null,
      target_team_id: composeType === "team" ? targetTeam || null : null,
      target_day: composeType === "shift" ? targetDay || null : null,
      target_slot: composeType === "shift" ? targetSlot || null : null,
      target_activity: composeType === "shift" ? targetActivity || null : null,
    };

    if (composeType === "direct" && !targetVolunteer) {
      setDataError("Seleziona il volontario destinatario.");
      return;
    }
    if (composeType === "team" && !targetTeam) {
      setDataError("Seleziona la squadra destinataria.");
      return;
    }

    const { error } = await supabase.from("dashboard_messages").insert(payload);
    if (error) {
      setDataError(error.message);
      return;
    }

    setComposeTitle("");
    setComposeBody("");
    setComposeUrgent(false);
    setComposeOpen(false);
    setDataError("");
    await loadData();
  }

  if (role === "loading") {
    return <main className="min-h-screen bg-ink p-4 text-paper">Caricamento Smart…</main>;
  }

  if (role === "guest" || role === "unlinked" || recoveryMode) {
    return (
      <main className="min-h-screen bg-ink px-4 py-8 text-paper">
        <div className="mx-auto max-w-md border-2 border-[#b85668] p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-7 text-[#c76476]" />
            <div>
              <p className="text-xs font-black uppercase text-paper/55">Costacciaro 2026</p>
              <h1 className="text-2xl font-black uppercase">Smart accesso</h1>
            </div>
          </div>

          {recoveryMode ? (
            <div className="mt-6">
              <h2 className="font-black uppercase">Imposta nuova password</h2>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nuova password"
                className="mt-3 min-h-12 w-full border border-[#b85668] bg-transparent px-3"
              />
              <button
                type="button"
                onClick={saveRecoveredPassword}
                className="mt-3 min-h-12 w-full bg-[#b85668] px-4 font-black"
              >
                Salva password
              </button>
            </div>
          ) : (
            <>
              <label className="mt-6 block text-sm font-bold">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 min-h-12 w-full border border-[#b85668] bg-transparent px-3"
                  autoComplete="email"
                />
              </label>

              <div className="mt-5 border-t border-paper/15 pt-5">
                <h2 className="font-black uppercase">Organizzatori</h2>
                <p className="mt-1 text-sm text-paper/60">Accesso con account autorizzato e password.</p>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="mt-3 min-h-12 w-full border border-[#b85668] bg-transparent px-3"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={organizerLogin}
                  className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 bg-[#b85668] px-4 font-black"
                >
                  <LogIn className="size-4" /> Entra come organizzatore
                </button>
                <button
                  type="button"
                  onClick={organizerFirstAccess}
                  className="mt-2 min-h-11 w-full border border-[#b85668] px-3 text-sm font-bold"
                >
                  Primo accesso · crea password
                </button>
                <button
                  type="button"
                  onClick={requestPasswordReset}
                  className="mt-2 min-h-11 w-full border border-paper/20 px-3 text-sm font-bold"
                >
                  Recupera password
                </button>
              </div>

              <div className="mt-5 border-t border-paper/15 pt-5">
                <h2 className="font-black uppercase">Volontari</h2>
                <p className="mt-1 text-sm text-paper/60">
                  Accesso personale in sola lettura tramite link inviato alla propria email.
                </p>
                <button
                  type="button"
                  onClick={volunteerLogin}
                  className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 border-2 border-[#b85668] px-4 font-black"
                >
                  <Mail className="size-4" /> Inviami il link personale
                </button>
              </div>
            </>
          )}

          {role === "unlinked" ? (
            <p className="mt-4 border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
              L'account è autenticato ma non è associato a un organizzatore o a un volontario. Nessun dato operativo è accessibile.
            </p>
          ) : null}

          {authMessage ? <p className="mt-4 text-sm font-bold">{authMessage}</p> : null}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-ink px-3 py-4 text-paper">
      <div className="mx-auto max-w-3xl">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-[#b85668] pb-4">
          <div>
            <p className="text-xs font-black uppercase text-paper/50">Costacciaro 2026 · Smart</p>
            <h1 className="text-2xl font-black uppercase">
              {role === "organizer" ? "Organizzatore" : profile?.name ?? "Volontario"}
            </h1>
            <p className="mt-1 text-sm text-paper/60">
              {role === "organizer" ? "Gestione autorizzata" : "Sola lettura dei tuoi dati operativi"}
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="flex min-h-11 items-center gap-2 border border-paper/20 px-3 text-sm font-bold"
          >
            <LogOut className="size-4" /> Esci
          </button>
        </header>

        <nav className="mt-3 grid grid-cols-3 border border-[#b85668]">
          <button
            type="button"
            onClick={() => setTab("turni")}
            className={`min-h-12 px-2 text-sm font-black ${tab === "turni" ? "bg-[#b85668]" : ""}`}
          >
            I miei turni
          </button>
          <button
            type="button"
            onClick={() => setTab("messaggi")}
            className={`relative min-h-12 px-2 text-sm font-black ${tab === "messaggi" ? "bg-[#b85668]" : ""}`}
          >
            Messaggi
            {unreadCount > 0 ? (
              <span className="ml-1 rounded-full bg-white px-1.5 py-0.5 text-[10px] text-ink">{unreadCount}</span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setTab("persone")}
            className={`min-h-12 px-2 text-sm font-black ${tab === "persone" ? "bg-[#b85668]" : ""}`}
          >
            {role === "organizer" ? "Persone" : "Squadra"}
          </button>
        </nav>

        {dataError ? (
          <div className="mt-3 border border-red-500/60 bg-red-950/30 p-3 text-sm font-bold">{dataError}</div>
        ) : null}
        {loadingData ? <div className="mt-3 text-sm text-paper/60">Aggiornamento dati…</div> : null}

        {tab === "turni" ? (
          <section className="mt-3">
            <h2 className="font-black uppercase">{role === "organizer" ? "Turni operativi" : "I miei turni"}</h2>
            <div className="mt-2 grid gap-2">
              {myTeams.length ? myTeams.map((team) => (
                <article key={team.id} className="border border-paper/15 bg-paper/[0.04] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <strong className="block">{team.activity}</strong>
                      <span className="text-xs text-paper/55">{team.day} · {team.slot}</span>
                      <div className="mt-1 text-sm">{team.place}</div>
                    </div>
                    {role === "organizer" ? (
                      <span className="text-xs font-black">Squadra {team.member_ids.length}/{team.target}</span>
                    ) : (
                      <span className="text-xs font-black">{team.pinned ? "Confermato" : "In definizione"}</span>
                    )}
                  </div>
                </article>
              )) : (
                <p className="border border-paper/15 p-3 text-sm text-paper/55">Nessun turno assegnato.</p>
              )}
            </div>
          </section>
        ) : null}

        {tab === "messaggi" ? (
          <section className="mt-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-black uppercase">Comunicazioni</h2>
                <p className="text-sm text-paper/55">Bacheca e messaggi destinati al tuo ruolo.</p>
              </div>
              {role === "organizer" ? (
                <button
                  type="button"
                  onClick={() => setComposeOpen((value) => !value)}
                  className="flex min-h-11 items-center gap-2 bg-[#b85668] px-3 text-sm font-black"
                >
                  <Send className="size-4" /> Nuovo
                </button>
              ) : null}
            </div>

            {composeOpen && role === "organizer" ? (
              <div className="mt-3 border-2 border-[#b85668] p-3">
                <label className="block text-sm font-bold">
                  Destinazione
                  <select
                    value={composeType}
                    onChange={(e) => setComposeType(e.target.value as Message["message_type"])}
                    className="mt-1 min-h-11 w-full border border-paper/20 bg-ink px-3"
                  >
                    <option value="notice">Bacheca comune</option>
                    <option value="direct">Singolo volontario</option>
                    <option value="team">Squadra</option>
                    <option value="shift">Turno</option>
                  </select>
                </label>

                {composeType === "direct" ? (
                  <select
                    value={targetVolunteer}
                    onChange={(e) => setTargetVolunteer(e.target.value)}
                    className="mt-2 min-h-11 w-full border border-paper/20 bg-ink px-3"
                  >
                    <option value="">Seleziona volontario</option>
                    {volunteers.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                ) : null}

                {composeType === "team" ? (
                  <select
                    value={targetTeam}
                    onChange={(e) => setTargetTeam(e.target.value)}
                    className="mt-2 min-h-11 w-full border border-paper/20 bg-ink px-3"
                  >
                    <option value="">Seleziona squadra</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.day} · {t.slot} · {t.activity}</option>)}
                  </select>
                ) : null}

                {composeType === "shift" ? (
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <input value={targetDay} onChange={(e) => setTargetDay(e.target.value)} placeholder="Giorno" className="min-h-11 border border-paper/20 bg-ink px-3" />
                    <input value={targetSlot} onChange={(e) => setTargetSlot(e.target.value)} placeholder="Fascia" className="min-h-11 border border-paper/20 bg-ink px-3" />
                    <input value={targetActivity} onChange={(e) => setTargetActivity(e.target.value)} placeholder="Mansione" className="min-h-11 border border-paper/20 bg-ink px-3" />
                  </div>
                ) : null}

                <input
                  value={composeTitle}
                  onChange={(e) => setComposeTitle(e.target.value)}
                  placeholder="Titolo"
                  className="mt-2 min-h-11 w-full border border-paper/20 bg-ink px-3"
                />
                <textarea
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Messaggio"
                  rows={4}
                  className="mt-2 w-full border border-paper/20 bg-ink p-3"
                />
                <label className="mt-2 flex min-h-11 items-center gap-2 text-sm font-bold">
                  <input type="checkbox" checked={composeUrgent} onChange={(e) => setComposeUrgent(e.target.checked)} />
                  Richiedi particolare attenzione
                </label>
                <button type="button" onClick={sendMessage} className="mt-2 min-h-12 w-full bg-[#b85668] px-3 font-black">
                  Invia comunicazione
                </button>
              </div>
            ) : null}

            <div className="mt-3 grid gap-2">
              {messages.map((message) => {
                const unread = role === "volunteer" && !readIds.has(message.id);
                return (
                  <article
                    key={message.id}
                    className={`border p-3 ${message.urgent ? "border-amber-400 bg-amber-400/10" : unread ? "border-[#b85668] bg-[#b85668]/10" : "border-paper/15 bg-paper/[0.04]"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-paper/55">{messageLabel[message.message_type]}</span>
                          {message.urgent ? <span className="text-[10px] font-black uppercase text-amber-300">Importante</span> : null}
                          {unread ? <span className="text-[10px] font-black uppercase text-[#e995a5]">Nuovo</span> : null}
                        </div>
                        <h3 className="mt-1 font-black">{message.title}</h3>
                      </div>
                      <Bell className="size-4 shrink-0 opacity-60" />
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-paper/80">{message.body}</p>
                    <p className="mt-2 text-[10px] text-paper/45">{new Date(message.created_at).toLocaleString("it-IT")}</p>
                    {role === "volunteer" ? (
                      <div className="mt-2 flex gap-2">
                        {!readIds.has(message.id) ? (
                          <button type="button" onClick={() => markRead(message)} className="min-h-11 border border-paper/20 px-3 text-sm font-bold">
                            Segna letto
                          </button>
                        ) : null}
                        {message.urgent ? (
                          <button type="button" onClick={() => markRead(message, true)} className="flex min-h-11 items-center gap-2 border border-amber-400/50 px-3 text-sm font-bold">
                            <CheckCheck className="size-4" /> Conferma lettura
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
              {!messages.length ? <p className="border border-paper/15 p-3 text-sm text-paper/55">Nessun messaggio.</p> : null}
            </div>
          </section>
        ) : null}

        {tab === "persone" ? (
          <section className="mt-3">
            {role === "organizer" ? (
              <>
                <h2 className="font-black uppercase">Persone</h2>
                <p className="text-sm text-paper/55">Rubrica rapida organizzatori.</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {volunteers.slice(0, 50).map((v) => (
                    <article key={v.id} className="border border-paper/15 bg-paper/[0.04] p-3">
                      <strong className="block">{v.name}</strong>
                      <span className="text-xs text-paper/50">{v.group_name || "—"}</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {v.phone ? <a href={`tel:${v.phone}`} className="flex min-h-11 items-center gap-2 border border-paper/20 px-3 text-sm font-bold"><Phone className="size-4" /> Chiama</a> : null}
                        {v.email ? <a href={`mailto:${v.email}`} className="flex min-h-11 items-center gap-2 border border-paper/20 px-3 text-sm font-bold"><Mail className="size-4" /> Email</a> : null}
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="font-black uppercase">La mia squadra</h2>
                <p className="text-sm text-paper/55">Vedi solo le squadre di cui fai parte.</p>
                <div className="mt-2 grid gap-2">
                  {myTeams.map((team) => (
                    <article key={team.id} className="border border-paper/15 p-3">
                      <div className="flex items-center gap-2">
                        <Users className="size-4" />
                        <strong>{team.activity}</strong>
                      </div>
                      <p className="mt-1 text-xs text-paper/55">{team.day} · {team.slot} · {team.place}</p>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
