import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleHelp,
  Download,
  Mail,
  Phone,
  Filter,
  Moon,
  Pin,
  Plus,
  Search,
  Trash2,
  Pencil,
  Users,
  UserRound,
  MapPin,
  Clock3,
  Sun,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { loadOperationalDashboard, saveOperationalActivities, saveOperationalTeams, saveVolunteerOps, subscribeOperationalDashboard } from "@/lib/dashboard-operational";

export const Route = createFileRoute("/organizzatori")({
  head: () => ({
    meta: [
      { title: "Dashboard organizzatori — Costacciaro 2026" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: OrganizzatoriDashboard,
});

type Volunteer = {
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
  status?: string;
  confirmed?: boolean;
  priority?: number;
  internalNotes?: string;
  tags?: string[];
};

type Team = {
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

const demoVolunteers: Volunteer[] = [
  {
    "id": "v1",
    "name": "Anna Bianchi",
    "group": "Gruppo Alfa",
    "days": [
      "29 ottobre",
      "30 ottobre"
    ],
    "slots": [
      "Mattina"
    ],
    "activities": [
      "Accoglienza",
      "Conferenze"
    ],
    "skills": [
      "Inglese",
      "Segreteria"
    ],
    "vehicle": false
  },
  {
    "id": "v2",
    "name": "Luca Verdi",
    "group": "SAS",
    "days": [
      "29 ottobre",
      "30 ottobre"
    ],
    "slots": [
      "Mattina",
      "Pomeriggio"
    ],
    "activities": [
      "Accoglienza",
      "Logistica"
    ],
    "skills": [
      "Patente",
      "Furgone"
    ],
    "vehicle": true
  },
  {
    "id": "v3",
    "name": "Elena Neri",
    "group": "Gruppo Beta",
    "days": [
      "29 ottobre"
    ],
    "slots": [
      "Mattina"
    ],
    "activities": [
      "Conferenze",
      "Accoglienza"
    ],
    "skills": [
      "Moderazione",
      "Inglese"
    ],
    "vehicle": false
  },
  {
    "id": "v4",
    "name": "Paolo Rossi",
    "group": "SSI",
    "days": [
      "28 ottobre",
      "29 ottobre",
      "30 ottobre"
    ],
    "slots": [
      "Mattina",
      "Pomeriggio"
    ],
    "activities": [
      "Allestimento",
      "Logistica"
    ],
    "skills": [
      "Logistica",
      "Patente"
    ],
    "vehicle": true
  },
  {
    "id": "v5",
    "name": "Marta Costa",
    "group": "Gruppo Gamma",
    "days": [
      "29 ottobre",
      "31 ottobre"
    ],
    "slots": [
      "Pomeriggio"
    ],
    "activities": [
      "Conferenze"
    ],
    "skills": [
      "Segreteria",
      "Relatori"
    ],
    "vehicle": false
  },
  {
    "id": "v6",
    "name": "Andrea Furlan",
    "group": "SAS",
    "days": [
      "29 ottobre",
      "30 ottobre"
    ],
    "slots": [
      "Mattina"
    ],
    "activities": [
      "Accoglienza",
      "Logistica"
    ],
    "skills": [
      "Francese",
      "Patente"
    ],
    "vehicle": true
  },
  {
    "id": "v7",
    "name": "Giulia Conti",
    "group": "Gruppo Alfa",
    "days": [
      "29 ottobre",
      "30 ottobre"
    ],
    "slots": [
      "Sera"
    ],
    "activities": [
      "Accoglienza"
    ],
    "skills": [
      "Furgone",
      "Patente"
    ],
    "vehicle": true
  },
  {
    "id": "v8",
    "name": "Marco Rinaldi",
    "group": "Gruppo Beta",
    "days": [
      "29 ottobre",
      "31 ottobre"
    ],
    "slots": [
      "Mattina"
    ],
    "activities": [
      "Accoglienza"
    ],
    "skills": [
      "Radio"
    ],
    "vehicle": false
  },
  {
    "id": "v9",
    "name": "Sara De Luca",
    "group": "SAS",
    "days": [
      "29 ottobre"
    ],
    "slots": [
      "Mattina",
      "Sera"
    ],
    "activities": [
      "Accoglienza",
      "Conferenze"
    ],
    "skills": [
      "Furgone",
      "Patente"
    ],
    "vehicle": false
  },
  {
    "id": "v10",
    "name": "Davide Moretti",
    "group": "SSI",
    "days": [
      "30 ottobre",
      "31 ottobre"
    ],
    "slots": [
      "Mattina",
      "Pomeriggio"
    ],
    "activities": [
      "Logistica"
    ],
    "skills": [
      "Radio"
    ],
    "vehicle": false
  },
  {
    "id": "v11",
    "name": "Chiara Romano",
    "group": "Gruppo Gamma",
    "days": [
      "29 ottobre",
      "30 ottobre",
      "31 ottobre"
    ],
    "slots": [
      "Pomeriggio"
    ],
    "activities": [
      "Accoglienza"
    ],
    "skills": [
      "Furgone",
      "Patente"
    ],
    "vehicle": true
  },
  {
    "id": "v12",
    "name": "Matteo Gallo",
    "group": "SAS",
    "days": [
      "28 ottobre",
      "29 ottobre"
    ],
    "slots": [
      "Mattina",
      "Pomeriggio",
      "Sera"
    ],
    "activities": [
      "Conferenze"
    ],
    "skills": [
      "Radio"
    ],
    "vehicle": false
  },
  {
    "id": "v13",
    "name": "Francesca Fontana",
    "group": "Gruppo Delta",
    "days": [
      "28 ottobre",
      "30 ottobre",
      "1 novembre"
    ],
    "slots": [
      "Pomeriggio",
      "Sera"
    ],
    "activities": [
      "Accoglienza",
      "Logistica"
    ],
    "skills": [
      "Furgone",
      "Patente"
    ],
    "vehicle": false
  },
  {
    "id": "v14",
    "name": "Simone Greco",
    "group": "Gruppo Alfa",
    "days": [
      "29 ottobre",
      "30 ottobre"
    ],
    "slots": [
      "Sera"
    ],
    "activities": [
      "Allestimento"
    ],
    "skills": [
      "Radio"
    ],
    "vehicle": false
  },
  {
    "id": "v15",
    "name": "Elisa Marino",
    "group": "SSI",
    "days": [
      "29 ottobre",
      "31 ottobre"
    ],
    "slots": [
      "Mattina"
    ],
    "activities": [
      "Accoglienza"
    ],
    "skills": [
      "Furgone",
      "Patente"
    ],
    "vehicle": true
  },
  {
    "id": "v16",
    "name": "Lorenzo Bruno",
    "group": "Gruppo Beta",
    "days": [
      "29 ottobre"
    ],
    "slots": [
      "Mattina",
      "Sera"
    ],
    "activities": [
      "Conferenze"
    ],
    "skills": [
      "Radio"
    ],
    "vehicle": false
  },
  {
    "id": "v17",
    "name": "Valentina Ferri",
    "group": "SAS",
    "days": [
      "30 ottobre",
      "31 ottobre"
    ],
    "slots": [
      "Mattina",
      "Pomeriggio"
    ],
    "activities": [
      "Logistica"
    ],
    "skills": [
      "Furgone",
      "Patente"
    ],
    "vehicle": false
  },
  {
    "id": "v18",
    "name": "Stefano Caruso",
    "group": "Gruppo Gamma",
    "days": [
      "29 ottobre",
      "30 ottobre",
      "31 ottobre"
    ],
    "slots": [
      "Pomeriggio"
    ],
    "activities": [
      "Accoglienza"
    ],
    "skills": [
      "Radio"
    ],
    "vehicle": false
  },
  {
    "id": "v19",
    "name": "Ilaria Rizzo",
    "group": "Gruppo Delta",
    "days": [
      "28 ottobre",
      "29 ottobre"
    ],
    "slots": [
      "Mattina",
      "Pomeriggio",
      "Sera"
    ],
    "activities": [
      "Accoglienza",
      "Conferenze"
    ],
    "skills": [
      "Furgone",
      "Patente"
    ],
    "vehicle": true
  },
  {
    "id": "v20",
    "name": "Nicola Barbieri",
    "group": "SSI",
    "days": [
      "28 ottobre",
      "30 ottobre",
      "1 novembre"
    ],
    "slots": [
      "Pomeriggio",
      "Sera"
    ],
    "activities": [
      "Allestimento"
    ],
    "skills": [
      "Radio"
    ],
    "vehicle": false
  },
  {
    "id": "v21",
    "name": "Federica Lombardi",
    "group": "Gruppo Alfa",
    "days": [
      "29 ottobre",
      "30 ottobre"
    ],
    "slots": [
      "Sera"
    ],
    "activities": [
      "Accoglienza"
    ],
    "skills": [
      "Furgone",
      "Patente"
    ],
    "vehicle": false
  },
  {
    "id": "v22",
    "name": "Alessandro Serra",
    "group": "SAS",
    "days": [
      "29 ottobre",
      "31 ottobre"
    ],
    "slots": [
      "Mattina"
    ],
    "activities": [
      "Logistica"
    ],
    "skills": [
      "Radio"
    ],
    "vehicle": false
  },
  {
    "id": "v23",
    "name": "Martina Pellegrini",
    "group": "Gruppo Beta",
    "days": [
      "29 ottobre"
    ],
    "slots": [
      "Mattina",
      "Sera"
    ],
    "activities": [
      "Conferenze"
    ],
    "skills": [
      "Furgone",
      "Patente"
    ],
    "vehicle": true
  },
  {
    "id": "v24",
    "name": "Riccardo Villa",
    "group": "Gruppo Gamma",
    "days": [
      "30 ottobre",
      "31 ottobre"
    ],
    "slots": [
      "Mattina",
      "Pomeriggio"
    ],
    "activities": [
      "Accoglienza"
    ],
    "skills": [
      "Radio"
    ],
    "vehicle": false
  },
  {
    "id": "v25",
    "name": "Silvia Colombo",
    "group": "SSI",
    "days": [
      "29 ottobre",
      "30 ottobre",
      "31 ottobre"
    ],
    "slots": [
      "Pomeriggio"
    ],
    "activities": [
      "Accoglienza",
      "Allestimento"
    ],
    "skills": [
      "Furgone",
      "Patente"
    ],
    "vehicle": false
  },
  {
    "id": "v26",
    "name": "Giorgio Marchetti",
    "group": "SAS",
    "days": [
      "28 ottobre",
      "29 ottobre"
    ],
    "slots": [
      "Mattina",
      "Pomeriggio",
      "Sera"
    ],
    "activities": [
      "Logistica"
    ],
    "skills": [
      "Radio"
    ],
    "vehicle": false
  },
  {
    "id": "v27",
    "name": "Alice Parisi",
    "group": "Gruppo Delta",
    "days": [
      "28 ottobre",
      "30 ottobre",
      "1 novembre"
    ],
    "slots": [
      "Pomeriggio",
      "Sera"
    ],
    "activities": [
      "Accoglienza"
    ],
    "skills": [
      "Furgone",
      "Patente"
    ],
    "vehicle": true
  },
  {
    "id": "v28",
    "name": "Fabio Santoro",
    "group": "Gruppo Alfa",
    "days": [
      "29 ottobre",
      "30 ottobre"
    ],
    "slots": [
      "Sera"
    ],
    "activities": [
      "Conferenze"
    ],
    "skills": [
      "Radio"
    ],
    "vehicle": false
  },
  {
    "id": "v29",
    "name": "Laura Vitale",
    "group": "SSI",
    "days": [
      "29 ottobre",
      "31 ottobre"
    ],
    "slots": [
      "Mattina"
    ],
    "activities": [
      "Accoglienza"
    ],
    "skills": [
      "Furgone",
      "Patente"
    ],
    "vehicle": false
  },
  {
    "id": "v30",
    "name": "Enrico Messina",
    "group": "Gruppo Beta",
    "days": [
      "29 ottobre"
    ],
    "slots": [
      "Mattina",
      "Sera"
    ],
    "activities": [
      "Logistica"
    ],
    "skills": [
      "Radio"
    ],
    "vehicle": false
  },
  {
    "id": "v31",
    "name": "Beatrice Grassi",
    "group": "SAS",
    "days": [
      "30 ottobre",
      "31 ottobre"
    ],
    "slots": [
      "Mattina",
      "Pomeriggio"
    ],
    "activities": [
      "Allestimento"
    ],
    "skills": [
      "Furgone",
      "Patente"
    ],
    "vehicle": true
  },
  {
    "id": "v32",
    "name": "Tommaso D'Angelo",
    "group": "Gruppo Gamma",
    "days": [
      "29 ottobre",
      "30 ottobre",
      "31 ottobre"
    ],
    "slots": [
      "Pomeriggio"
    ],
    "activities": [
      "Accoglienza"
    ],
    "skills": [
      "Radio"
    ],
    "vehicle": false
  },
  {
    "id": "v33",
    "name": "Claudia Fiore",
    "group": "Gruppo Delta",
    "days": [
      "28 ottobre",
      "29 ottobre"
    ],
    "slots": [
      "Mattina",
      "Pomeriggio",
      "Sera"
    ],
    "activities": [
      "Conferenze"
    ],
    "skills": [
      "Furgone",
      "Patente"
    ],
    "vehicle": false
  },
  {
    "id": "v34",
    "name": "Michele Palmieri",
    "group": "SSI",
    "days": [
      "28 ottobre",
      "30 ottobre",
      "1 novembre"
    ],
    "slots": [
      "Pomeriggio",
      "Sera"
    ],
    "activities": [
      "Accoglienza"
    ],
    "skills": [
      "Radio"
    ],
    "vehicle": false
  },
  {
    "id": "v35",
    "name": "Noemi Testa",
    "group": "Gruppo Alfa",
    "days": [
      "29 ottobre",
      "30 ottobre"
    ],
    "slots": [
      "Sera"
    ],
    "activities": [
      "Logistica"
    ],
    "skills": [
      "Furgone",
      "Patente"
    ],
    "vehicle": true
  },
  {
    "id": "v36",
    "name": "Cristian Basile",
    "group": "SAS",
    "days": [
      "29 ottobre",
      "31 ottobre"
    ],
    "slots": [
      "Mattina"
    ],
    "activities": [
      "Accoglienza",
      "Conferenze"
    ],
    "skills": [
      "Radio"
    ],
    "vehicle": false
  },
  {
    "id": "v37",
    "name": "Serena Monti",
    "group": "Gruppo Beta",
    "days": [
      "29 ottobre"
    ],
    "slots": [
      "Mattina",
      "Sera"
    ],
    "activities": [
      "Allestimento"
    ],
    "skills": [
      "Furgone",
      "Patente"
    ],
    "vehicle": false
  },
  {
    "id": "v38",
    "name": "Emanuele Guerra",
    "group": "Gruppo Gamma",
    "days": [
      "30 ottobre",
      "31 ottobre"
    ],
    "slots": [
      "Mattina",
      "Pomeriggio"
    ],
    "activities": [
      "Accoglienza"
    ],
    "skills": [
      "Radio"
    ],
    "vehicle": false
  },
  {
    "id": "v39",
    "name": "Arianna Sala",
    "group": "SSI",
    "days": [
      "29 ottobre",
      "30 ottobre",
      "31 ottobre"
    ],
    "slots": [
      "Pomeriggio"
    ],
    "activities": [
      "Logistica"
    ],
    "skills": [
      "Furgone",
      "Patente"
    ],
    "vehicle": true
  },
  {
    "id": "v40",
    "name": "Filippo Donati",
    "group": "Gruppo Delta",
    "days": [
      "28 ottobre",
      "29 ottobre"
    ],
    "slots": [
      "Mattina",
      "Pomeriggio",
      "Sera"
    ],
    "activities": [
      "Conferenze"
    ],
    "skills": [
      "Radio"
    ],
    "vehicle": false
  },
  {
    "id": "v41",
    "name": "Camilla Piras",
    "group": "SAS",
    "days": [
      "28 ottobre",
      "30 ottobre",
      "1 novembre"
    ],
    "slots": [
      "Pomeriggio",
      "Sera"
    ],
    "activities": [
      "Accoglienza"
    ],
    "skills": [
      "Furgone",
      "Patente"
    ],
    "vehicle": false
  },
  {
    "id": "v42",
    "name": "Daniele Rossetti",
    "group": "Gruppo Alfa",
    "days": [
      "29 ottobre",
      "30 ottobre"
    ],
    "slots": [
      "Sera"
    ],
    "activities": [
      "Accoglienza"
    ],
    "skills": [
      "Radio"
    ],
    "vehicle": false
  },
  {
    "id": "v43",
    "name": "Veronica Bellini",
    "group": "Gruppo Beta",
    "days": [
      "29 ottobre",
      "31 ottobre"
    ],
    "slots": [
      "Mattina"
    ],
    "activities": [
      "Logistica",
      "Allestimento"
    ],
    "skills": [
      "Furgone",
      "Patente"
    ],
    "vehicle": true
  },
  {
    "id": "v44",
    "name": "Samuele De Angelis",
    "group": "SSI",
    "days": [
      "29 ottobre"
    ],
    "slots": [
      "Mattina",
      "Sera"
    ],
    "activities": [
      "Conferenze"
    ],
    "skills": [
      "Radio"
    ],
    "vehicle": false
  },
  {
    "id": "v45",
    "name": "Gaia Martinelli",
    "group": "Gruppo Gamma",
    "days": [
      "30 ottobre",
      "31 ottobre"
    ],
    "slots": [
      "Mattina",
      "Pomeriggio"
    ],
    "activities": [
      "Accoglienza"
    ],
    "skills": [
      "Furgone",
      "Patente"
    ],
    "vehicle": false
  },
  {
    "id": "v46",
    "name": "Pietro Bernardi",
    "group": "SAS",
    "days": [
      "29 ottobre",
      "30 ottobre",
      "31 ottobre"
    ],
    "slots": [
      "Pomeriggio"
    ],
    "activities": [
      "Logistica"
    ],
    "skills": [
      "Radio"
    ],
    "vehicle": false
  },
  {
    "id": "v47",
    "name": "Aurora Valentini",
    "group": "Gruppo Delta",
    "days": [
      "28 ottobre",
      "29 ottobre"
    ],
    "slots": [
      "Mattina",
      "Pomeriggio",
      "Sera"
    ],
    "activities": [
      "Accoglienza"
    ],
    "skills": [
      "Furgone",
      "Patente"
    ],
    "vehicle": true
  },
  {
    "id": "v48",
    "name": "Jacopo Leoni",
    "group": "Gruppo Alfa",
    "days": [
      "28 ottobre",
      "30 ottobre",
      "1 novembre"
    ],
    "slots": [
      "Pomeriggio",
      "Sera"
    ],
    "activities": [
      "Allestimento"
    ],
    "skills": [
      "Radio"
    ],
    "vehicle": false
  },
  {
    "id": "v49",
    "name": "Eleonora Farina",
    "group": "SSI",
    "days": [
      "29 ottobre",
      "30 ottobre"
    ],
    "slots": [
      "Sera"
    ],
    "activities": [
      "Conferenze"
    ],
    "skills": [
      "Furgone",
      "Patente"
    ],
    "vehicle": false
  },
  {
    "id": "v50",
    "name": "Mattia Sartori",
    "group": "Gruppo Beta",
    "days": [
      "29 ottobre",
      "31 ottobre"
    ],
    "slots": [
      "Mattina"
    ],
    "activities": [
      "Accoglienza"
    ],
    "skills": [
      "Radio"
    ],
    "vehicle": false
  }
];

const testVolunteer: Volunteer = {
  id: "test-massimiliano",
  name: "Massimiliano Werk",
  group: "TEST CONTATTI",
  days: [],
  slots: [],
  activities: [],
  skills: [],
  vehicle: false,
  phone: "+39 333 193 2611",
  email: "Massimiliano.werk@gmail.com",
};

const initialTeams: Team[] = [
  { id: "t1", name: "Accoglienza", day: "29 ottobre", slot: "Mattina", place: "Da definire", activity: "Accoglienza", target: 4, memberIds: ["v1", "v2"], pinned: false },
  { id: "t2", name: "Logistica", day: "29 ottobre", slot: "Mattina", place: "Da definire", activity: "Logistica", target: 4, memberIds: ["v4", "v6"], pinned: false },
  { id: "t3", name: "Conferenze", day: "29 ottobre", slot: "Pomeriggio", place: "Da definire", activity: "Conferenze", target: 4, memberIds: ["v3", "v5"], pinned: false },
  { id: "t4", name: "Allestimento", day: "29 ottobre", slot: "Sera", place: "Da definire", activity: "Allestimento", target: 3, memberIds: ["v4"], pinned: false },
];

const activityPalette: Record<string, { accent: string; tintLight: string; tintDark: string }> = {
  Accoglienza: { accent: "#4f8f83", tintLight: "#eef6f3", tintDark: "#162522" },
  Logistica: { accent: "#b48645", tintLight: "#f7f1e7", tintDark: "#2a2115" },
  Conferenze: { accent: "#5f7f9f", tintLight: "#eef3f7", tintDark: "#18222c" },
  Allestimento: { accent: "#8b6f98", tintLight: "#f4eff6", tintDark: "#241d28" },
};

const fallbackPalette = [
  { accent: "#6f8792", tintLight: "#eef3f5", tintDark: "#192328" },
  { accent: "#8b7f5a", tintLight: "#f5f2e9", tintDark: "#272319" },
  { accent: "#727a9a", tintLight: "#f0f1f7", tintDark: "#1d1f2a" },
  { accent: "#7d8d68", tintLight: "#f1f5ec", tintDark: "#20271a" },
];

function paletteFor(name: string) {
  if (activityPalette[name]) return activityPalette[name];
  const normalized = name.trim().toLowerCase();
  const parent = Object.keys(activityPalette).find((key) => normalized.startsWith(key.toLowerCase()));
  if (parent) return activityPalette[parent];
  const hash = [...normalized].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return fallbackPalette[hash % fallbackPalette.length];
}

function activityTone(name: string, light: boolean) {
  const tone = paletteFor(name);
  return { borderColor: tone.accent, backgroundColor: light ? tone.tintLight : tone.tintDark };
}

function OrganizzatoriDashboard() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [dataMode, setDataMode] = useState<"test" | "live">("test");
  const [testSize, setTestSize] = useState<30 | 40 | 50>(50);
  const [day, setDay] = useState("29 ottobre");
  const [slot, setSlot] = useState("Mattina");
  const [activity, setActivity] = useState("Accoglienza");
  const [query, setQuery] = useState("");
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [activities, setActivities] = useState(["Accoglienza", "Logistica", "Conferenze", "Allestimento"]);
  const [newActivity, setNewActivity] = useState("");
  const [newParent, setNewParent] = useState("Logistica");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [expandedVolunteerIds, setExpandedVolunteerIds] = useState<string[]>([]);
  const [editingActivity, setEditingActivity] = useState<string | null>(null);
  const [editActivityValue, setEditActivityValue] = useState("");
  const [mobileTab, setMobileTab] = useState<"panoramica" | "turno" | "persone" | "squadra">("panoramica");
  const [peopleFilterOpen, setPeopleFilterOpen] = useState(false);
  const [suggestedMemberIds, setSuggestedMemberIds] = useState<string[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [personalOpen, setPersonalOpen] = useState(false);
  const [personalVolunteerId, setPersonalVolunteerId] = useState("");
  const [personalQuery, setPersonalQuery] = useState("");
  const [liveVolunteers, setLiveVolunteers] = useState<Volunteer[]>([]);
  const [sessionEmail, setSessionEmail] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState("");
  const [liveSyncLabel, setLiveSyncLabel] = useState("");
  const [feedback, setFeedback] = useState("");
  const [focusContext, setFocusContext] = useState("");
  const [helpTopic, setHelpTopic] = useState<"welcome" | "coverage" | "priorities" | "regia" | "turn" | "people" | "team" | "suggest" | "pin" | "live" | null>(null);
  const [editingTeam, setEditingTeam] = useState(false);
  const liveHydrated = useRef(false);
  const lastTeamsSnapshot = useRef("");
  const lastActivitiesSnapshot = useRef("");
  const selectedTeam = useMemo<Team>(() => teams.find((team) => team.day === day && team.slot === slot && team.activity === activity) ?? {
    id: "__draft__",
    name: activity || "Squadra da configurare",
    day: day || "Da definire",
    slot: slot || "Da definire",
    place: "Da definire",
    activity: activity || "Da definire",
    target: 1,
    memberIds: [],
    pinned: false,
  }, [teams, day, slot, activity]);

  useEffect(() => {
    const savedMode = localStorage.getItem("costacciaro-dashboard-mode");
    const initialMode = savedMode === "live" ? "live" : "test";
    setDataMode(initialMode);
    if (initialMode === "test") {
      const savedActivities = localStorage.getItem("costacciaro-test-activities");
      const savedTeams = localStorage.getItem("costacciaro-test-teams");
      if (savedActivities) { try { setActivities(JSON.parse(savedActivities)); } catch {} }
      else setActivities(["Accoglienza", "Logistica", "Conferenze", "Allestimento"]);
      if (savedTeams) { try { setTeams(JSON.parse(savedTeams)); } catch {} }
      else setTeams(initialTeams);
    } else {
      setActivities(["Accoglienza", "Logistica", "Conferenze", "Allestimento"]);
      setTeams(initialTeams.map((team) => ({ ...team, memberIds: [] })));
    }
  }, []);

  useEffect(() => {
    const savedContext = localStorage.getItem("costacciaro-dashboard-context");
    if (savedContext) {
      try {
        const parsed = JSON.parse(savedContext);
        if (typeof parsed.day === "string") setDay(parsed.day);
        if (typeof parsed.slot === "string") setSlot(parsed.slot);
        if (typeof parsed.activity === "string") setActivity(parsed.activity);
        if (["panoramica", "turno", "persone", "squadra"].includes(parsed.mobileTab)) setMobileTab(parsed.mobileTab);
      } catch {}
    }
    if (!localStorage.getItem("costacciaro-dashboard-onboarding-seen")) setHelpTopic("welcome");
  }, []);

  useEffect(() => {
    localStorage.setItem("costacciaro-dashboard-context", JSON.stringify({ day, slot, activity, mobileTab }));
  }, [day, slot, activity, mobileTab]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(""), 2800);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    setEditingTeam(false);
  }, [day, slot, activity]);

  useEffect(() => {
    if (!helpTopic) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (helpTopic === "welcome") localStorage.setItem("costacciaro-dashboard-onboarding-seen", "1");
        setHelpTopic(null);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [helpTopic]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessionEmail(data.session?.user.email ?? ""));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user.email ?? "");
      if (!session) {
        liveHydrated.current = false;
        setLiveVolunteers([]);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (dataMode === "test") localStorage.setItem("costacciaro-test-activities", JSON.stringify(activities));
  }, [activities, dataMode]);
  useEffect(() => {
    if (dataMode === "test") localStorage.setItem("costacciaro-test-teams", JSON.stringify(teams));
  }, [teams, dataMode]);

  useEffect(() => {
    if (dataMode !== "live" || !sessionEmail) return;
    let cancelled = false;
    setLiveLoading(true);
    setLiveError("");
    setLiveSyncLabel("Caricamento…");
    liveHydrated.current = false;
    loadOperationalDashboard()
      .then((data) => {
        if (cancelled) return;
        lastTeamsSnapshot.current = JSON.stringify(data.teams);
        lastActivitiesSnapshot.current = JSON.stringify(data.activities);
        setTeams(data.teams);
        setActivities(data.activities);
        setLiveVolunteers(data.volunteers);
        liveHydrated.current = true;
        setLiveSyncLabel("Allineato");
      })
      .catch(() => {
        if (!cancelled) {
          setLiveError("Accesso operativo non autorizzato oppure dati non disponibili.");
          setLiveSyncLabel("");
        }
      })
      .finally(() => { if (!cancelled) setLiveLoading(false); });
    return () => { cancelled = true; };
  }, [dataMode, sessionEmail]);

  useEffect(() => {
    if (dataMode !== "live" || !sessionEmail) return;
    let refreshTimer: number | undefined;
    return subscribeOperationalDashboard(() => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        loadOperationalDashboard()
          .then((data) => {
            lastTeamsSnapshot.current = JSON.stringify(data.teams);
            lastActivitiesSnapshot.current = JSON.stringify(data.activities);
            setTeams(data.teams);
            setActivities(data.activities);
            setLiveVolunteers(data.volunteers);
            liveHydrated.current = true;
            setLiveSyncLabel("Aggiornato");
          })
          .catch(() => setLiveError("Aggiornamento in tempo reale non riuscito."));
      }, 150);
    });
  }, [dataMode, sessionEmail]);

  useEffect(() => {
    if (dataMode !== "live" || !sessionEmail || !liveHydrated.current) return;
    const snapshot = JSON.stringify(teams);
    if (snapshot === lastTeamsSnapshot.current) return;
    setLiveSyncLabel("Salvataggio…");
    const timer = window.setTimeout(() => {
      saveOperationalTeams(teams)
        .then(() => {
          lastTeamsSnapshot.current = snapshot;
          setLiveError("");
          setLiveSyncLabel("Salvato");
        })
        .catch(() => {
          setLiveError("Salvataggio squadre non riuscito.");
          setLiveSyncLabel("Errore");
        });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [teams, dataMode, sessionEmail]);

  useEffect(() => {
    if (dataMode !== "live" || !sessionEmail || !liveHydrated.current) return;
    const snapshot = JSON.stringify(activities);
    if (snapshot === lastActivitiesSnapshot.current) return;
    setLiveSyncLabel("Salvataggio…");
    const timer = window.setTimeout(() => {
      saveOperationalActivities(activities)
        .then(() => {
          lastActivitiesSnapshot.current = snapshot;
          setLiveError("");
          setLiveSyncLabel("Salvato");
        })
        .catch(() => {
          setLiveError("Salvataggio attività non riuscito.");
          setLiveSyncLabel("Errore");
        });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [activities, dataMode, sessionEmail]);

  const activeVolunteers = dataMode === "test" ? demoVolunteers.slice(0, testSize) : liveVolunteers;

  function switchDataMode(nextMode: "test" | "live") {
    if (nextMode === dataMode) return;
    if (dataMode === "test") {
      localStorage.setItem("costacciaro-test-activities", JSON.stringify(activities));
      localStorage.setItem("costacciaro-test-teams", JSON.stringify(teams));
    }
    if (nextMode === "test") {
      const savedActivities = localStorage.getItem("costacciaro-test-activities");
      const savedTeams = localStorage.getItem("costacciaro-test-teams");
      try { setActivities(savedActivities ? JSON.parse(savedActivities) : ["Accoglienza", "Logistica", "Conferenze", "Allestimento"]); } catch { setActivities(["Accoglienza", "Logistica", "Conferenze", "Allestimento"]); }
      try { setTeams(savedTeams ? JSON.parse(savedTeams) : initialTeams); } catch { setTeams(initialTeams); }
    } else {
      liveHydrated.current = false;
      setLiveVolunteers([]);
      setActivities(["Accoglienza", "Logistica", "Conferenze", "Allestimento"]);
      setTeams(initialTeams.map((team) => ({ ...team, memberIds: [] })));
    }
    setPersonalVolunteerId("");
    setPersonalQuery("");
    setDirectoryQuery("");
    setDataMode(nextMode);
    localStorage.setItem("costacciaro-dashboard-mode", nextMode);
  }
  function resetTestEnvironment() {
    if (dataMode !== "test") return;
    setActivities(["Accoglienza", "Logistica", "Conferenze", "Allestimento"]);
    setTeams(initialTeams);
    setPersonalVolunteerId("");
    setPersonalQuery("");
    setDirectoryQuery("");
    setQuery("");
    localStorage.removeItem("costacciaro-test-activities");
    localStorage.removeItem("costacciaro-test-teams");
  }

  async function requestOrganizerAccess() {
    const email = authEmail.trim().toLowerCase();
    if (!email) return;
    setAuthMessage("Invio accesso in corso…");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/organizzatori` },
    });
    setAuthMessage(error ? "Invio non riuscito." : "Controlla la tua email e apri il link di accesso.");
  }

  async function signOutOrganizer() {
    await supabase.auth.signOut();
    liveHydrated.current = false;
    setLiveVolunteers([]);
    setTeams(initialTeams.map((team) => ({ ...team, memberIds: [] })));
    setActivities(["Accoglienza", "Logistica", "Conferenze", "Allestimento"]);
    setLiveError("");
  }


  const macroActivities = activities.filter((item) => !item.includes(" — "));

  const directoryVolunteers = dataMode === "test" ? [...activeVolunteers, testVolunteer] : activeVolunteers;
  const filteredDirectoryVolunteers = directoryVolunteers.filter((v) => {
    const q = directoryQuery.trim().toLowerCase();
    if (!q) return true;
    return [v.name, v.group, v.phone || "", v.email || ""].join(" ").toLowerCase().includes(q);
  });

  const isLight = theme === "light";
  const shell = isLight ? "bg-paper text-ink" : "bg-ink text-paper";
  const panel = isLight ? "bg-white border-ink/15" : "bg-paper/5 border-paper/15";
  const panelSoft = isLight ? "bg-ink/[0.035] border-ink/15" : "bg-paper/[0.035] border-paper/15";
  const muted = isLight ? "text-ink/55" : "text-paper/55";
  const mutedStrong = isLight ? "text-ink/70" : "text-paper/70";
  const input = isLight
    ? "border-[#b85668]/60 bg-white text-ink"
    : "border-[#b85668]/60 bg-ink text-paper";

  const helpContent = {
    welcome: {
      title: "Come usare la dashboard",
      body: "Parti da Cosa richiede attenzione. Scegli un turno, controlla le persone disponibili e verifica la squadra. I simboli ? spiegano le funzioni senza uscire dalla schermata.",
    },
    coverage: {
      title: "Copertura",
      body: "Indica quante persone sono assegnate rispetto a quante ne servono nel turno selezionato. 100% significa turno completo; sotto 100% restano posti da coprire.",
    },
    priorities: {
      title: "Cosa richiede attenzione",
      body: `Riassume i problemi operativi del ${day}: turni incompleti, volontari disponibili nella fascia ma non ancora assegnati e posti mancanti. Tocca una voce per andare direttamente al punto da risolvere.`,
    },
    regia: {
      title: "Regia del turno",
      body: "Scegli data e fascia, poi tocca l’attività. Vedrai subito quante persone sono assegnate, quante mancano e potrai aprire la gestione di quel turno.",
    },
    turn: {
      title: "Turno",
      body: `È la gestione del turno selezionato: ${day} · ${slot} · ${activity}. Qui puoi cambiare il turno, cercare volontari compatibili e passare alla scelta delle persone.`,
    },
    people: {
      title: "Persone",
      body: `Mostra chi è compatibile con ${day} · ${slot} · ${activity}. “Disponibile” significa assegnabile ora; “occupato in questo orario” o “impegnato in altra fascia” segnala un impegno già presente da valutare prima dell’assegnazione.`,
    },
    team: {
      title: "Squadra",
      body: "Mostra le persone già assegnate al turno. Da qui controlli la copertura, modifichi i dettagli, fissi la squadra quando è stabilizzata e la condividi o esporti.",
    },
    suggest: {
      title: "Proposta automatica",
      body: "Propone persone compatibili con data, fascia e attività. È un aiuto alla scelta: controlla sempre la squadra prima di considerarla definitiva.",
    },
    pin: {
      title: "Fissa squadra",
      body: "Segna la squadra come stabilizzata per distinguerla da quelle ancora in lavorazione. Puoi sbloccarla in seguito.",
    },
    live: {
      title: "Modalità operativa",
      body: "Usa dati reali e salva le modifiche organizzative nell’archivio centrale. Per fare prove senza conseguenze usa Prove tecniche.",
    },
  } as const;

  const compatible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activeVolunteers.filter((v) => {
      const matchesDay = !day || v.days.includes(day);
      const matchesSlot = !slot || v.slots.includes(slot);
      const parentActivity = activity.includes(" — ") ? activity.split(" — ")[0] : activity;
      const matchesActivity = !activity || v.activities.includes(activity) || v.activities.includes(parentActivity);
      const matchesQuery =
        !q || [v.name, v.group, ...v.skills].join(" ").toLowerCase().includes(q);
      return matchesDay && matchesSlot && matchesActivity && matchesQuery;
    });
  }, [day, slot, activity, query, dataMode, testSize]);

  const teamMembers = activeVolunteers.filter((v) => selectedTeam?.memberIds.includes(v.id));
  const activeVolunteerIds = new Set(activeVolunteers.map((v) => v.id));
  const assignedThisShiftIds = new Set(
    teams
      .filter((team) => team.day === day && team.slot === slot)
      .flatMap((team) => team.memberIds)
      .filter((id) => activeVolunteerIds.has(id)),
  );
  const availableThisShift = activeVolunteers.filter((v) => v.days.includes(day) && v.slots.includes(slot));
  const availableUnassignedCount = availableThisShift.filter((v) => !assignedThisShiftIds.has(v.id)).length;
  const shiftSummary = teams
    .filter((team) => team.day === day)
    .map((team) => ({ activity: team.activity, slot: team.slot, assigned: team.memberIds.filter((id) => activeVolunteerIds.has(id)).length, target: team.target }));
  const uncoveredPlaces = shiftSummary.reduce((sum, item) => sum + Math.max(0, item.target - item.assigned), 0);
  const underCoveredTeams = teams.filter((team) =>
    team.day === day && team.memberIds.filter((id) => activeVolunteerIds.has(id)).length < team.target
  );
  const firstUnderCoveredTeam = underCoveredTeams[0];
  const personalMatches = useMemo(() => {
    const q = personalQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return activeVolunteers.filter((v) =>
      [v.name, v.group, ...v.skills, ...v.activities].join(" ").toLowerCase().includes(q)
    ).slice(0, 8);
  }, [personalQuery, dataMode, testSize]);
  const personalVolunteer = activeVolunteers.find((v) => v.id === personalVolunteerId);
  const personalTeams = teams
    .filter((team) => personalVolunteer ? team.memberIds.includes(personalVolunteer.id) : false)
    .sort((a, b) => {
      const days = ["28 ottobre", "29 ottobre", "30 ottobre", "31 ottobre", "1 novembre"];
      const slots = ["Mattina", "Pomeriggio", "Sera"];
      return (days.indexOf(a.day) - days.indexOf(b.day)) || (slots.indexOf(a.slot) - slots.indexOf(b.slot));
    });
  const personalNextTeam = personalTeams[0];

  function addActivity() {
    const clean = newActivity.trim().replace(/\s+/g, " ");
    if (!clean) return;
    const fullName = newParent === "__new__" ? clean : `${newParent} — ${clean}`;
    const duplicate = activities.some((item) => item.localeCompare(fullName, "it", { sensitivity: "base" }) === 0);
    if (duplicate) return;
    setActivities((current) => [...current, fullName]);
    setTeams((current) => [...current, {
      id: `team-${Date.now()}`,
      name: fullName,
      day: day || "29 ottobre",
      slot: slot || "Mattina",
      place: "Da definire",
      activity: fullName,
      target: 1,
      memberIds: [],
      pinned: false,
    }]);
    setActivity(fullName);
    setNewActivity("");
  }

  function renameActivity(oldName: string) {
    const clean = editActivityValue.trim().replace(/\s+/g, " ");
    if (!clean || activities.some((item) => item !== oldName && item.localeCompare(clean, "it", { sensitivity: "base" }) === 0)) return;
    setActivities((current) => current.map((item) => item === oldName ? clean : item));
    setTeams((current) => current.map((team) => team.activity === oldName ? { ...team, activity: clean, name: team.name === oldName ? clean : team.name } : team));
    if (activity === oldName) setActivity(clean);
    setEditingActivity(null);
    setEditActivityValue("");
  }

  function deleteActivity(name: string) {
    if (["Accoglienza", "Logistica", "Conferenze", "Allestimento"].includes(name)) return;
    setActivities((current) => current.filter((item) => item !== name));
    setTeams((current) => current.filter((team) => team.activity !== name));
    if (activity === name) setActivity("Accoglienza");
  }

  function updateSelectedTeam(patch: Partial<Team>) {
    setTeams((current) => {
      if (selectedTeam.id === "__draft__") return [...current, { ...selectedTeam, ...patch, id: `team-${Date.now()}` }];
      return current.map((team) => team.id === selectedTeam.id ? { ...team, ...patch } : team);
    });
  }

  function toggleMember(id: string) {
    const person = activeVolunteers.find((volunteer) => volunteer.id === id);
    const personName = person?.name || "Persona";
    const alreadyHere = selectedTeam.memberIds.includes(id);
    if (alreadyHere) {
      setTeams((current) => current.map((team) => team.id === selectedTeam.id ? { ...team, memberIds: team.memberIds.filter((memberId) => memberId !== id) } : team));
      setFeedback(`✓ ${personName} rimosso da ${selectedTeam.activity} · ${day} ${slot}`);
      return;
    }
    const conflict = teams.find((team) => team.id !== selectedTeam.id && team.day === day && team.slot === slot && team.memberIds.includes(id));
    if (conflict && !window.confirm(`${personName} è già assegnato a "${conflict.name}" nello stesso orario. Vuoi spostarlo qui?`)) {
      setFeedback(`⚠ Operazione annullata: ${personName} resta in ${conflict.name}`);
      return;
    }
    setTeams((current) => {
      const withoutConflict = current.map((team) => conflict && team.id === conflict.id ? { ...team, memberIds: team.memberIds.filter((memberId) => memberId !== id) } : team);
      if (selectedTeam.id === "__draft__") {
        return [...withoutConflict, { ...selectedTeam, id: `team-${Date.now()}`, memberIds: [id] }];
      }
      return withoutConflict.map((team) => team.id === selectedTeam.id ? { ...team, memberIds: [...team.memberIds, id] } : team);
    });
    setFeedback(`✓ ${personName} assegnato a ${selectedTeam.activity} · ${day} ${slot}`);
    if (window.innerWidth < 1024) setMobileTab("squadra");
  }

  function autoSuggest() {
    if (suggestedMemberIds.length > 0) {
      const removeIds = new Set(suggestedMemberIds);
      setTeams((current) => current.map((team) =>
        team.id === selectedTeam.id ? { ...team, memberIds: team.memberIds.filter((id) => !removeIds.has(id)) } : team
      ));
      setSuggestedMemberIds([]);
      setFeedback("Proposta automatica annullata.");
      return;
    }
    const busy = new Set(teams.filter((team) => team.id !== selectedTeam.id && team.day === day && team.slot === slot).flatMap((team) => team.memberIds));
    const existing = selectedTeam.memberIds.filter((id) => !busy.has(id));
    const missing = Math.max(0, selectedTeam.target - existing.length);
    const additions = compatible
      .filter((v) => !busy.has(v.id) && !existing.includes(v.id))
      .slice(0, missing)
      .map((v) => v.id);
    const suggested = [...existing, ...additions];
    setSuggestedMemberIds(additions);
    setFeedback(additions.length ? `✓ Proposte ${additions.length} persone compatibili. Controlla la squadra prima di fissarla.` : "Nessuna nuova persona compatibile da proporre.");
    setTeams((current) => selectedTeam.id === "__draft__"
      ? [...current, { ...selectedTeam, id: `team-${Date.now()}`, memberIds: suggested }]
      : current.map((team) => team.id === selectedTeam.id ? { ...team, memberIds: suggested } : team));
    if (window.innerWidth < 1024) setMobileTab("squadra");
  }

  function updateVolunteerOpsLocal(id: string, patch: Partial<Pick<Volunteer, "status" | "confirmed" | "priority" | "internalNotes" | "tags">>) {
    if (dataMode !== "live" || !sessionEmail) return;
    setLiveVolunteers((current) => current.map((volunteer) =>
      volunteer.id === id ? { ...volunteer, ...patch } : volunteer
    ));
    saveVolunteerOps(id, {
      status: patch.status,
      confirmed: patch.confirmed,
      priority: patch.priority,
      internalNotes: patch.internalNotes,
      tags: patch.tags,
    }).catch(() => setLiveError("Salvataggio scheda volontario non riuscito."));
  }

  function togglePinned() {
    if (!selectedTeam) return;
    setTeams((current) =>
      current.map((team) =>
        team.id === selectedTeam.id ? { ...team, pinned: !team.pinned } : team,
      ),
    );
    setFeedback(selectedTeam.pinned ? "Squadra sbloccata: puoi continuare a modificarla." : "✓ Squadra fissata come configurazione di riferimento.");
  }

  function teamShareText() {
    const members = activeVolunteers.filter((v) => selectedTeam.memberIds.includes(v.id));
    return [
      "COSTACCIARO 2026",
      "SQUADRA OPERATIVA",
      "────────────────────",
      `Squadra: ${selectedTeam.name}`,
      `Data: ${selectedTeam.day}`,
      `Fascia: ${selectedTeam.slot}`,
      `Attività: ${selectedTeam.activity}`,
      `Luogo: ${selectedTeam.place}`,
      "",
      "PERSONE ASSEGNATE",
      ...(members.length ? members.map((m, i) => `${i + 1}. ${m.name} — ${m.group}`) : ["Nessuna persona assegnata"]),
      "",
      `Copertura: ${members.length}/${selectedTeam.target}`,
    ].join("\n");
  }

  function exportText() {
    const text = teamShareText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTeam.name.replace(/\s+/g, "-").toLowerCase()}-${selectedTeam.day.replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function shareEmail() {
    window.location.href = `mailto:?subject=${encodeURIComponent(`Costacciaro 2026 — ${selectedTeam.name} — ${selectedTeam.day} ${selectedTeam.slot}`)}&body=${encodeURIComponent(teamShareText())}`;
  }

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(teamShareText())}`, "_blank", "noopener,noreferrer");
  }

  async function shareSystem() {
    const text = teamShareText();
    if (navigator.share) {
      try { await navigator.share({ title: `Costacciaro 2026 — ${selectedTeam.name}`, text }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(text);
      window.alert("Testo del turno copiato. Puoi incollarlo nel messaggio che preferisci.");
    } catch {
      window.alert(text);
    }
  }

  const coverage = Math.min(
    100,
    Math.round((teamMembers.length / Math.max(1, selectedTeam.target)) * 100),
  );

  function goToSection(id: "turno-workspace" | "people-workspace" | "coverage-workspace") {
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <main className={`min-h-screen transition-colors ${shell}`}>
      <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-4 md:px-5 lg:px-8 xl:px-10 lg:py-7">
        <header className="mb-4 border-b-2 border-[#b85668] pb-3 sm:mb-5 lg:mb-6 lg:pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-2 sm:items-start sm:gap-3">
              <div className="flex h-14 w-28 shrink-0 items-center justify-start sm:h-24 sm:w-48 lg:h-28 lg:w-56">
                <div className="font-black uppercase leading-none text-[#e7254b]">
                  <span className="block text-lg sm:text-3xl">Costacciaro</span>
                  <span className="block text-2xl sm:text-5xl">2026</span>
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="mt-1 text-lg font-black uppercase leading-[0.95] sm:text-2xl lg:text-4xl">
                  Dashboard Controllo
                </h1>
                <p className={`mt-1 max-w-2xl text-[10px] leading-snug sm:text-xs lg:text-sm ${muted}`}>
                  Gestione volontari · <span className="text-[#c76476]">{dataMode === "test" ? "PROVE TECNICHE · DATI FITTIZI" : "MODALITÀ OPERATIVA"}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:items-stretch">
            <div className="col-span-full flex flex-wrap items-center gap-2 sm:mr-2">
              <button type="button" onClick={() => switchDataMode("test")}
                className={`min-h-11 border-2 px-3 text-[10px] font-black uppercase sm:text-xs ${dataMode === "test" ? "border-amber-500 bg-amber-500 text-black" : "border-[#b85668]"}`}>
                Prove tecniche 🧪
              </button>
              <button type="button" onClick={() => switchDataMode("live")}
                className={`min-h-11 border-2 px-3 text-[10px] font-black uppercase sm:text-xs ${dataMode === "live" ? "border-emerald-600 bg-emerald-600 text-white" : "border-[#b85668]"}`}>
                Modalità operativa
              </button>
              {dataMode === "test" ? (
                <select value={testSize} onChange={(e) => setTestSize(Number(e.target.value) as 30 | 40 | 50)}
                  className={`min-h-11 border-2 border-amber-500 px-2 text-xs font-black ${input}`} aria-label="Numero volontari fittizi">
                  <option value={30}>30 fittizi</option><option value={40}>40 fittizi</option><option value={50}>50 fittizi</option>
                </select>
              ) : null}
              {dataMode === "test" ? (
                <button type="button" onClick={resetTestEnvironment}
                  className="min-h-11 border-2 border-amber-500 px-3 text-[10px] font-black uppercase sm:text-xs">
                  Ripristina prova
                </button>
              ) : null}
            </div>

              <button type="button"
                onClick={() => { const next = !personalOpen; setPersonalOpen(next); if (next) { setDirectoryOpen(false); setCatalogOpen(false); } }}
                aria-label="Il mio Costacciaro: consulta i turni di una persona"
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 border-2 border-[#b85668] px-2 text-center font-black uppercase sm:min-h-11 sm:flex-row sm:gap-2 sm:px-3 ${personalOpen ? "bg-[#b85668] text-white" : ""}`}>
                <UserRound className="size-4" />
                <span className="text-[10px] sm:text-xs">I miei turni</span>
                <span className={`text-[8px] font-medium normal-case sm:hidden ${personalOpen ? "text-white/80" : muted}`}>dove · quando · squadra</span>
              </button>
              <button type="button"
                onClick={() => { const next = !directoryOpen; setDirectoryOpen(next); if (next) { setPersonalOpen(false); setCatalogOpen(false); } }}
                aria-label="Rubrica: cerca contatti di volontari"
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 border-2 border-[#b85668] px-2 text-center font-black uppercase sm:min-h-11 sm:flex-row sm:gap-2 sm:px-3 ${directoryOpen ? "bg-[#b85668] text-white" : ""}`}>
                <Users className="size-4" />
                <span className="text-[10px] sm:text-xs">Contatti</span>
                <span className={`text-[8px] font-medium normal-case sm:hidden ${directoryOpen ? "text-white/80" : muted}`}>telefono · email</span>
              </button>
              <button type="button"
                onClick={() => { const next = !catalogOpen; setCatalogOpen(next); if (next) { setPersonalOpen(false); setDirectoryOpen(false); } }}
                aria-label="Gestisci attività e sottogruppi"
                className={`flex min-h-11 items-center justify-center gap-1.5 border-2 border-[#b85668] px-2 text-[10px] font-black uppercase sm:gap-2 sm:px-3 sm:text-xs ${catalogOpen ? "bg-[#b85668] text-white" : ""}`}>
                <Plus className="size-4" /><span>Attività</span>
              </button>
              <button
                type="button"
                onClick={() => setHelpTopic("welcome")}
                className="flex min-h-11 items-center justify-center gap-1.5 border-2 border-[#b85668] px-2 text-[10px] font-black uppercase sm:gap-2 sm:px-3 sm:text-xs"
                aria-label="Apri guida rapida"
              >
                <CircleHelp className="size-4" /><span>Aiuto</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
                className={`flex min-h-11 items-center justify-center gap-1.5 border-2 border-[#b85668] px-2 text-[10px] font-black uppercase sm:shrink-0 sm:gap-2 sm:px-3 sm:text-xs ${isLight ? "bg-white text-ink" : "bg-ink text-paper"}`}
                aria-label={isLight ? "Attiva sfondo scuro" : "Attiva sfondo chiaro"}
              >
                {isLight ? <Moon className="size-4" /> : <Sun className="size-4" />}
                <span>{isLight ? "Scuro" : "Chiaro"}</span>
              </button>
            </div>
          </div>

        </header>

        {feedback ? (
          <div role="status" aria-live="polite" className="fixed bottom-4 left-1/2 z-50 w-[min(92vw,720px)] -translate-x-1/2 border-2 border-emerald-600 bg-emerald-950 px-4 py-3 text-sm font-bold text-white shadow-xl">
            {feedback}
          </div>
        ) : null}

        {helpTopic ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label={helpContent[helpTopic].title}>
            <div className={`w-full max-w-lg border-2 border-[#b85668] p-5 shadow-2xl ${isLight ? "bg-white text-ink" : "bg-ink text-paper"}`}>
              <div className="flex items-start gap-3">
                <CircleHelp className="mt-0.5 size-6 shrink-0 text-[#c76476]" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-black uppercase">{helpContent[helpTopic].title}</h2>
                  <p className={`mt-2 text-sm leading-relaxed ${mutedStrong}`}>{helpContent[helpTopic].body}</p>
                </div>
              </div>
              <button type="button" onClick={() => {
                if (helpTopic === "welcome") localStorage.setItem("costacciaro-dashboard-onboarding-seen", "1");
                setHelpTopic(null);
              }} className="mt-4 min-h-11 w-full border-2 border-[#b85668] bg-[#b85668] px-4 text-sm font-black uppercase text-white">
                Ho capito
              </button>
            </div>
          </div>
        ) : null}

        {catalogOpen ? (
          <section className={`mb-3 border-2 p-3 lg:p-5 ${panel}`}>
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-[10px] font-black uppercase text-[#c76476]">Catalogo operativo</p><h2 className="text-lg font-black uppercase">Attività e sottogruppi</h2></div>
              <button type="button" onClick={() => setCatalogOpen(false)} className="text-xs font-black uppercase">Chiudi</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {macroActivities.map((macro) => {
                const children = activities.filter((item) => item.startsWith(`${macro} — `));
                const tone = paletteFor(macro);
                return <div key={macro} className="min-w-[150px] border-l-4 border-y border-r p-2" style={activityTone(macro, isLight)}>
                  <button type="button" onClick={() => setActivity(macro)} className="w-full text-left text-xs font-black uppercase" style={{ color: tone.accent }}>{macro}</button>
                  {children.length ? <div className="mt-2 grid gap-1">{children.map((item) => (
                    <div key={item} className="flex items-center border-t pt-1" style={{ borderColor: tone.accent }}>
                      {editingActivity === item ? <><input autoFocus value={editActivityValue} onChange={(e) => setEditActivityValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") renameActivity(item); if (e.key === "Escape") setEditingActivity(null); }} className="min-w-0 flex-1 bg-transparent py-1 text-[11px] font-bold outline-none" spellCheck /><button type="button" onClick={() => renameActivity(item)} className="px-1 text-[9px] font-black">OK</button></>
                      : <><button type="button" onClick={() => setActivity(item)} className="min-w-0 flex-1 text-left text-[11px] font-bold">{item.split(" — ").slice(1).join(" — ")}</button><button type="button" aria-label={`Rinomina ${item}`} onClick={() => { setEditingActivity(item); setEditActivityValue(item); }} className="px-1 opacity-60"><Pencil className="size-3" /></button><button type="button" aria-label={`Elimina ${item}`} onClick={() => deleteActivity(item)} className="px-1 opacity-60"><Trash2 className="size-3" /></button></>}
                    </div>
                  ))}</div> : <div className={`mt-1 text-[9px] ${muted}`}>Nessun sottogruppo</div>}
                </div>;
              })}
            </div>
            <div className="mt-3 grid max-w-2xl gap-2 sm:grid-cols-[180px_1fr_auto]">
              <select value={newParent} onChange={(e) => setNewParent(e.target.value)} className={`min-h-10 border-2 px-2 text-sm ${input}`}>
                {macroActivities.map((item) => <option key={item} value={item}>{item}</option>)}
                <option value="__new__">+ Nuova macro-attività</option>
              </select>
              <input value={newActivity} onChange={(e) => setNewActivity(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addActivity(); }}
                placeholder={newParent === "__new__" ? "Nome nuova macro-attività" : "Nome sottogruppo, es. Parcheggi"} spellCheck autoCapitalize="sentences" className={`min-h-10 min-w-0 border-2 px-3 text-sm outline-none ${input}`} />
              <button type="button" onClick={addActivity} className="min-h-10 border-2 border-[#b85668] bg-[#b85668] px-3 text-xs font-black uppercase text-white">Aggiungi</button>
            </div>
            <p className={`mt-2 text-[10px] sm:text-xs ${muted}`}>Evita duplicati identici e normalizza automaticamente gli spazi. Le nuove voci restano separate dai dati originali del modulo.</p>
          </section>
        ) : null}

        {personalOpen ? (
          <section className={`mb-3 border-2 p-3 lg:p-5 ${panel}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase text-[#c76476]">Area personale · DATI DI PROVA</p>
                <h2 className="text-lg font-black uppercase lg:text-2xl">Il mio Costacciaro</h2>
                <p className={`mt-1 text-xs ${muted}`}>Consulta il programma operativo di una persona: dove andare, quando, cosa fare e con chi.</p>
              </div>
              <button type="button" onClick={() => setPersonalOpen(false)} className="text-xs font-black uppercase">Chiudi</button>
            </div>

            <div className="relative mt-4 max-w-xl">
              <label className="block text-[11px] sm:text-xs">
                <span className="mb-1 block font-black uppercase opacity-70">Cerca una persona</span>
                <div className={`flex min-h-11 items-center gap-2 border-2 px-3 ${input}`}>
                  <Search className="size-4 shrink-0 opacity-60" />
                  <input
                    value={personalQuery}
                    onChange={(e) => { setPersonalQuery(e.target.value); setPersonalVolunteerId(""); }}
                    placeholder="Nome, cognome, gruppo, attività o competenza"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:opacity-45"
                  />
                  {personalQuery ? <button type="button" onClick={() => { setPersonalQuery(""); setPersonalVolunteerId(""); }} className="text-[10px] font-black uppercase">Pulisci</button> : null}
                </div>
              </label>
              {personalMatches.length && !personalVolunteer ? (
                <div className={`absolute z-20 mt-1 max-h-64 w-full overflow-auto border-2 border-[#b85668] p-1 ${isLight ? "bg-white" : "bg-ink"}`}>
                  {personalMatches.map((v) => (
                    <button key={v.id} type="button"
                      onClick={() => { setPersonalVolunteerId(v.id); setPersonalQuery(""); }}
                      className={`block w-full border-b px-3 py-2 text-left last:border-b-0 ${isLight ? "border-ink/10 hover:bg-ink/5" : "border-paper/10 hover:bg-paper/10"}`}>
                      <strong className="block text-sm">{v.name}</strong>
                      <span className={`text-[10px] ${muted}`}>{v.group} · {v.activities.join(" · ")}</span>
                    </button>
                  ))}
                </div>
              ) : personalQuery.trim().length >= 2 && !personalVolunteer ? (
                <p className={`mt-1 text-xs ${muted}`}>Nessun nominativo trovato.</p>
              ) : null}
            </div>

            {personalVolunteer ? (
              <>
            <div className={`mt-3 flex flex-wrap items-center justify-between gap-2 border-l-4 border-[#b85668] px-3 py-2 ${panelSoft}`}>
              <div><span className="text-[10px] font-black uppercase text-[#c76476]">Persona selezionata</span><strong className="ml-2 text-sm">{personalVolunteer.name} · {personalVolunteer.group}</strong></div>
              <button type="button" onClick={() => { setPersonalVolunteerId(""); setPersonalQuery(""); }} className="text-[10px] font-black uppercase">Cambia persona</button>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_.8fr]">
              <div className={`border-2 border-[#b85668] p-4 lg:p-5 ${panelSoft}`}>
                <p className="text-[10px] font-black uppercase text-[#c76476]">Prossimo turno</p>
                {personalNextTeam ? (
                  <>
                    <h3 className="mt-1 text-xl font-black uppercase lg:text-3xl">{personalNextTeam.activity}</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <Info label="Quando" value={`${personalNextTeam.day} · ${personalNextTeam.slot}`} light={isLight} />
                      <Info label="Dove" value={personalNextTeam.place} light={isLight} />
                      <Info label="Squadra" value={personalNextTeam.name} light={isLight} />
                      <Info label="Compito" value={personalNextTeam.activity} light={isLight} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-black uppercase sm:text-xs">
                      <span className="flex items-center gap-1 border px-2 py-1.5"><CalendarDays className="size-3.5" />{personalNextTeam.day}</span>
                      <span className="flex items-center gap-1 border px-2 py-1.5"><Clock3 className="size-3.5" />{personalNextTeam.slot}</span>
                      <span className="flex items-center gap-1 border px-2 py-1.5"><MapPin className="size-3.5" />{personalNextTeam.place}</span>
                    </div>
                  </>
                ) : <p className={`mt-3 text-sm ${muted}`}>Nessun turno assegnato al momento.</p>}
              </div>

              <div className={`border-2 p-4 ${panel}`}>
                <p className="text-[10px] font-black uppercase text-[#c76476]">I miei turni</p>
                <div className="mt-2 space-y-2">
                  {personalTeams.length ? personalTeams.map((team) => (
                    <div key={team.id} className={`border p-3 ${panelSoft}`}>
                      <strong className="block text-sm uppercase">{team.day} · {team.slot}</strong>
                      <span className="mt-1 block text-xs">{team.activity} · {team.place}</span>
                    </div>
                  )) : <p className={`text-xs ${muted}`}>Nessuna assegnazione.</p>}
                </div>
              </div>
            </div>

            {personalNextTeam ? (
              <div className={`mt-3 border p-3 ${panelSoft}`}>
                <p className="text-[10px] font-black uppercase text-[#c76476]">Con chi sono</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {activeVolunteers.filter((v) => personalNextTeam.memberIds.includes(v.id)).map((v) => (
                    <span key={v.id} className="border px-2 py-1 text-xs font-bold">{v.name} · {v.group}</span>
                  ))}
                </div>
              </div>
            ) : null}
              </>
            ) : (
              <div className={`mt-4 border-2 p-4 text-sm ${panelSoft}`}>
                Cerca te stesso oppure un altro volontario per vedere turni, luogo, attività e squadra.
              </div>
            )}
            <p className={`mt-3 text-[10px] sm:text-xs ${muted}`}>Accesso nominativo in modalità demo. L'autenticazione reale resta predisposta ma non attiva.</p>
          </section>
        ) : null}

        {directoryOpen ? (
          <section className={`mb-3 border-2 p-3 lg:p-5 ${panel}`}>
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-[10px] font-black uppercase text-[#c76476]">Contatti volontari</p><h2 className="text-lg font-black uppercase">Telefono ed email dei volontari</h2></div>
              <button type="button" onClick={() => setDirectoryOpen(false)} className="text-xs font-black uppercase">Chiudi</button>
            </div>
            <label className="mt-3 block">
              <span className={`mb-1 block text-[10px] font-black uppercase ${mutedStrong}`}>Cerca nella rubrica</span>
              <div className={`flex min-h-10 items-center gap-2 border px-3 ${input}`}>
                <Search className="size-4 shrink-0 opacity-60" />
                <input value={directoryQuery} onChange={(e) => setDirectoryQuery(e.target.value)}
                  placeholder="Nome, cognome, gruppo, telefono o email"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:opacity-45" />
              </div>
            </label>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {filteredDirectoryVolunteers.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setExpandedVolunteerIds((current) => current.includes(v.id) ? current.filter((id) => id !== v.id) : [...current, v.id])}
                  className={`w-full border p-3 text-left ${isLight ? "border-ink/15" : "border-paper/20"}`}
                >
                  <strong className="text-sm">{v.name}</strong>
                  <span className={`ml-1 text-xs ${muted}`}>· {v.group}</span>
                  {expandedVolunteerIds.includes(v.id) ? (
                    <span className="mt-2 block text-xs" onClick={(e) => e.stopPropagation()}>
                      <span className="flex flex-wrap gap-x-4 gap-y-1">
                        <a
                          href={v.phone ? `tel:${v.phone.replace(/\s+/g, "")}` : undefined}
                          className={v.phone ? "font-bold underline decoration-[#b85668] underline-offset-2" : muted}
                        >
                          <Phone className="mr-1 inline size-3.5" />{v.phone || "Telefono non disponibile"}
                        </a>
                        <a
                          href={v.email ? `mailto:${v.email}` : undefined}
                          className={v.email ? "font-bold underline decoration-[#b85668] underline-offset-2" : muted}
                        >
                          <Mail className="mr-1 inline size-3.5" />{v.email || "Email non disponibile"}
                        </a>
                      </span>
                      {dataMode === "live" ? (
                        <span className="mt-3 grid gap-2 border-t pt-3">
                          <span className="grid grid-cols-2 gap-2">
                            <label className="grid gap-1">
                              <span className={muted}>Stato</span>
                              <select
                                value={v.status || "nuovo"}
                                onChange={(e) => updateVolunteerOpsLocal(v.id, { status: e.target.value })}
                                className={`min-h-9 border px-2 ${input}`}
                              >
                                <option value="nuovo">Nuovo</option>
                                <option value="da_contattare">Da contattare</option>
                                <option value="confermato">Confermato</option>
                                <option value="assegnato">Assegnato</option>
                                <option value="rinuncia">Rinuncia</option>
                              </select>
                            </label>
                            <label className="grid gap-1">
                              <span className={muted}>Priorità</span>
                              <input
                                type="number"
                                min={0}
                                max={9}
                                value={v.priority ?? 0}
                                onChange={(e) => updateVolunteerOpsLocal(v.id, { priority: Number(e.target.value) || 0 })}
                                className={`min-h-9 border px-2 ${input}`}
                              />
                            </label>
                          </span>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={Boolean(v.confirmed)}
                              onChange={(e) => updateVolunteerOpsLocal(v.id, { confirmed: e.target.checked })}
                            />
                            <span className="font-bold">Disponibilità confermata dall’organizzazione</span>
                          </label>
                          <span className="grid gap-1">
                            <span className={muted}>Disponibilità dichiarata</span>
                            <span>{[v.days?.join(", "), v.hours, v.slots?.join(", ")].filter(Boolean).join(" · ") || "Non specificata"}</span>
                          </span>
                          {v.restrictions ? <span><strong>Da evitare / limitazioni:</strong> {v.restrictions}</span> : null}
                          {v.notes ? <span><strong>Note del candidato:</strong> {v.notes}</span> : null}
                          <label className="grid gap-1">
                            <span className={muted}>Note interne organizzatori</span>
                            <textarea
                              value={v.internalNotes || ""}
                              onChange={(e) => setLiveVolunteers((current) => current.map((volunteer) => volunteer.id === v.id ? { ...volunteer, internalNotes: e.target.value } : volunteer))}
                              onBlur={(e) => updateVolunteerOpsLocal(v.id, { internalNotes: e.target.value })}
                              className={`min-h-20 border p-2 ${input}`}
                              placeholder="Non visibili nel modulo candidature"
                            />
                          </label>
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            {filteredDirectoryVolunteers.length === 0 ? <p className={`mt-3 text-sm ${muted}`}>Nessun contatto trovato.</p> : null}
            <p className={`mt-3 text-[10px] sm:text-xs ${muted}`}>DATI DI PROVA · Il dettaglio operativo modificabile verrà collegato al profilo senza alterare la risposta originale.</p>
          </section>
        ) : null}

        <section className={`mb-3 border-2 p-3 text-xs font-bold sm:text-sm ${dataMode === "test" ? "border-amber-500 bg-amber-500/10" : "border-emerald-600 bg-emerald-600/10"}`}>
          {dataMode === "test" ? (
            `PROVE TECNICHE — ambiente isolato · ${testSize} volontari fittizi · nessun dato reale`
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">MODALITÀ OPERATIVA — archivio centrale protetto · {liveLoading ? "caricamento…" : `${liveVolunteers.length} volontari reali`}<button type="button" onClick={() => setHelpTopic("live")} className="rounded-full p-1" aria-label="Spiega modalità operativa"><CircleHelp className="size-4" /></button></div>
              {sessionEmail ? (
                <div className="flex flex-wrap items-center gap-2 font-medium">
                  <span>Accesso: {sessionEmail}</span>
                  <button type="button" onClick={signOutOrganizer} className="border border-current px-2 py-1 font-black uppercase">Esci</button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="Email organizzatore autorizzato" className={`min-h-11 flex-1 border-2 px-3 ${input}`} />
                  <button type="button" onClick={requestOrganizerAccess}
                    className="min-h-11 border-2 border-emerald-600 bg-emerald-600 px-4 font-black uppercase text-white">Invia link di accesso</button>
                </div>
              )}
              {sessionEmail && liveSyncLabel ? <div className="font-medium">Sincronizzazione: {liveSyncLabel}</div> : null}
              {authMessage ? <div className="font-medium">{authMessage}</div> : null}
              {liveError ? <div className="font-black text-[#c76476]">{liveError}</div> : null}
            </div>
          )}
        </section>

        <section className="grid grid-cols-4 gap-1.5 lg:gap-3">
          <Kpi label="Totali" value={String(activeVolunteers.length)} light={isLight} />
          <Kpi label="Disponibili" value={String(compatible.length)} light={isLight} />
          <Kpi label="Assegnati" value={String(teamMembers.length)} light={isLight} />
          <Kpi label="Copertura" value={`${coverage}%`} light={isLight} onHelp={() => setHelpTopic("coverage")} />
        </section>

        <section className={`mt-3 border-2 p-3 lg:mt-4 lg:p-4 ${underCoveredTeams.length ? "border-[#b85668] bg-[#b85668]/10" : isLight ? "border-emerald-600/50 bg-emerald-50" : "border-emerald-700/50 bg-emerald-950/20"}`}>
          <div className="flex items-center gap-2">
            {underCoveredTeams.length ? <AlertTriangle className="size-5 text-[#c76476]" /> : <CheckCircle2 className="size-5 text-emerald-600" />}
            <div>
              <div className="flex items-center gap-1"><p className="text-[10px] font-black uppercase text-[#c76476]">Priorità operative</p><button type="button" onClick={() => setHelpTopic("priorities")} aria-label="Spiega priorità operative" className="rounded-full p-1"><CircleHelp className="size-4" /></button></div>
              <h2 className="text-base font-black uppercase lg:text-lg">{underCoveredTeams.length ? "Cosa richiede attenzione" : "Nessuna criticità di copertura"}</h2>
            </div>
          </div>
          {underCoveredTeams.length ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <button type="button" onClick={() => {
                if (firstUnderCoveredTeam) {
                  setDay(firstUnderCoveredTeam.day);
                  setSlot(firstUnderCoveredTeam.slot);
                  setActivity(firstUnderCoveredTeam.activity);
                  setMobileTab("turno");
                  setFocusContext(`TURNI DA COPRIRE — aperto il primo turno incompleto: ${firstUnderCoveredTeam.day} · ${firstUnderCoveredTeam.slot} · ${firstUnderCoveredTeam.activity}. Mancano ${Math.max(0, firstUnderCoveredTeam.target - firstUnderCoveredTeam.memberIds.filter((id) => activeVolunteerIds.has(id)).length)} persone.`);
                  goToSection("turno-workspace");
                }
              }} className={`min-h-14 border p-3 text-left ${panelSoft}`}>
                <strong className="block text-sm">{underCoveredTeams.length} turni da coprire</strong>
                <span className={`text-[10px] ${muted}`}>Tocca per aprire il primo turno incompleto</span>
              </button>
              <button type="button" onClick={() => { setPeopleFilterOpen(true); setMobileTab("persone"); setFocusContext(`DISPONIBILI NELLA FASCIA — ${availableUnassignedCount} volontari sono disponibili e non ancora assegnati il ${day} · ${slot}. Qui sotto vedi ${compatible.length} persone compatibili con ${activity}; alcune possono risultare già impegnate o assegnate in base alla squadra selezionata.`); goToSection("people-workspace"); }} className={`min-h-14 border p-3 text-left ${panelSoft}`}>
                <strong className="block text-sm">{availableUnassignedCount} disponibili nella fascia</strong>
                <span className={`text-[10px] ${muted}`}>Non ancora assegnati · poi filtra i compatibili</span>
              </button>
              <button type="button" onClick={() => { setMobileTab("panoramica"); setFocusContext(`POSTI ANCORA SCOPERTI — ${uncoveredPlaces} posti da coprire il ${day}. Le celle evidenziate mostrano esattamente quali attività e fasce sono incomplete; clicca una cella per gestirla.`); goToSection("coverage-workspace"); }} className={`min-h-14 border p-3 text-left ${panelSoft}`}>
                <strong className="block text-sm">{uncoveredPlaces} posti ancora scoperti</strong>
                <span className={`text-[10px] ${muted}`}>Rivedi il quadro complessivo</span>
              </button>
            </div>
          ) : null}
        </section>

        <nav className={`sticky top-0 z-10 mt-3 grid grid-cols-4 border-2 border-[#b85668] lg:hidden ${isLight ? "bg-paper" : "bg-ink"}`}>
          {([["panoramica","Quadro"],["turno","Turno"],["persone","Persone"],["squadra","Squadra"]] as const).map(([id,label]) => (
            <button key={id} type="button" onClick={() => { setMobileTab(id); setFocusContext(""); }}
              aria-current={mobileTab === id ? "page" : undefined}
              className={`min-h-11 text-[10px] font-black uppercase ${mobileTab === id ? "bg-[#b85668] text-white" : ""}`}>
              {label}
            </button>
          ))}
        </nav>

        <section id="coverage-workspace" className={`mt-3 scroll-mt-4 lg:mt-4 ${mobileTab !== "panoramica" ? "hidden lg:block" : ""}`}>
          {focusContext ? (
            <div role="status" className={`mb-3 border-2 border-[#b85668] p-3 ${isLight ? "bg-[#b85668]/10" : "bg-[#b85668]/15"}`}>
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-[10px] font-black uppercase text-[#c76476]">Sei arrivato qui perché hai selezionato</p><p className="mt-1 text-sm font-bold">{focusContext}</p></div>
                <button type="button" onClick={() => setFocusContext("")} className="shrink-0 text-[10px] font-black uppercase">Chiudi</button>
              </div>
            </div>
          ) : null}
          <div className={`border-2 p-3 lg:p-5 ${panel}`}>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <div className="flex items-center gap-1"><p className="text-[10px] font-black uppercase text-[#c76476] sm:text-xs">Regia del turno</p><button type="button" onClick={() => setHelpTopic("regia")} aria-label="Spiega regia del turno" className="rounded-full p-1"><CircleHelp className="size-4" /></button></div>
                <h2 className="mt-1 text-lg font-black uppercase lg:text-2xl">{day || "Tutte le date"} · {slot || "Tutte le fasce"}</h2>
              </div>
              <div className={`text-xs font-bold ${mutedStrong}`}>{availableUnassignedCount} disponibili non assegnati</div>
            </div>
            <div className={`mt-3 grid gap-2 border-y py-3 sm:grid-cols-[1fr_1fr_auto] ${isLight ? "border-ink/10" : "border-paper/10"}`}>
              <Select label="Data" value={day} onChange={(value) => { setDay(value); setFocusContext(""); }} options={["28 ottobre", "29 ottobre", "30 ottobre", "31 ottobre", "1 novembre"]} icon={<CalendarDays className="size-3.5" />} inputClass={input} />
              <Select label="Fascia" value={slot} onChange={(value) => { setSlot(value); setFocusContext(""); }} options={["Mattina", "Pomeriggio", "Sera"]} inputClass={input} />
              <div className={`self-end pb-2 text-[10px] font-bold sm:text-xs ${muted}`}>Poi scegli l’attività qui sotto ↓</div>
            </div>
            <p className={`mt-2 text-[10px] sm:text-xs ${muted}`}>1. Scegli data e fascia. 2. Tocca l’attività da gestire: si apre direttamente il turno corretto.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {shiftSummary.map((item) => {
                const pct = Math.min(100, Math.round((item.assigned / item.target) * 100));
                const complete = item.assigned >= item.target;
                return (
                  <button key={item.activity} type="button" onClick={() => { setActivity(item.activity); setSlot(item.slot); setMobileTab("turno"); setFocusContext(`${item.activity.toUpperCase()} — ${day} · ${item.slot}: ${complete ? "turno coperto" : `mancano ${item.target - item.assigned} persone`}. Qui puoi vedere i compatibili e gestire la squadra.`); goToSection("turno-workspace"); }}
                    className="border-l-4 border-y border-r p-3 text-left transition-opacity hover:opacity-90"
                    style={activityTone(item.activity, isLight)}>
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-xs uppercase lg:text-sm">{item.activity}</strong>
                      <span className={`text-sm font-black ${complete ? "" : "text-[#c76476]"}`}>{item.assigned}/{item.target}</span>
                    </div>
                    <div className={`mt-2 h-1.5 ${isLight ? "bg-ink/10" : "bg-paper/10"}`}><div className="h-full" style={{ width: `${pct}%`, backgroundColor: paletteFor(item.activity).accent }} /></div>
                    <div className={`mt-1 text-[10px] ${muted}`}>{item.slot} · {complete ? "Coperto" : `Mancano ${item.target-item.assigned}`}</div>
                  </button>
                );
              })}
            </div>
            <div className={`mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-[10px] sm:text-xs ${isLight ? "border-ink/10" : "border-paper/10"}`}>
              <strong>Da sistemare</strong>
              <span className="text-[#c76476]">{shiftSummary.filter((x) => x.assigned < x.target).length} turni sotto copertura</span>
              <span>{availableUnassignedCount} disponibili non assegnati</span>
              <span>{uncoveredPlaces} posti ancora da coprire</span>
            </div>
          </div>
        </section>

        <section className={`mt-3 lg:mt-4 ${mobileTab !== "panoramica" ? "hidden lg:block" : ""}`}>
          <div className={`border-2 p-3 lg:p-5 ${panel}`}>
            <div className="flex items-end justify-between gap-2">
              <div><p className="text-[10px] font-black uppercase text-[#c76476] sm:text-xs">Quadro complessivo</p><h2 className="text-base font-black uppercase lg:text-lg">Copertura per attività e fascia</h2></div>
              <span className={`text-[10px] sm:text-xs ${muted}`}>{day}</span>
            </div>
            <div className="mt-3">
              <div className="grid gap-2 text-xs lg:grid-cols-[minmax(150px,1.3fr)_repeat(3,minmax(110px,1fr))] lg:gap-1.5">
                <div className={`hidden p-2 font-black uppercase lg:block ${muted}`}>Attività</div>
                {["Mattina","Pomeriggio","Sera"].map((s) => <div key={s} className={`hidden p-2 text-center font-black uppercase lg:block ${muted}`}>{s}</div>)}
                {activities.map((item) => (
                  <div key={item} className="grid grid-cols-3 gap-1.5 border-l-4 p-2 lg:contents" style={activityTone(item, isLight)}>
                    <div className="col-span-3 font-bold lg:col-span-1 lg:border-l-4 lg:p-2" style={activityTone(item, isLight)}>{item}</div>
                    {["Mattina","Pomeriggio","Sera"].map((s) => {
                      const team = teams.find((t) => t.day === day && t.slot === s && t.activity === item);
                      const short = team ? team.memberIds.filter((id) => activeVolunteerIds.has(id)).length < team.target : false;
                      return <button key={s} type="button" onClick={() => { setActivity(item); setSlot(s); setMobileTab("turno"); setFocusContext(`${item.toUpperCase()} — ${day} · ${s}: ${team ? `${team.memberIds.filter((id) => activeVolunteerIds.has(id)).length}/${team.target} assegnati` : "turno non ancora configurato"}. Sei nella gestione esatta di questa cella.`); goToSection("turno-workspace"); }}
                        className={`border p-2 text-center font-black ${team ? "" : muted}`}
                        style={team ? activityTone(item, isLight) : undefined}>
                        <span className={`mb-0.5 block text-[8px] font-bold uppercase lg:hidden ${muted}`}>{s}</span>
                        {team ? <><span className={short ? "text-[#c76476]" : ""}>{team.memberIds.filter((id) => activeVolunteerIds.has(id)).length}/{team.target}</span><span className={`block text-[9px] font-normal ${muted}`}>{short ? "da coprire" : "coperto"}</span></> : "—"}
                      </button>;
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="turno-workspace" className={`mt-3 scroll-mt-4 border-2 p-3 lg:mt-4 lg:p-5 ${panel} ${mobileTab !== "turno" ? "hidden lg:block" : ""}`}>
          {focusContext ? (
            <div role="status" className={`mb-3 border-2 border-[#b85668] p-3 ${isLight ? "bg-[#b85668]/10" : "bg-[#b85668]/15"}`}>
              <div className="flex items-center gap-1"><p className="text-[10px] font-black uppercase text-[#c76476]">Stai gestendo questo punto</p><button type="button" onClick={() => setHelpTopic("turn")} aria-label="Spiega gestione turno" className="rounded-full p-1"><CircleHelp className="size-4" /></button></div>
              <p className="mt-1 text-sm font-bold">{focusContext}</p>
            </div>
          ) : null}
          <div className="mb-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase lg:text-sm">
              <Filter className="size-4 text-[#c76476]" /> Scegli il turno
            </div>
            <p className={`mt-1 text-[10px] sm:text-xs ${muted}`}>Imposta data, fascia e attività. La lista delle persone si aggiorna automaticamente.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:gap-3">
            <Select label="Data" value={day} onChange={(value) => { setDay(value); setFocusContext(""); }} options={["28 ottobre", "29 ottobre", "30 ottobre", "31 ottobre", "1 novembre"]} icon={<CalendarDays className="size-3.5" />} inputClass={input} />
            <Select label="Fascia" value={slot} onChange={(value) => { setSlot(value); setFocusContext(""); }} options={["Mattina", "Pomeriggio", "Sera"]} inputClass={input} />
            <div className="border-l-4 pl-2" style={{ borderColor: paletteFor(activity).accent }}>
              <Select label="Attività" value={activity} onChange={(value) => { setActivity(value); setFocusContext(""); }} options={activities} inputClass={input} />
            </div>
            <label className="col-span-2 text-[11px] sm:text-xs lg:col-span-1">
              <span className={`mb-1 flex h-4 items-center ${mutedStrong}`}>Ricerca persona</span>
              <div className={`flex min-h-9 items-center gap-2 border-2 px-2 lg:min-h-11 lg:px-3 ${input}`}>
                <Search className="size-3.5 shrink-0 opacity-60" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nome, gruppo o competenza"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:opacity-40 lg:text-base"
                />
              </div>
            </label>
          </div>
          <div className={`mt-3 flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between ${isLight ? "border-ink/10" : "border-paper/10"}`}>
            <div className="text-xs">
              <strong>{day} · {slot} · {activity}</strong>
              <span className={`ml-2 ${muted}`}>{compatible.length} persone compatibili</span>
            </div>
            <button type="button" onClick={() => { const next = !peopleFilterOpen; setPeopleFilterOpen(next); setMobileTab(next ? "persone" : "turno"); }}
              className={`min-h-11 border-2 border-[#b85668] px-4 text-xs font-black uppercase ${peopleFilterOpen ? "bg-transparent text-[#c76476]" : "bg-[#b85668] text-white"}`}>
              {peopleFilterOpen ? "Nascondi persone compatibili ↑" : "Vedi persone compatibili →"}
            </button>
          </div>
        </section>

        <section id="people-workspace" className="mt-3 scroll-mt-4 grid gap-3 lg:mt-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,.75fr)] lg:items-stretch lg:gap-5">
          <div className={`border-2 p-3 lg:min-h-[560px] lg:p-5 ${panel} ${mobileTab !== "persone" ? "hidden lg:block" : ""} ${!peopleFilterOpen ? "lg:hidden" : ""}`}>
            {focusContext ? <div role="status" className={`relative z-0 mb-3 border-2 border-[#b85668] p-3 text-xs font-bold ${isLight ? "bg-[#b85668]/10" : "bg-[#b85668]/15"}`}><p className="mb-1 text-[10px] font-black uppercase text-[#c76476]">Perché sei qui</p>{focusContext}</div> : null}
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-1"><h2 className="text-sm font-black uppercase lg:text-base">Persone disponibili</h2><button type="button" onClick={() => setHelpTopic("people")} aria-label="Spiega persone disponibili" className="rounded-full p-1"><CircleHelp className="size-4" /></button></div>
                <p className={`text-[10px] sm:text-xs ${muted}`}>Compatibili con il turno selezionato · “Disponibile” = assegnabile ora.</p>
              </div>
              <div className="flex items-stretch gap-1">
                <button
                  type="button"
                  onClick={autoSuggest}
                  className={`min-h-9 border-2 border-[#b85668] px-2.5 text-[10px] font-black uppercase sm:text-xs lg:min-h-11 lg:px-4 ${suggestedMemberIds.length ? "bg-transparent text-[#c76476]" : "bg-[#b85668] text-white"}`}
                >
                  {suggestedMemberIds.length ? "Annulla proposta" : "Proponi persone"}
                </button>
                <button type="button" onClick={() => setHelpTopic("suggest")} className="min-h-9 min-w-9 border-2 border-[#b85668] px-2" aria-label="Spiega Proponi persone">
                  <CircleHelp className="mx-auto size-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-2">
              {compatible.map((v) => {
                const inTeam = selectedTeam.memberIds.includes(v.id);
                const conflictTeam = teams.find((team) => team.id !== selectedTeam.id && team.day === day && team.slot === slot && team.memberIds.includes(v.id));
                const assignedOtherSlot = teams.some((team) => team.day === day && team.slot !== slot && team.memberIds.includes(v.id));
                const status = inTeam ? "GIÀ ASSEGNATO QUI" : conflictTeam ? "OCCUPATO IN QUESTO ORARIO" : assignedOtherSlot ? "IMPEGNATO IN ALTRA FASCIA" : "DISPONIBILE";
                return (
                  <button
                    key={v.id}
                    type="button"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", v.id)}
                    onClick={() => toggleMember(v.id)}
                    className={`w-full border-2 p-2 text-left transition lg:p-3 ${inTeam ? "border-[#b85668] bg-[#b85668]/10" : isLight ? "border-ink/10 hover:border-[#b85668]/55" : "border-paper/15 hover:border-[#b85668]/55"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold lg:text-sm">
                          {v.name}<span className={`font-normal ${muted}`}> · {v.group}</span>
                        </div>
                        <span className={`mt-1 inline-block text-[9px] font-black uppercase ${status === "OCCUPATO IN QUESTO ORARIO" ? "text-[#c76476]" : mutedStrong}`}>{status}</span>
                        <div className={`mt-0.5 line-clamp-2 text-[10px] leading-snug lg:text-xs ${muted}`}>
                          {v.days.join(", ")} · {v.slots.join(", ")} · {v.skills.slice(0, 2).join(" · ")}
                        </div>
                      </div>
                      <span className={`flex size-5 shrink-0 items-center justify-center border-2 lg:size-6 ${inTeam ? "border-[#b85668] bg-[#b85668] text-white" : isLight ? "border-ink/20" : "border-paper/25"}`}>
                        {inTeam ? <Check className="size-3.5" /> : null}
                      </span>
                    </div>
                  </button>
                );
              })}
              {compatible.length === 0 ? (
                <p className={`py-5 text-xs ${muted}`}>Nessun volontario compatibile con questi filtri.</p>
              ) : null}
            </div>
          </div>

          <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id) toggleMember(id); }}
            className={`flex flex-col border-2 p-3 lg:min-h-[560px] lg:h-full lg:p-5 ${panel} ${mobileTab !== "squadra" ? "hidden lg:flex" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase text-[#c76476] sm:text-xs">Squadra del turno</p>
                <h2 className="mt-1 text-lg font-black uppercase leading-tight lg:text-xl">{activity || selectedTeam.activity}</h2>
              </div>
              <div className="flex shrink-0 items-stretch gap-1">
                <button
                  type="button"
                  onClick={() => setEditingTeam((value) => !value)}
                  className={`min-h-9 border-2 px-2 text-[10px] font-bold sm:text-xs lg:min-h-11 lg:px-3 ${editingTeam ? "border-amber-500 bg-amber-500/10" : "border-[#b85668]/60"}`}
                >
                  {editingTeam ? "Fine modifica" : "Modifica turno"}
                </button>
                <button
                  type="button"
                  onClick={togglePinned}
                  className={`flex min-h-9 items-center gap-1.5 border-2 px-2 text-[10px] font-bold sm:text-xs lg:min-h-11 lg:px-3 ${selectedTeam.pinned ? "border-emerald-600 bg-emerald-600/10" : "border-[#b85668]/60"}`}
                >
                  <Pin className="size-3.5" /> {selectedTeam.pinned ? "✓ Squadra fissata" : "Fissa squadra"}
                </button>
                <button type="button" onClick={() => setHelpTopic("pin")} className="min-h-9 min-w-9 border-2 border-[#b85668]/60 px-2" aria-label="Spiega Fissa squadra">
                  <CircleHelp className="mx-auto size-4" />
                </button>
              </div>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] lg:text-sm">
              <Info label="Data" value={selectedTeam.day} light={isLight} />
              <Info label="Fascia" value={selectedTeam.slot} light={isLight} />
              <Info label="Attività" value={selectedTeam.activity} light={isLight} />
              <div><dt className={`text-[9px] font-bold uppercase lg:text-xs ${muted}`}>Persone necessarie</dt>
                <input type="number" min={1} max={99} value={selectedTeam.target} disabled={!editingTeam} onChange={(e) => updateSelectedTeam({ target: Math.max(1, Number(e.target.value) || 1) })} className={`mt-1 w-full border px-2 py-1 font-bold disabled:cursor-not-allowed disabled:opacity-65 ${input}`} />
              </div>
              <div className="col-span-2"><dt className={`text-[9px] font-bold uppercase lg:text-xs ${muted}`}>Nome squadra</dt>
                <input value={selectedTeam.name} disabled={!editingTeam} onChange={(e) => updateSelectedTeam({ name: e.target.value })} className={`mt-1 w-full border px-2 py-1 font-bold disabled:cursor-not-allowed disabled:opacity-65 ${input}`} />
              </div>
              <div className="col-span-2"><dt className={`text-[9px] font-bold uppercase lg:text-xs ${muted}`}>Luogo / punto operativo</dt>
                <input value={selectedTeam.place} disabled={!editingTeam} onChange={(e) => updateSelectedTeam({ place: e.target.value })} className={`mt-1 w-full border px-2 py-1 font-bold disabled:cursor-not-allowed disabled:opacity-65 ${input}`} spellCheck />
              </div>
            </dl>

            <div className={`mt-3 border-t-2 border-[#b85668]/45 pt-3`}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span>Copertura</span><strong>{teamMembers.length}/{selectedTeam.target}</strong>
              </div>
              <div className={`h-2 overflow-hidden ${isLight ? "bg-ink/10" : "bg-paper/10"}`}>
                <div className="h-full bg-[#b85668]" style={{ width: `${coverage}%` }} />
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              {teamMembers.map((m) => (
                <div key={m.id} className={`flex items-center justify-between border-2 px-2 py-1.5 ${panelSoft}`}>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold lg:text-sm">{m.name}</div>
                    <div className={`text-[10px] lg:text-xs ${muted}`}>{m.group}</div>
                  </div>
                  <button type="button" onClick={() => toggleMember(m.id)} className={`text-[10px] font-bold uppercase lg:text-xs ${mutedStrong}`}>
                    Rimuovi
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-4">
              <button
                type="button"
                onClick={() => setShareOpen((open) => !open)}
                className="flex min-h-9 w-full items-center justify-center gap-2 border-2 border-[#b85668] px-3 text-[10px] font-black uppercase hover:bg-[#b85668] hover:text-white sm:text-xs lg:min-h-11"
              >
                <Download className="size-4" /> {shareOpen ? "Chiudi invio" : "Invia / esporta squadra"}
              </button>
              {shareOpen ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button type="button" onClick={exportText} className={`min-h-10 border px-2 text-[10px] font-black uppercase ${panelSoft}`}>Salva file</button>
                  <button type="button" onClick={shareEmail} className={`min-h-10 border px-2 text-[10px] font-black uppercase ${panelSoft}`}>Email</button>
                  <button type="button" onClick={shareWhatsApp} className={`min-h-10 border px-2 text-[10px] font-black uppercase ${panelSoft}`}>WhatsApp</button>
                  <button type="button" onClick={shareSystem} className={`min-h-10 border px-2 text-[10px] font-black uppercase ${panelSoft}`}>Condividi testo</button>
                  <pre className={`col-span-2 whitespace-pre-wrap border p-3 text-[10px] leading-relaxed sm:text-xs ${panelSoft}`}>{teamShareText()}</pre>
                </div>
              ) : null}
            </div>
          </div>
        </section>


      </div>
    </main>
  );
}

function Kpi({ label, value, light, onHelp }: { label: string; value: string; light: boolean; onHelp?: () => void }) {
  return (
    <div className={`border-2 border-[#b85668]/75 p-2.5 lg:p-4 ${light ? "bg-white" : "bg-paper/5"}`}>
      <div className="flex items-center gap-1">
        <div className={`text-[9px] font-bold uppercase sm:text-[10px] lg:text-xs ${light ? "text-ink/55" : "text-paper/55"}`}>{label}</div>
        {onHelp ? <button type="button" onClick={onHelp} className="rounded-full p-1" aria-label={`Spiega ${label}`}><CircleHelp className="size-3.5 opacity-70" /></button> : null}
      </div>
      <div className="mt-0.5 text-xl font-black lg:mt-1 lg:text-3xl">{value}</div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  icon,
  inputClass,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  icon?: ReactNode;
  inputClass: string;
}) {
  return (
    <label className="text-[11px] sm:text-xs">
      <span className="mb-1 flex h-4 items-center gap-1.5 opacity-70">{icon}{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`min-h-9 w-full border-2 px-2 text-sm lg:min-h-11 lg:px-3 lg:text-base ${inputClass}`}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Info({ label, value, light }: { label: string; value: string; light: boolean }) {
  return (
    <div>
      <dt className={`text-[9px] font-bold uppercase lg:text-xs ${light ? "text-ink/45" : "text-paper/45"}`}>{label}</dt>
      <dd className="mt-0.5 truncate font-bold">{value}</dd>
    </div>
  );
}

