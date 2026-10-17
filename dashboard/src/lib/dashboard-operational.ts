import { supabase } from "@/lib/supabase";

export type OperationalTeam = {
  id: string;
  name: string;
  day: string;
  slot: string;
  place: string;
  activity: string;
  target: number;
  memberIds: string[];
  pinned: boolean;
};

export type OperationalVolunteer = {
  id: string;
  name: string;
  group: string;
  days: string[];
  hours?: string;
  slots: string[];
  activities: string[];
  skills: string[];
  restrictions?: string;
  vehicle: boolean;
  email?: string;
  phone?: string;
  notes?: string;
  status: string;
  confirmed: boolean;
  priority: number;
  internalNotes?: string;
  tags: string[];
};

export type VolunteerOpsPatch = {
  status?: string;
  confirmed?: boolean;
  priority?: number;
  internalNotes?: string | null;
  tags?: string[];
};

export async function loadTestVolunteerSnapshot() {
  const { data, error } = await supabase
    .from("dashboard_test_volunteers")
    .select("id,name,group_name,phone,email,days,hours,slots,activities,skills,restrictions,notes")
    .eq("source_present", true)
    .order("name");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    group: row.group_name ?? "",
    days: row.days ?? [],
    hours: row.hours ?? undefined,
    slots: row.slots ?? [],
    activities: row.activities ?? [],
    skills: row.skills ?? [],
    restrictions: row.restrictions ?? undefined,
    vehicle: false,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    notes: row.notes ?? undefined,
    status: "nuovo",
    confirmed: false,
    priority: 0,
    internalNotes: undefined,
    tags: [],
  })) as OperationalVolunteer[];
}

export async function loadOperationalDashboard() {
  const [
    { data: teams, error: teamsError },
    { data: activities, error: activitiesError },
    { data: volunteers, error: volunteersError },
    { data: volunteerOps, error: volunteerOpsError },
  ] = await Promise.all([
    supabase.from("dashboard_teams").select("id,name,day,slot,place,activity,target,member_ids,pinned").order("day").order("slot"),
    supabase.from("dashboard_activities").select("name,sort_order").order("sort_order"),
    supabase
      .from("dashboard_volunteers")
      .select("id,name,group_name,phone,email,days,hours,slots,activities,skills,restrictions,notes")
      .eq("source_present", true)
      .order("name"),
    supabase
      .from("dashboard_volunteer_ops")
      .select("volunteer_id,status,confirmed,priority,internal_notes,tags"),
  ]);

  const error = teamsError || activitiesError || volunteersError || volunteerOpsError;
  if (error) throw error;

  const opsByVolunteer = new Map(
    (volunteerOps ?? []).map((row) => [row.volunteer_id, row]),
  );

  return {
    teams: (teams ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      day: row.day,
      slot: row.slot,
      place: row.place,
      activity: row.activity,
      target: row.target,
      memberIds: row.member_ids ?? [],
      pinned: row.pinned,
    })) as OperationalTeam[],
    activities: (activities ?? []).map((row) => row.name) as string[],
    volunteers: (volunteers ?? []).map((row) => {
      const ops = opsByVolunteer.get(row.id);
      return {
        id: row.id,
        name: row.name,
        group: row.group_name ?? "",
        days: row.days ?? [],
        hours: row.hours ?? undefined,
        slots: row.slots ?? [],
        activities: row.activities ?? [],
        skills: row.skills ?? [],
        restrictions: row.restrictions ?? undefined,
        vehicle: false,
        email: row.email ?? undefined,
        phone: row.phone ?? undefined,
        notes: row.notes ?? undefined,
        status: ops?.status ?? "nuovo",
        confirmed: ops?.confirmed ?? false,
        priority: ops?.priority ?? 0,
        internalNotes: ops?.internal_notes ?? undefined,
        tags: ops?.tags ?? [],
      };
    }) as OperationalVolunteer[],
  };
}

export async function saveOperationalTeams(teams: OperationalTeam[]) {
  const rows = teams.map((team) => ({
    id: team.id,
    name: team.name,
    day: team.day,
    slot: team.slot,
    place: team.place,
    activity: team.activity,
    target: team.target,
    member_ids: team.memberIds,
    pinned: team.pinned,
  }));
  if (!rows.length) return;
  const { error } = await supabase.from("dashboard_teams").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

export async function saveOperationalActivities(activities: string[]) {
  const rows = activities.map((name, index) => ({ name, sort_order: (index + 1) * 10 }));
  if (!rows.length) return;
  const { error } = await supabase.from("dashboard_activities").upsert(rows, { onConflict: "name" });
  if (error) throw error;
}

export async function deleteOperationalActivity(name: string) {
  const { error: teamsError } = await supabase.from("dashboard_teams").delete().eq("activity", name);
  if (teamsError) throw teamsError;
  const { error: activityError } = await supabase.from("dashboard_activities").delete().eq("name", name);
  if (activityError) throw activityError;
}

export async function saveVolunteerOps(volunteerId: string, patch: VolunteerOpsPatch) {
  const row: Record<string, unknown> = { volunteer_id: volunteerId };
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.confirmed !== undefined) row.confirmed = patch.confirmed;
  if (patch.priority !== undefined) row.priority = patch.priority;
  if (patch.internalNotes !== undefined) row.internal_notes = patch.internalNotes;
  if (patch.tags !== undefined) row.tags = patch.tags;

  const { error } = await supabase
    .from("dashboard_volunteer_ops")
    .upsert(row, { onConflict: "volunteer_id" });
  if (error) throw error;
}

export function subscribeOperationalDashboard(onChange: () => void) {
  const channel = supabase
    .channel("dashboard-operational-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "dashboard_teams" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "dashboard_activities" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "dashboard_volunteers" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "dashboard_volunteer_ops" }, onChange)
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export type DashboardMessageSummary = {
  id: string;
  messageType: "notice" | "direct" | "team" | "shift";
  title: string;
  body: string;
  urgent: boolean;
  targetLabel: string;
  createdAt: string;
  recipientCount: number;
  readCount: number;
  acknowledgedCount: number;
};

export type VolunteerMessage = {
  id: string;
  title: string;
  body: string;
  urgent: boolean;
  createdAt: string;
  readAt?: string;
  acknowledgedAt?: string;
  messageType: "notice" | "direct" | "team" | "shift";
};

export async function sendDashboardMessage(input: {
  messageType: "notice" | "direct" | "team" | "shift";
  title: string;
  body: string;
  urgent?: boolean;
  targetVolunteerId?: string;
  targetTeamId?: string;
  targetDay?: string;
  targetSlot?: string;
  targetActivity?: string;
}) {
  const { data, error } = await supabase.rpc("dashboard_send_message_working", {
    p_message_type: input.messageType,
    p_title: input.title,
    p_body: input.body,
    p_urgent: Boolean(input.urgent),
    p_target_volunteer_id: input.targetVolunteerId || null,
    p_target_team_id: input.targetTeamId || null,
    p_target_day: input.targetDay || null,
    p_target_slot: input.targetSlot || null,
    p_target_activity: input.targetActivity || null,
  });
  if (error) throw error;
  return data as { ok: boolean; message_id: string; recipient_count: number };
}

export async function loadDashboardMessages() {
  const { data, error } = await supabase.rpc("dashboard_list_messages_working");
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    messageType: row.message_type,
    title: row.title,
    body: row.body,
    urgent: Boolean(row.urgent),
    targetLabel: row.target_label ?? "",
    createdAt: row.created_at,
    recipientCount: Number(row.recipient_count ?? 0),
    readCount: Number(row.read_count ?? 0),
    acknowledgedCount: Number(row.acknowledged_count ?? 0),
  })) as DashboardMessageSummary[];
}

export async function loadVolunteerMessages(deviceToken: string) {
  const { data, error } = await supabase.rpc("dashboard_get_device_messages", {
    p_device_token: deviceToken,
  });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    urgent: Boolean(row.urgent),
    createdAt: row.created_at,
    readAt: row.read_at ?? undefined,
    acknowledgedAt: row.acknowledged_at ?? undefined,
    messageType: row.message_type,
  })) as VolunteerMessage[];
}

export async function markVolunteerMessage(deviceToken: string, messageId: string, acknowledge = false) {
  const { data, error } = await supabase.rpc("dashboard_mark_device_message", {
    p_device_token: deviceToken,
    p_message_id: messageId,
    p_acknowledge: acknowledge,
  });
  if (error) throw error;
  return data as { ok: boolean };
}
