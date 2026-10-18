import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowUp,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleHelp,
  Download,
  Mail,
  MessageSquare,
  Send,
  CheckCheck,
  Phone,
  Filter,
  Moon,
  Pin,
  Plus,
  Search,
  Trash2,
  Pencil,
  Users,
  X,
  UserRound,
  MapPin,
  Clock3,
  Sun,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { costacciaroLogoDataUri } from "@/lib/costacciaro-logo";
import { loadOperationalDashboard,
  loadTestVolunteerSnapshot, saveOperationalActivities, saveOperationalTeams, saveVolunteerOps, subscribeOperationalDashboard,
  loadDashboardMessages, loadVolunteerMessages, markVolunteerMessage, sendDashboardMessage,
  loadVolunteerInboxMessages, markVolunteerInboxRead, sendVolunteerInboxMessage,
  pairOrganizerDevice, resolveOrganizerDevice,
  loadDashboardMessagesV2, archiveDashboardMessage,
  loadVolunteerInboxMessagesV2, archiveVolunteerInboxMessage,
  dashboardArchivePreviousDay,
  type DashboardMessageSummary, type VolunteerMessage, type VolunteerInboxMessage } from "@/lib/dashboard-operational";

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

type OperationalPoint = {
  id: string;
  name: string;
  kind: "sala" | "presidio";
  activity: string;
  note: string;
};

const operationalPoints: OperationalPoint[] = [
  {
    id: "teatro-tenda",
    name: "Teatro Tenda",
    kind: "sala",
    activity: "Conferenze — Teatro Tenda",
    note: "Copertura della sala per fascia: la squadra segue lo spazio, non il singolo intervento.",
  },
  {
    id: "sala-rilievi",
    name: "Sala Rilievi",
    kind: "sala",
    activity: "Mostre — Sala Rilievi",
    note: "Presidio della sala rilievi, esposizioni e postazioni multimediali collegate.",
  },
  {
    id: "conferenze-workshop",
    name: "Conferenze / workshop",
    kind: "sala",
    activity: "Conferenze — Area conferenze e workshop",
    note: "Spazio operativo per conferenze e workshop; il luogo preciso resta da allineare al programma ufficiale.",
  },
  {
    id: "mostre-esposizioni",
    name: "Mostre / esposizioni",
    kind: "sala",
    activity: "Mostre — Area mostre ed esposizioni",
    note: "Copertura dell’area mostre ed esposizioni per fascia, indipendente dal singolo contenuto.",
  },
  {
    id: "film-proiezioni",
    name: "Film / proiezioni",
    kind: "sala",
    activity: "Conferenze — Film e proiezioni",
    note: "Presidio della sala o area proiezioni; collocazione esatta da confermare sul programma definitivo.",
  },
  {
    id: "assemblee-riunioni",
    name: "Assemblee / riunioni",
    kind: "sala",
    activity: "Conferenze — Assemblee e riunioni",
    note: "Copertura delle sale destinate ad assemblee e riunioni, con squadra assegnata per fascia.",
  },
  {
    id: "stand-materiali",
    name: "Stand materiali",
    kind: "presidio",
    activity: "Logistica — Stand materiali",
    note: "Supporto continuativo allo spazio stand materiali e alla gestione pratica del presidio.",
  },
  {
    id: "speleobar",
    name: "SpeleoBar / stand gastronomici",
    kind: "presidio",
    activity: "Accoglienza — SpeleoBar e stand gastronomici",
    note: "Presidio operativo dell’area SpeleoBar e stand gastronomici, con fabbisogno definibile per fascia.",
  },
  {
    id: "installazioni",
    name: "Installazioni / attività ricreative",
    kind: "sala",
    activity: "Allestimento — Installazioni e attività ricreative",
    note: "Supporto alle installazioni e alle attività ricreative negli spazi indicati dal programma.",
  },
  {
    id: "segreteria-iscrizioni",
    name: "Segreteria / iscrizioni in loco",
    kind: "presidio",
    activity: "Accoglienza — Segreteria e iscrizioni",
    note: "Iscrizioni sul posto, accoglienza e consegna dei materiali previsti dall’organizzazione.",
  },
  {
    id: "logistica-materiali",
    name: "Logistica / distribuzione materiali",
    kind: "presidio",
    activity: "Logistica — Distribuzione materiali",
    note: "Punto operativo per materiali, gadget e necessità logistiche trasversali.",
  },
];

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

export function OrganizzatoriDashboard({ volunteerOnly = false }: { volunteerOnly?: boolean } = {}) {
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
  const [proposal, setProposal] = useState<{ baseline: string; changes: { teamId: string; volunteerIds: string[] }[] } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [proposalConfirmedInGuide, setProposalConfirmedInGuide] = useState(false);
  const [personalOpen, setPersonalOpen] = useState(volunteerOnly);
  const [personalVolunteerId, setPersonalVolunteerId] = useState("");
  const [personalQuery, setPersonalQuery] = useState("");
  const [volunteerPairEmail, setVolunteerPairEmail] = useState("");
  const [volunteerPairPhone4, setVolunteerPairPhone4] = useState("");
  const [volunteerPairBusy, setVolunteerPairBusy] = useState(false);
  const [volunteerPairError, setVolunteerPairError] = useState("");
  const [volunteerDeviceLinked, setVolunteerDeviceLinked] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [dashboardMessages, setDashboardMessages] = useState<DashboardMessageSummary[]>([]);
  const [volunteerMessages, setVolunteerMessages] = useState<VolunteerMessage[]>([]);
  const [messageType, setMessageType] = useState<"notice" | "direct" | "team">("notice");
  const [messageTargetVolunteerId, setMessageTargetVolunteerId] = useState("");
  const [messageTargetQuery, setMessageTargetQuery] = useState("");
  const [messageTargetTeamId, setMessageTargetTeamId] = useState("");
  const [messageTitle, setMessageTitle] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageUrgent, setMessageUrgent] = useState(false);
  const [messageBusy, setMessageBusy] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [volunteerInbox, setVolunteerInbox] = useState<VolunteerInboxMessage[]>([]);
  const [volunteerReply, setVolunteerReply] = useState("");
  const [volunteerReplyBusy, setVolunteerReplyBusy] = useState(false);
  const [volunteerReplyFeedback, setVolunteerReplyFeedback] = useState("");
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState(false);
  const lastVolunteerUnreadRef = useRef(0);
  const [volunteerMessagesOpen, setVolunteerMessagesOpen] = useState(false);
  const [volunteerReplyOpen, setVolunteerReplyOpen] = useState(false);
  const [volunteerAllTurnsOpen, setVolunteerAllTurnsOpen] = useState(false);
  const [messagePane, setMessagePane] = useState<"compose" | "sent" | "inbox">("compose");
  const [organizerAccessReady, setOrganizerAccessReady] = useState(volunteerOnly);
  const [organizerAccessGranted, setOrganizerAccessGranted] = useState(false);
  const [organizerEmail, setOrganizerEmail] = useState("");
  const [organizerPhone4, setOrganizerPhone4] = useState("");
  const [organizerAccessBusy, setOrganizerAccessBusy] = useState(false);
  const [organizerAccessError, setOrganizerAccessError] = useState("");
  const [organizerLabel, setOrganizerLabel] = useState("");
  const [sentArchiveOpen, setSentArchiveOpen] = useState(false);
  const [inboxArchiveOpen, setInboxArchiveOpen] = useState(false);
  const [archivedDashboardMessages, setArchivedDashboardMessages] = useState<Array<DashboardMessageSummary & { archived: boolean }>>([]);
  const [archivedVolunteerInbox, setArchivedVolunteerInbox] = useState<Array<VolunteerInboxMessage & { archived: boolean }>>([]);
  const [liveVolunteers, setLiveVolunteers] = useState<Volunteer[]>([]);
  const [testVolunteers, setTestVolunteers] = useState<Volunteer[]>([]);
  const openAccess = volunteerOnly || organizerAccessGranted;
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState("");
  const [liveSyncLabel, setLiveSyncLabel] = useState("");
  const [feedback, setFeedback] = useState("");
  const [focusContext, setFocusContext] = useState("");
  const [returnSection, setReturnSection] = useState<{
    id: "places-workspace" | "priorities-workspace" | "turno-workspace" | "people-workspace" | "coverage-workspace";
    label: string;
  } | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<
    "places-workspace" | "priorities-workspace" | "turno-workspace" | "people-workspace" | "coverage-workspace" | null
  >(null);
  const [helpTopic, setHelpTopic] = useState<"welcome" | "coverage" | "priorities" | "regia" | "turn" | "people" | "team" | "suggest" | "pin" | "live" | "staffing" | null>(null);
  const [guidedMode, setGuidedMode] = useState(true);
  const [guideMenuOpen, setGuideMenuOpen] = useState(false);
  const [guideCategory, setGuideCategory] = useState<"turni" | "persone" | "messaggi" | "altro">("turni");
  const [contextGuideStep, setContextGuideStep] = useState<number | null>(null);
  const [guidedAssignmentStep, setGuidedAssignmentStep] = useState<number | null>(null);
  const [guidedStartingMemberIds, setGuidedStartingMemberIds] = useState<string[]>([]);
  const [guideChoice, setGuideChoice] = useState<"overview" | "staffing" | "priority" | "assign" | "people" | "contacts" | "messages" | "activities" | "regia" | "myturns" | "inbox" | "sent" | "personal" | "preferences" | "sharing">("overview");
  const [editingTeam, setEditingTeam] = useState(false);
  const [staffingBaseline, setStaffingBaseline] = useState<number | null>(null);
  const [staffingTeamKey, setStaffingTeamKey] = useState("");
  const [priorityTeamId, setPriorityTeamId] = useState<string | null>(null);
  const [peopleBaseline, setPeopleBaseline] = useState<string | null>(null);
  const [peopleTeamKey, setPeopleTeamKey] = useState("");
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
    if (volunteerOnly) {
      setOrganizerAccessReady(true);
      return;
    }
    let cancelled = false;
    const token = localStorage.getItem("costacciaro-organizer-device-token") || "";
    if (!token) {
      setOrganizerAccessReady(true);
      return;
    }

    resolveOrganizerDevice(token)
      .then((result) => {
        if (cancelled) return;
        if (result?.ok) {
          setOrganizerAccessGranted(true);
          setOrganizerLabel(result.label || result.email || "Organizzatore");
        } else {
          localStorage.removeItem("costacciaro-organizer-device-token");
        }
      })
      .catch(() => {
        localStorage.removeItem("costacciaro-organizer-device-token");
      })
      .finally(() => {
        if (!cancelled) setOrganizerAccessReady(true);
      });

    return () => { cancelled = true; };
  }, [volunteerOnly]);

  function ensureOrganizerDeviceToken() {
    let token = localStorage.getItem("costacciaro-organizer-device-token") || "";
    if (!token) {
      token = crypto.randomUUID() + "-" + crypto.randomUUID();
      localStorage.setItem("costacciaro-organizer-device-token", token);
    }
    return token;
  }

  async function pairOrganizerAccess() {
    if (!organizerEmail.trim() || organizerPhone4.length !== 4) return;
    setOrganizerAccessBusy(true);
    setOrganizerAccessError("");
    try {
      const token = ensureOrganizerDeviceToken();
      const result = await pairOrganizerDevice(organizerEmail.trim(), organizerPhone4, token);
      if (!result?.ok) {
        setOrganizerAccessError("Verifica non riuscita. Controlla email e ultime 4 cifre del telefono.");
        return;
      }
      setOrganizerAccessGranted(true);
      setOrganizerLabel(result.label || result.email || "Organizzatore");
      setOrganizerPhone4("");
    } catch {
      setOrganizerAccessError("Verifica non riuscita.");
    } finally {
      setOrganizerAccessBusy(false);
    }
  }

  function unlinkOrganizerAccess() {
    localStorage.removeItem("costacciaro-organizer-device-token");
    setOrganizerAccessGranted(false);
    setOrganizerLabel("");
    setOrganizerEmail("");
    setOrganizerPhone4("");
  }

  useEffect(() => {
    loadTestVolunteerSnapshot()
      .then((items) => setTestVolunteers(items))
      .catch(() => setTestVolunteers([]));
  }, []);

  useEffect(() => {
    const savedMode = localStorage.getItem("costacciaro-dashboard-mode");
    const initialMode = volunteerOnly ? "live" : (savedMode === "live" ? "live" : "test");
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
    if (dataMode === "test") localStorage.setItem("costacciaro-test-activities", JSON.stringify(activities));
  }, [activities, dataMode]);
  useEffect(() => {
    if (dataMode === "test") localStorage.setItem("costacciaro-test-teams", JSON.stringify(teams));
  }, [teams, dataMode]);

  useEffect(() => {
    if (dataMode !== "live" || !openAccess) return;
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
  }, [dataMode]);

  useEffect(() => {
    if (dataMode !== "live" || !openAccess) return;
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
  }, [dataMode]);

  useEffect(() => {
    if (dataMode !== "live" || !openAccess || !liveHydrated.current) return;
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
  }, [teams, dataMode]);

  useEffect(() => {
    if (dataMode !== "live" || !openAccess || !liveHydrated.current) return;
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
  }, [activities, dataMode]);

  useEffect(() => {
    if (!volunteerOnly) return;
    let cancelled = false;

    async function resolveDevice() {
      const token = localStorage.getItem("costacciaro-volunteer-device-token") || "";
      if (!token) return;
      const { data, error } = await supabase.rpc("resolve_dashboard_volunteer_device", {
        p_device_token: token,
      });
      if (cancelled || error || !data?.ok) return;
      setVolunteerDeviceLinked(true);
      setPersonalVolunteerId(data.volunteer_id);
      if (data.name) setPersonalQuery(data.name);
    }

    resolveDevice();
    return () => { cancelled = true; };
  }, [volunteerOnly, liveVolunteers.length]);

  function ensureVolunteerDeviceToken() {
    let token = localStorage.getItem("costacciaro-volunteer-device-token") || "";
    if (!token) {
      token = crypto.randomUUID() + "-" + crypto.randomUUID();
      localStorage.setItem("costacciaro-volunteer-device-token", token);
    }
    return token;
  }

  async function pairVolunteerDevice() {
    if (!personalVolunteerId) return;
    setVolunteerPairError("");
    setVolunteerPairBusy(true);

    const token = ensureVolunteerDeviceToken();
    const { data, error } = await supabase.rpc("claim_dashboard_volunteer_device", {
      p_volunteer_id: personalVolunteerId,
      p_email: volunteerPairEmail.trim(),
      p_phone_last4: volunteerPairPhone4.trim(),
      p_device_token: token,
    });

    setVolunteerPairBusy(false);

    if (error || !data?.ok) {
      const message = error?.message || "";
      if (message.includes("email mismatch")) setVolunteerPairError("L'email non corrisponde a quella registrata.");
      else if (message.includes("phone mismatch")) setVolunteerPairError("Le ultime 4 cifre del telefono non corrispondono.");
      else setVolunteerPairError("Verifica non riuscita. Controlla i dati e riprova.");
      return;
    }

    setVolunteerDeviceLinked(true);
    setVolunteerPairEmail("");
    setVolunteerPairPhone4("");
  }

  function unlinkVolunteerDevice() {
    localStorage.removeItem("costacciaro-volunteer-device-token");
    setVolunteerDeviceLinked(false);
    setPersonalVolunteerId("");
    setPersonalQuery("");
    setVolunteerPairEmail("");
    setVolunteerPairPhone4("");
    setVolunteerPairError("");
  }

  useEffect(() => {
    if (volunteerOnly || dataMode !== "live" || !openAccess) return;
    let cancelled = false;

    async function archivePreviousDayMessages() {
      try {
        await dashboardArchivePreviousDay();
        if (cancelled) return;
        const [sent, inbox] = await Promise.all([
          loadDashboardMessagesV2(false),
          loadVolunteerInboxMessagesV2(false),
        ]);
        if (!cancelled) {
          setDashboardMessages(sent);
          setVolunteerInbox(inbox);
        }
      } catch {}
    }

    archivePreviousDayMessages();
    return () => { cancelled = true; };
  }, [volunteerOnly, dataMode, openAccess]);

  useEffect(() => {
    if (volunteerOnly || dataMode !== "live") return;
    let cancelled = false;

    async function refreshInboxBadge() {
      try {
        const [sent, inbox] = await Promise.all([
          loadDashboardMessagesV2(false),
          loadVolunteerInboxMessagesV2(false),
        ]);
        if (!cancelled) {
          setDashboardMessages(sent);
          setVolunteerInbox(inbox);
        }
      } catch {}
    }

    refreshInboxBadge();
    const timer = window.setInterval(refreshInboxBadge, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [volunteerOnly, dataMode]);

  useEffect(() => {
    if (!messagesOpen || volunteerOnly || dataMode !== "live") return;
    let cancelled = false;

    async function refreshMessages() {
      try {
        const [sent, inbox] = await Promise.all([
          loadDashboardMessagesV2(false),
          loadVolunteerInboxMessagesV2(false),
        ]);
        if (cancelled) return;
        setDashboardMessages(sent);
        setVolunteerInbox(inbox);
        setMessageError("");
      } catch {
        if (!cancelled) setMessageError("Caricamento messaggi non riuscito.");
      }
    }

    refreshMessages();
    const timer = window.setInterval(refreshMessages, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [messagesOpen, volunteerOnly, dataMode]);

  function playMessageBeep() {
    if (!soundAlertsEnabled || typeof window === "undefined") return;
    try {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextCtor) return;
      const ctx = new AudioContextCtor();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.frequency.value = 880;
      gain.gain.value = 0.04;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.12);
      oscillator.onended = () => ctx.close();
    } catch {}
  }

  useEffect(() => {
    if (!volunteerOnly || !volunteerDeviceLinked) {
      setVolunteerMessages([]);
      return;
    }
    const token = localStorage.getItem("costacciaro-volunteer-device-token") || "";
    if (!token) return;
    let cancelled = false;

    async function refreshVolunteerMessages() {
      try {
        const items = await loadVolunteerMessages(token);
        if (cancelled) return;
        const unread = items.filter((item) => !item.readAt);
        if (unread.length > lastVolunteerUnreadRef.current) playMessageBeep();
        lastVolunteerUnreadRef.current = unread.length;
        if (!cancelled) setVolunteerMessages(items);
      } catch {
        if (!cancelled) setVolunteerMessages([]);
      }
    }

    refreshVolunteerMessages();
    const timer = window.setInterval(refreshVolunteerMessages, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [volunteerOnly, volunteerDeviceLinked]);

  function applyMessagePreset(kind: "shift_change" | "assignment" | "confirm" | "reminder" | "important") {
    const targetVolunteer = activeVolunteers.find((v) => v.id === messageTargetVolunteerId);
    const targetTeam = teams.find((t) => t.id === messageTargetTeamId);
    const firstName = targetVolunteer?.name?.split(" ")[0] || "volontario";

    if (kind === "shift_change") {
      setMessageTitle("Cambio turno");
      setMessageBody(targetTeam
        ? `Ciao, il tuo turno è stato aggiornato: ${targetTeam.day}, ${targetTeam.slot}, ${targetTeam.activity}, ${targetTeam.place}. Controlla Il mio Costacciaro per i dettagli aggiornati.`
        : `Ciao ${firstName}, il tuo turno è stato aggiornato. Controlla Il mio Costacciaro per vedere data, fascia, attività e luogo aggiornati.`);
      setMessageUrgent(true);
      return;
    }
    if (kind === "assignment") {
      setMessageTitle("Nuovo turno assegnato");
      setMessageBody(targetTeam
        ? `Sei stato assegnato al turno: ${targetTeam.day}, ${targetTeam.slot}, ${targetTeam.activity}, ${targetTeam.place}. Trovi tutto aggiornato nel Mio Costacciaro.`
        : `Ciao ${firstName}, ti è stato assegnato un nuovo turno. Controlla Il mio Costacciaro per tutti i dettagli.`);
      setMessageUrgent(true);
      return;
    }
    if (kind === "confirm") {
      setMessageTitle("Conferma disponibilità");
      setMessageBody(`Ciao ${firstName}, puoi confermare di aver visto questa comunicazione e la tua disponibilità? Premi “Confermo di aver letto” nel Mio Costacciaro.`);
      setMessageUrgent(true);
      return;
    }
    if (kind === "reminder") {
      setMessageTitle("Promemoria turno");
      setMessageBody(targetTeam
        ? `Promemoria: ${targetTeam.day}, ${targetTeam.slot}, ${targetTeam.activity}, ${targetTeam.place}. Controlla Il mio Costacciaro prima del turno.`
        : `Promemoria: controlla Il mio Costacciaro per verificare il tuo prossimo turno e gli ultimi aggiornamenti.`);
      setMessageUrgent(false);
      return;
    }
    setMessageTitle("Comunicazione importante");
    setMessageBody(`Ciao ${firstName}, c’è un aggiornamento importante per Costacciaro 2026. Controlla questa comunicazione e conferma la lettura.`);
    setMessageUrgent(true);
  }

  async function submitDashboardMessage() {
    if (dataMode !== "live") {
      setMessageError("I messaggi si inviano solo in modalità Operativo.");
      return;
    }
    if (!messageTitle.trim() || !messageBody.trim()) {
      setMessageError("Inserisci titolo e messaggio.");
      return;
    }
    if (messageType === "direct" && !messageTargetVolunteerId) {
      setMessageError("Scegli il volontario destinatario.");
      return;
    }
    if (messageType === "team" && !messageTargetTeamId) {
      setMessageError("Scegli la squadra destinataria.");
      return;
    }

    setMessageBusy(true);
    setMessageError("");
    try {
      const result = await sendDashboardMessage({
        messageType,
        title: messageTitle.trim(),
        body: messageBody.trim(),
        urgent: messageUrgent,
        targetVolunteerId: messageType === "direct" ? messageTargetVolunteerId : undefined,
        targetTeamId: messageType === "team" ? messageTargetTeamId : undefined,
      });
      setMessageTitle("");
      setMessageBody("");
      setMessageUrgent(false);
      setMessageTargetVolunteerId("");
      setMessageTargetQuery("");
      setMessageTargetTeamId("");
      setFeedback(`✓ Messaggio inviato a ${result.recipient_count} destinatari.`);
      setDashboardMessages(await loadDashboardMessagesV2(false));
    } catch {
      setMessageError("Invio non riuscito.");
    } finally {
      setMessageBusy(false);
    }
  }

  async function openVolunteerMessages() {
    setVolunteerMessagesOpen(true);
    const token = localStorage.getItem("costacciaro-volunteer-device-token") || "";
    if (!token) return;
    const unread = volunteerMessages.filter((item) => !item.readAt);
    if (!unread.length) return;
    await Promise.allSettled(unread.map((item) => markVolunteerMessage(token, item.id, false)));
    try {
      const refreshed = await loadVolunteerMessages(token);
      setVolunteerMessages(refreshed);
      lastVolunteerUnreadRef.current = refreshed.filter((item) => !item.readAt).length;
    } catch {}
  }

  async function acknowledgeVolunteerMessage(messageId: string) {
    const token = localStorage.getItem("costacciaro-volunteer-device-token") || "";
    if (!token) return;
    try {
      await markVolunteerMessage(token, messageId, true);
      setVolunteerMessages(await loadVolunteerMessages(token));
    } catch {}
  }

  async function sendVolunteerReply() {
    const token = localStorage.getItem("costacciaro-volunteer-device-token") || "";
    if (!token || !volunteerReply.trim()) return;
    setVolunteerReplyBusy(true);
    setVolunteerReplyFeedback("");
    try {
      await sendVolunteerInboxMessage(token, volunteerReply.trim());
      setVolunteerReply("");
      setVolunteerReplyFeedback("Messaggio inviato all'organizzazione.");
    } catch {
      setVolunteerReplyFeedback("Invio non riuscito.");
    } finally {
      setVolunteerReplyBusy(false);
    }
  }

  async function markInboxRead(id: string) {
    try {
      await markVolunteerInboxRead(id);
      setVolunteerInbox(await loadVolunteerInboxMessagesV2(false));
    } catch {}
  }

  async function setSentMessageArchived(id: string, archived: boolean) {
    try {
      await archiveDashboardMessage(id, archived);
      const [active, archive] = await Promise.all([
        loadDashboardMessagesV2(false),
        loadDashboardMessagesV2(true),
      ]);
      setDashboardMessages(active);
      setArchivedDashboardMessages(archive);
    } catch {
      setMessageError("Archiviazione messaggio non riuscita.");
    }
  }

  async function setInboxMessageArchived(id: string, archived: boolean) {
    try {
      await archiveVolunteerInboxMessage(id, archived);
      const [active, archive] = await Promise.all([
        loadVolunteerInboxMessagesV2(false),
        loadVolunteerInboxMessagesV2(true),
      ]);
      setVolunteerInbox(active);
      setArchivedVolunteerInbox(archive);
    } catch {
      setMessageError("Archiviazione messaggio non riuscita.");
    }
  }

  useEffect(() => {
    if (!messagesOpen || dataMode !== "live" || volunteerOnly) return;
    if (sentArchiveOpen) loadDashboardMessagesV2(true).then(setArchivedDashboardMessages).catch(() => {});
    if (inboxArchiveOpen) loadVolunteerInboxMessagesV2(true).then(setArchivedVolunteerInbox).catch(() => {});
  }, [messagesOpen, sentArchiveOpen, inboxArchiveOpen, dataMode, volunteerOnly]);

  const activeVolunteers = dataMode === "test" ? (testVolunteers.length ? testVolunteers : demoVolunteers.slice(0, testSize)) : liveVolunteers;
  const messageVolunteerMatches = useMemo(() => {
    const q = messageTargetQuery.trim().toLowerCase();
    if (!q) return activeVolunteers.slice(0, 8);
    return activeVolunteers
      .filter((v) => `${v.name} ${v.group || ""}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [activeVolunteers, messageTargetQuery]);
  const unreadVolunteerInboxCount = volunteerInbox.filter((m) => !m.readAt).length;
  const unreadVolunteerMessageCount = volunteerMessages.filter((m) => !m.readAt).length;
  const unconfirmedVolunteerMessageCount = volunteerMessages.filter((m) => m.urgent && !m.acknowledgedAt).length;
  const pendingConfirmationsCount = dashboardMessages.filter((m) => m.urgent && m.acknowledgedCount < m.recipientCount).length;

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

  function openOperationalPoint(point: OperationalPoint) {
    const existing = teams.find((team) =>
      team.day === day && team.slot === slot && team.activity === point.activity
    );

    if (!activities.includes(point.activity)) {
      setActivities((current) => [...current, point.activity]);
    }

    if (!existing) {
      setTeams((current) => [...current, {
        id: `point-${point.id}-${Date.now()}`,
        name: point.name,
        day,
        slot,
        place: point.name,
        activity: point.activity,
        target: 0,
        memberIds: [],
        pinned: false,
      }]);
    }

    setActivity(point.activity);
    setMobileTab("turno");
    setEditingTeam(true);
    setFocusContext(`${point.name.toUpperCase()} — ${day} · ${slot}. Il fabbisogno volontari è lasciato da definire agli organizzatori.`);
    goToSection("turno-workspace", true, "places-workspace");
  }

  const macroActivities = activities.filter((item) => !item.includes(" — "));

  const directoryVolunteers = dataMode === "test" ? [...activeVolunteers, testVolunteer] : activeVolunteers;
  const filteredDirectoryVolunteers = directoryVolunteers.filter((v) => {
    const q = directoryQuery.trim().toLocaleLowerCase("it");
    if (!q) return true;
    return [v.name, v.group, v.phone || "", v.email || ""].join(" ").toLocaleLowerCase("it").includes(q);
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
    staffing: {
      title: "Fabbisogno del turno",
      body: "Premi Modifica turno e inserisci quante persone servono. Con 0 il fabbisogno è ancora da definire e il turno non entra nei suggerimenti. Le persone già assegnate restano al loro posto.",
    },
    suggest: {
      title: "Proposta automatica",
      body: "Inserisci prima quante persone servono per turno. Il sistema propone volontari disponibili e con preferenze compatibili, limitando il carico. Non modifica nulla finché un organizzatore non conferma; squadre fissate e assegnazioni esistenti restano intatte.",
    },
    pin: {
      title: "Fissa squadra",
      body: "Blocca la squadra e la esclude dai suggerimenti automatici. Le persone già assegnate non vengono mai rimosse dalle proposte.",
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
  const operationalActivityNames = new Set(operationalPoints.map((point) => point.activity));
  const operationalTeams = teams.filter((team) => operationalActivityNames.has(team.activity));
  const shiftSummary = operationalTeams
    .filter((team) => team.day === day)
    .map((team) => ({ activity: team.activity, slot: team.slot, assigned: team.memberIds.filter((id) => activeVolunteerIds.has(id)).length, target: team.target }));
  const currentShiftSummary = shiftSummary.filter((item) => item.slot === slot);
  const uncoveredPlaces = shiftSummary.reduce((sum, item) => item.target > 0 ? sum + Math.max(0, item.target - item.assigned) : sum, 0);
  const underCoveredTeams = operationalTeams.filter((team) =>
    team.day === day && team.target > 0 && team.memberIds.filter((id) => activeVolunteerIds.has(id)).length < team.target
  );
  const firstUnderCoveredTeam = underCoveredTeams[0];
  const attentionIssueCount = underCoveredTeams.length + unreadVolunteerInboxCount + pendingConfirmationsCount;
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
    setProposalConfirmedInGuide(false);
    // Compute a cross-team preview; never modify teams before approval.
    const baseline = JSON.stringify(teams);
    const used = new Map<string, number>();
    const occupied = new Set<string>();
    for (const team of teams) for (const id of team.memberIds) {
      used.set(id, (used.get(id) ?? 0) + 1);
      occupied.add(team.day + "|" + team.slot + "|" + id);
    }
    const changes: { teamId: string; volunteerIds: string[] }[] = [];
    for (const team of [...teams].filter((t) => !t.pinned && t.target > 0 && t.memberIds.length < t.target)
      .sort((a, b) => a.memberIds.length / a.target - b.memberIds.length / b.target)) {
      const needed = team.target - team.memberIds.length;
      const choices = activeVolunteers.filter((v) => {
        const preferred = v.activities.includes(team.activity) || v.activities.includes(team.activity.split(" — ")[0]);
        return preferred && v.days.includes(team.day) && v.slots.includes(team.slot)
          && !occupied.has(team.day + "|" + team.slot + "|" + v.id)
          && (used.get(v.id) ?? 0) < 3;
      }).sort((a,b) => (used.get(a.id) ?? 0) - (used.get(b.id) ?? 0) || b.priority - a.priority);
      const volunteerIds = choices.slice(0, needed).map((v) => v.id);
      volunteerIds.forEach((id) => {
        used.set(id, (used.get(id) ?? 0) + 1);
        occupied.add(team.day + "|" + team.slot + "|" + id);
      });
      if (volunteerIds.length) changes.push({ teamId: team.id, volunteerIds });
    }
    setProposal(changes.length ? { baseline, changes } : null);
    setFeedback(changes.length ? "Proposta pronta: controlla i nominativi e conferma solo se corretti." : "Nessuna proposta: verifica fabbisogni, preferenze e disponibilità dei volontari.");
  }

  function confirmProposal() {
    if (!proposal) return;
    if (JSON.stringify(teams) !== proposal.baseline) {
      setProposal(null);
      setFeedback("I turni sono cambiati: genera nuovamente la proposta per non sovrascrivere il lavoro altrui.");
      return;
    }
    const changes = new Map(proposal.changes.map((item) => [item.teamId, item.volunteerIds]));
    setTeams((current) => current.map((team) => {
      if (team.pinned || !changes.has(team.id)) return team;
      return { ...team, memberIds: [...team.memberIds, ...changes.get(team.id)!.filter((id) => !team.memberIds.includes(id))] };
    }));
    setProposal(null);
    setProposalConfirmedInGuide(true);
    setFeedback("Proposta confermata. I nominativi sono stati aggiunti senza sostituire le assegnazioni precedenti.");
  }

  function updateVolunteerOpsLocal(id: string, patch: Partial<Pick<Volunteer, "status" | "confirmed" | "priority" | "internalNotes" | "tags">>) {
    if (dataMode !== "live" || !openAccess) return;
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

  const coverage = selectedTeam.target > 0
    ? Math.min(100, Math.round((teamMembers.length / selectedTeam.target) * 100))
    : 0;
  const coverageLabel = selectedTeam.target > 0 ? `${coverage}%` : "—";

  type DashboardSectionId = "places-workspace" | "priorities-workspace" | "turno-workspace" | "people-workspace" | "coverage-workspace";

  const sectionLabels: Record<DashboardSectionId, string> = {
    "places-workspace": "Sale e presidi",
    "priorities-workspace": "Priorità",
    "coverage-workspace": "Regia turno",
    "turno-workspace": "Turno selezionato",
    "people-workspace": "Persone",
  };

  function currentDashboardSection(): DashboardSectionId | null {
    if (typeof window === "undefined") return null;
    const ids = Object.keys(sectionLabels) as DashboardSectionId[];
    const visible = ids
      .map((id) => {
        const el = document.getElementById(id);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const intersects = rect.bottom > 80 && rect.top < window.innerHeight - 40;
        return intersects ? { id, distance: Math.abs(rect.top - 120) } : null;
      })
      .filter((item): item is { id: DashboardSectionId; distance: number } => Boolean(item))
      .sort((a, b) => a.distance - b.distance);
    return visible[0]?.id ?? null;
  }

  function goToSection(id: DashboardSectionId, rememberOrigin = true, originOverride: DashboardSectionId | null = null) {
    setActiveWorkspace(id);
    if (rememberOrigin) {
      const origin = originOverride ?? currentDashboardSection();
      if (origin && origin !== id) {
        setReturnSection({ id: origin, label: sectionLabels[origin] });
      }
    }
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function returnToPreviousSection() {
    if (!returnSection) return;
    const target = returnSection;
    setPeopleFilterOpen(false);
    setEditingTeam(false);
    setFocusContext("");
    setMobileTab(target.id === "turno-workspace" ? "turno" : target.id === "people-workspace" ? "persone" : "panoramica");
    setReturnSection(null);
    goToSection(target.id, false);
  }

  function navigateDashboardSection(id: DashboardSectionId) {
    if (id === "turno-workspace") setMobileTab("turno");
    else if (id === "people-workspace") {
      setPeopleFilterOpen(true);
      setMobileTab("persone");
    } else {
      setMobileTab("panoramica");
    }
    setFocusContext("");
    setReturnSection(null);
    setActiveWorkspace(id);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function toggleDashboardWorkspace(id: DashboardSectionId) {
    if (activeWorkspace === id) {
      setActiveWorkspace(null);
      setReturnSection(null);
      setFocusContext("");
      setMobileTab("panoramica");
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    navigateDashboardSection(id);
  }

  const assignmentGuide = [
    { title: "Controlla giorno e fascia", details: "Usa i due campi evidenziati. Dopo aver verificato le scelte, premi Continua.", target: "turno-workspace" as const, focus: "guide-date" },
    { title: "Scegli l'attività", details: "Seleziona l'attività nel menu evidenziato; poi premi Continua.", target: "people-workspace" as const, focus: "guide-activity" },
    { title: "Trova le persone", details: "Controlla le disponibilità nell'elenco e seleziona i volontari per la squadra.", target: "people-workspace" as const, focus: "guide-people" },
    { title: "Controlla la squadra", details: "Controlla qui a destra i nominativi assegnati e i posti ancora scoperti. Puoi terminare senza tornare all’inizio.", target: "people-workspace" as const, focus: "guide-team" },
  ];
  const guideNewMembers = selectedTeam.memberIds.filter((id) => !guidedStartingMemberIds.includes(id));
  const guideCanContinue = guidedAssignmentStep === 0 ? Boolean(day && slot)
    : guidedAssignmentStep === 1 ? Boolean(activity)
    : guidedAssignmentStep === 2 || guidedAssignmentStep === 3 ? selectedTeam.memberIds.length > 0 : false;
  function startAssignmentGuide() {
    setGuidedStartingMemberIds([...selectedTeam.memberIds]);
    setGuideMenuOpen(false);
    setContextGuideStep(null);
    navigateAssignmentGuide(0);
  }
  function navigateAssignmentGuide(step: number) {
    if (guidedAssignmentStep !== null && step > guidedAssignmentStep && !guideCanContinue) return;
    const next = Math.max(0, Math.min(step, assignmentGuide.length - 1));
    setGuidedAssignmentStep(next);
    navigateDashboardSection(assignmentGuide[next].target);
    window.setTimeout(() => {
      const peoplePane = document.getElementById("people-workspace");
      if (next >= 2 && peoplePane) {
        peoplePane.scrollTop = 0;
        peoplePane.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        document.getElementById(next === 0 ? "guide-shift" : assignmentGuide[next].focus)?.scrollIntoView({ behavior: "instant", block: "center" });
      }
    }, 450);
  }

  function guideActions(step: number) {
    if (guidedAssignmentStep !== step) return null;
    return (
      <div role="region" aria-label={`Guida operativa: passaggio ${step + 1}`} className={`my-3 flex flex-wrap items-center gap-3 border-2 border-amber-400 bg-amber-400/10 p-3 ${isLight ? "text-ink" : "text-paper"}`}>
        <div className="min-w-[180px] flex-1">
          <strong className="block text-sm">Passaggio {step + 1} di 4 · {assignmentGuide[step].title}</strong>
          <p className="mt-1 text-xs">{assignmentGuide[step].details}</p>
          {step === 2 ? <p className="mt-1 text-xs font-bold">In squadra: {selectedTeam.memberIds.length} persone · Nuove aggiunte in questo percorso: {guideNewMembers.length}. Puoi anche controllare una squadra già compilata. Le persone già impegnate richiedono conferma.</p> : null}
          {step === 3 ? <p className="mt-1 text-xs font-bold">Assegnati: {selectedTeam.memberIds.length} / {selectedTeam.target} · Posti scoperti: {Math.max(0, selectedTeam.target - selectedTeam.memberIds.length)}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={step === 0} onClick={() => navigateAssignmentGuide(step - 1)} className="min-h-10 border border-amber-400 px-3 text-xs font-bold disabled:opacity-40">Indietro</button>
          {step < 3 ? (
            <button type="button" disabled={!guideCanContinue} onClick={() => navigateAssignmentGuide(step + 1)} className="min-h-10 bg-amber-400 px-4 text-xs font-black text-black disabled:opacity-40">Continua →</button>
          ) : (
            <button type="button" disabled={!guideCanContinue} onClick={() => setGuidedAssignmentStep(null)} className="min-h-10 bg-amber-400 px-4 text-xs font-black text-black disabled:opacity-40">Termina guida</button>
          )}
          <button type="button" onClick={() => setGuidedAssignmentStep(null)} className="min-h-10 px-2 text-xs underline">Esci</button>
        </div>
      </div>
    );
  }

  const contextGuideCopy = {
    staffing: ["Scegli data e fascia", "Apri la modifica del turno e controlla il numero di persone necessarie.", "Verifica che il fabbisogno sia corretto prima di terminare."],
    priority: ["Apri il primo turno con posti scoperti", "Aggiungi volontari disponibili alla squadra, senza modificare altri turni.", "Controlla la copertura del turno selezionato."],
    people: ["Trova la squadra", "Seleziona giorno, fascia e attività.", "Controlla le persone presenti e modifica la squadra se necessario."],
    assign: ["Apri le assegnazioni suggerite", "Genera e verifica l’anteprima senza modificare le squadre.", "Conferma i nominativi solo dopo averli controllati."],
    contacts: ["Cerca il volontario", "Usa la rubrica per trovare la persona.", "Apri il contatto desiderato; non inviare comunicazioni automaticamente."],
    messages: ["Apri le comunicazioni", "Scegli a chi scrivere e componi il messaggio.", "Rileggi destinatari e testo prima dell'invio."],
    activities: ["Consulta le attività", "Individua l'attività o il sottogruppo da gestire.", "Verifica i cambiamenti prima di chiudere."],
    regia: ["Apri la regia del turno", "Controlla turni e squadre da presidiare nella regia.", "Apri il turno interessato e verifica le assegnazioni."],
    myturns: ["Apri l’elenco delle persone", "Cerca il volontario e controlla i turni assegnati.", "Verifica data, fascia e attività; per correggere torna alla gestione squadre."],
    inbox: ["Apri i messaggi ricevuti", "Leggi le comunicazioni e seleziona quelle da gestire.", "Se opportuno, segna il messaggio come letto o archivialo."],
    sent: ["Apri i messaggi inviati", "Controlla destinatari e cronologia degli invii.", "Verifica le comunicazioni prima di chiudere."],
    personal: ["Apri la vista personale", "Consulta i turni e le comunicazioni destinati al volontario.", "Per le modifiche organizzative torna alla gestione squadre."],
    preferences: ["Consulta le preferenze", "Controlla notifiche sonore, guida e modalità dati.", "Non cambiare PROVA/OPERATIVO senza verificare le conseguenze."],
    sharing: ["Apri la sezione di condivisione", "Scegli il canale e controlla il contenuto.", "Condividi soltanto dopo una verifica dei destinatari."],
    overview: ["Panoramica", "Consulta i dati riepilogativi.", "Scegli un'altra operazione quando necessario."],
  } as const;
  // Guida semiautomatica: individua ed evidenzia un comando, senza attivarlo.
  // Unico modello di guida: un percorso per operazione, con target verificato nel DOM.
  const guideTargets: Record<typeof guideChoice, string[]> = {
    overview: [],
    staffing: ["guide-shift", "guide-staffing-target", "guide-staffing-target"],
    priority: ["priorities-workspace", "guide-team", "guide-team"],
    people: ["guide-shift", "guide-people", "guide-team"],
    assign: ["guide-people", "guide-people", "guide-team"],
    regia: ["coverage-workspace", "coverage-workspace", "coverage-workspace"],
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
  function locateGuideTarget(choice: typeof guideChoice, step: number) {
    document.querySelectorAll("[data-organizer-guide-focus]").forEach((node) => {
      (node as HTMLElement).style.outline = "";
      (node as HTMLElement).style.outlineOffset = "";
      node.removeAttribute("data-organizer-guide-focus");
    });
    const id = guideTargets[choice]?.[step];
    const target = id ? document.getElementById(id) : null;
    if (!target || target.closest(".hidden") || getComputedStyle(target).display === "none") return false;
    target.setAttribute("data-organizer-guide-focus", "true");
    target.style.outline = "3px solid #fbbf24";
    target.style.outlineOffset = "3px";
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    return true;
  }
  function contextGuide() {
    if (contextGuideStep === null || guideChoice === "overview" || guidedAssignmentStep !== null) return null;
    const noPriorities = guideChoice === "priority" && underCoveredTeams.length === 0 && contextGuideStep === 0;
    const priorityTeam = priorityTeamId ? operationalTeams.find((team) => team.id === priorityTeamId) : null;
    const priorityCovered = Boolean(priorityTeam && priorityTeam.memberIds.filter((id) => activeVolunteerIds.has(id)).length >= priorityTeam.target);
    const peopleDone = guideChoice === "people" && peopleBaseline !== null && peopleTeamKey === `${day}|${slot}|${activity}` && selectedTeam.id !== "__draft__" && [...selectedTeam.memberIds].sort().join("|") !== peopleBaseline;
    const staffingDone = guideChoice === "staffing" && staffingBaseline !== null && staffingTeamKey === `${day}|${slot}|${activity}` && selectedTeam.id !== "__draft__" && selectedTeam.target !== staffingBaseline;
    const targetAvailable = Boolean(guideTargets[guideChoice]?.[contextGuideStep]);
    const instructions = contextGuideCopy[guideChoice];
    function nextContextStep() {
      if (guideChoice === "assign" && contextGuideStep === 0) {
        setContextGuideStep(1);
        setMobileTab("persone");
        setPeopleFilterOpen(true);
        setActiveWorkspace("people-workspace");
        window.setTimeout(() => locateGuideTarget("assign", 1), 200);
        return;
      }
      if (guideChoice === "assign" && contextGuideStep === 1) {
        if (!proposal) return;
        setContextGuideStep(2);
        return;
      }
      if (guideChoice === "assign" && contextGuideStep === 2 && !proposalConfirmedInGuide) return;
      if (guideChoice === "people" && contextGuideStep === 0) {
        setPeopleBaseline([...selectedTeam.memberIds].sort().join("|"));
        setPeopleTeamKey(`${day}|${slot}|${activity}`);
        setContextGuideStep(1);
        setPeopleFilterOpen(true);
        setMobileTab("persone");
        setActiveWorkspace("people-workspace");
        window.setTimeout(() => locateGuideTarget("people", 1), 250);
        return;
      }
      if (guideChoice === "people" && contextGuideStep === 1) {
        if (!peopleDone) return;
        setContextGuideStep(2);
        setMobileTab("squadra");
        window.setTimeout(() => locateGuideTarget("people", 2), 250);
        return;
      }
      if (guideChoice === "people" && contextGuideStep === 2 && !peopleDone) return;
      if (guideChoice === "priority" && contextGuideStep === 0) {
        const affected = firstUnderCoveredTeam;
        if (!affected) return;
        setPriorityTeamId(affected.id);
        setDay(affected.day);
        setSlot(affected.slot);
        setActivity(affected.activity);
        setContextGuideStep(1);
        setPeopleFilterOpen(true);
        setMobileTab("squadra");
        setActiveWorkspace("people-workspace");
        window.setTimeout(() => locateGuideTarget("priority", 1), 250);
        return;
      }
      if (guideChoice === "priority" && contextGuideStep === 1) {
        if (!priorityCovered) return;
        setContextGuideStep(2);
        return;
      }
      if (guideChoice === "priority" && contextGuideStep === 2 && !priorityCovered) return;
      if (guideChoice === "staffing" && contextGuideStep === 0) {
        setStaffingBaseline(selectedTeam.target);
        setStaffingTeamKey(`${day}|${slot}|${activity}`);
        setContextGuideStep(1);
        setPeopleFilterOpen(true);
        setMobileTab("squadra");
        setActiveWorkspace("people-workspace");
        setEditingTeam(true);
        window.setTimeout(() => locateGuideTarget("staffing", 1), 250);
        return;
      }
      if (guideChoice === "staffing" && contextGuideStep === 1) {
        if (!staffingDone) return;
        setContextGuideStep(2);
        window.setTimeout(() => locateGuideTarget("staffing", 2), 100);
        return;
      }
      if (contextGuideStep === 2) { if (guideChoice === "staffing" && !staffingDone) return; setContextGuideStep(null); locateGuideTarget("overview", 0); return; }
      const next = contextGuideStep + 1;
      setContextGuideStep(next);
      window.setTimeout(() => locateGuideTarget(guideChoice, next), 100);
    }
    return (
      <div role="region" aria-label="Guida operativa" className={`my-2 border-l-4 border-amber-400 px-3 py-3 ${isLight ? "bg-amber-50 text-ink" : "bg-amber-400/10 text-paper"}`}>
        {noPriorities ? (
          <>
            <strong className="block text-sm">✓ Nessuna criticità rilevata</strong>
            <p className="mt-1 text-xs">Nessun intervento necessario per le priorità attualmente visualizzate. Puoi scegliere un'altra operazione.</p>
            <button type="button" onClick={() => { setContextGuideStep(null); setGuideMenuOpen(true); goToDashboardTop(); }} className="mt-2 min-h-10 border border-amber-400 px-3 text-xs font-bold">Scegli un'altra operazione →</button>
          </>
        ) : (
          <>
            <strong className="block text-sm">Passaggio {contextGuideStep + 1}/3 · {instructions[contextGuideStep]}</strong>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" disabled={!targetAvailable} onClick={() => locateGuideTarget(guideChoice, contextGuideStep)} className="min-h-10 border border-amber-400 px-3 text-xs font-bold disabled:opacity-40">◎ Mostra dove intervenire</button>
              {contextGuideStep > 0 ? <button type="button" onClick={() => { const next = contextGuideStep - 1; setContextGuideStep(next); window.setTimeout(() => locateGuideTarget(guideChoice, next), 80); }} className="min-h-10 border px-3 text-xs">Indietro</button> : null}
              <button type="button" onClick={nextContextStep} disabled={(guideChoice === "assign" && ((contextGuideStep === 1 && !proposal) || (contextGuideStep === 2 && !proposalConfirmedInGuide))) || (guideChoice === "staffing" && contextGuideStep > 0 && !staffingDone) || (guideChoice === "priority" && contextGuideStep > 0 && !priorityCovered) || (guideChoice === "people" && contextGuideStep > 0 && !peopleDone)} className="min-h-10 bg-amber-400 px-3 text-xs font-bold text-black disabled:opacity-40">{contextGuideStep === 2 ? (guideChoice === "staffing" ? "Concludi verifica" : "Termina guida") : "Passaggio successivo →"}</button>
              <button type="button" onClick={() => setContextGuideStep(null)} className="min-h-10 px-2 text-xs underline">Esci</button>
            </div>
            {!targetAvailable ? <p role="status" className="mt-2 text-xs">Comando non individuato in questa vista: la guida non considera il passaggio verificato.</p> : null}
            {guideChoice === "assign" && contextGuideStep > 0 ? <p role="status" className="mt-2 text-xs font-semibold">{proposalConfirmedInGuide ? "Proposta confermata nella dashboard: controlla anche la persistenza." : proposal ? "Anteprima disponibile: verifica i nomi e conferma esplicitamente, oppure annulla." : "Premi Proponi assegnazioni per generare l'anteprima. Nessuna modifica verrà applicata automaticamente."}</p> : null}
            {guideChoice === "people" && contextGuideStep > 0 ? <p role="status" className="mt-2 text-xs font-semibold">{peopleDone ? "Composizione della squadra modificata nella dashboard. Verifica la persistenza prima dell'uso operativo." : "Aggiungi o rimuovi un componente della squadra selezionata per proseguire."}</p> : null}
            {guideChoice === "priority" && contextGuideStep > 0 ? <p role="status" className="mt-2 text-xs font-semibold">{priorityCovered ? "Copertura raggiunta nella vista corrente. Verifica la persistenza dei dati prima di considerare definitiva la modifica." : `Turno da coprire: ${priorityTeam?.activity || "selezione in corso"} · ${priorityTeam?.day || ""} ${priorityTeam?.slot || ""}. Assegna le persone mancanti per proseguire.`}</p> : null}
            {guideChoice === "staffing" && contextGuideStep > 0 ? <p role="status" className="mt-2 text-xs font-semibold">{staffingDone ? `Fabbisogno aggiornato nella dashboard: ${selectedTeam.target} persone. ${dataMode === "test" ? "Dato di PROVA." : "Controllare anche la sincronizzazione operativa."}` : "Modifica il campo Persone necessarie per proseguire, senza cambiare il turno selezionato. Nessun aggiornamento verificato."}</p> : null}
            <p className="mt-2 text-[11px] opacity-70">La guida non salva né invia modifiche. Prosegui dopo aver controllato il risultato.</p>
          </>
        )}
      </div>
    );
  }

  function guideTo(choice: typeof guideChoice) {
    setGuidedAssignmentStep(null);
    setContextGuideStep(choice === "overview" ? null : 0);
    setGuideMenuOpen(false);
    setGuideChoice(choice);
    if (choice === "assign") setProposalConfirmedInGuide(false);
    if (choice === "priority") setPriorityTeamId(null);
    if (choice === "people") { setPeopleBaseline(null); setPeopleTeamKey(""); }
    if (choice === "staffing") { setStaffingBaseline(null); setStaffingTeamKey(""); }
    window.setTimeout(() => locateGuideTarget(choice, 0), 500);
    setHelpTopic(null);
    setDirectoryOpen(choice === "contacts");
    setMessagesOpen(choice === "messages" || choice === "inbox" || choice === "sent");
    if (choice === "inbox") setMessagePane("inbox");
    if (choice === "sent") setMessagePane("sent");
    if (choice === "messages") setMessagePane("compose");
    setPersonalOpen(choice === "personal");
    setCatalogOpen(choice === "activities");
    if (choice === "overview" || choice === "contacts" || choice === "messages" || choice === "activities" || choice === "inbox" || choice === "sent" || choice === "personal" || choice === "preferences" || choice === "sharing") {
      goToDashboardTop();
    } else {
      navigateDashboardSection(choice === "priority" ? "priorities-workspace" : choice === "regia" ? "coverage-workspace" : choice === "assign" || choice === "myturns" ? "people-workspace" : "turno-workspace");
      if (choice === "staffing") setEditingTeam(true);
      else setEditingTeam(false);
    }
  }

  function goToDashboardTop() {
    setReturnSection(null);
    setFocusContext("");
    setActiveWorkspace(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  if (!volunteerOnly && !organizerAccessReady) {
    return (
      <main className={`min-h-screen transition-colors ${shell}`}>
        <div className="mx-auto flex min-h-screen max-w-lg items-center px-4">
          <div className={`w-full border-2 p-5 ${panel}`}>
            <img
              src={costacciaroLogoDataUri}
              style={{ filter: "brightness(0) saturate(100%) invert(26%) sepia(86%) saturate(3386%) hue-rotate(330deg) brightness(98%) contrast(93%)" }}
              alt="Costacciaro 2026"
              className="mx-auto h-auto w-[240px] max-w-[70vw]"
            />
            <p className={`mt-4 text-center text-sm ${muted}`}>Verifica accesso organizzatori…</p>
          </div>
        </div>
      </main>
    );
  }

  if (!volunteerOnly && !organizerAccessGranted) {
    return (
      <main className={`min-h-screen transition-colors ${shell}`}>
        <div className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-8">
          <div className={`w-full border-2 p-5 ${panel}`}>
            <img
              src={costacciaroLogoDataUri}
              style={{ filter: "brightness(0) saturate(100%) invert(26%) sepia(86%) saturate(3386%) hue-rotate(330deg) brightness(98%) contrast(93%)" }}
              alt="Costacciaro 2026"
              className="h-auto w-[250px] max-w-[75vw] object-contain object-left"
            />
            <p className="mt-5 text-[10px] font-black uppercase text-[#c76476]">Dashboard organizzatori</p>
            <h1 className="mt-1 text-2xl font-black uppercase">Accesso al pannello</h1>
            <p className={`mt-2 text-sm ${muted}`}>Prima associazione: usa la tua email autorizzata e le ultime 4 cifre del telefono. Questo dispositivo verrà poi riconosciuto automaticamente.</p>

            <div className="mt-5 grid gap-3">
              <label className="grid gap-1 text-xs font-bold">
                Email
                <input
                  type="email"
                  value={organizerEmail}
                  onChange={(e) => setOrganizerEmail(e.target.value)}
                  autoComplete="email"
                  className={`min-h-11 border-2 px-3 ${input}`}
                  placeholder="email organizzatore"
                />
              </label>
              <label className="grid gap-1 text-xs font-bold">
                Ultime 4 cifre telefono
                <input
                  inputMode="numeric"
                  maxLength={4}
                  value={organizerPhone4}
                  onChange={(e) => setOrganizerPhone4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className={`min-h-11 border-2 px-3 ${input}`}
                  placeholder="1234"
                />
              </label>
              <button
                type="button"
                onClick={pairOrganizerAccess}
                disabled={organizerAccessBusy || !organizerEmail.trim() || organizerPhone4.length !== 4}
                className="min-h-11 border-2 border-[#b85668] bg-[#b85668] px-4 text-xs font-black uppercase text-white disabled:opacity-50"
              >
                {organizerAccessBusy ? "Verifica…" : "Associa questo dispositivo"}
              </button>
              {organizerAccessError ? <p className="text-xs font-bold text-[#c76476]">{organizerAccessError}</p> : null}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (personalOpen) {
    return (
      <main className={`min-h-screen transition-colors ${shell}`}>
        <div className="mx-auto max-w-4xl px-3 py-4 sm:px-5 lg:py-7">
          <header className="mb-0 border-b-2 border-[#b85668] pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <img
                  src={costacciaroLogoDataUri}
                  style={{ filter: "brightness(0) saturate(100%) invert(26%) sepia(86%) saturate(3386%) hue-rotate(330deg) brightness(98%) contrast(93%)" }}
                  alt="Costacciaro 2026"
                  className="h-auto w-[190px] max-w-[45vw] object-contain object-left sm:w-[260px]"
                />
                <h1 className="mt-2 text-lg font-black uppercase sm:text-2xl">Il mio Costacciaro</h1>
              </div>

              {volunteerOnly && volunteerDeviceLinked && personalVolunteer ? (
                <div className="min-w-0 max-w-[48%] text-right">
                  <p className="truncate text-xs font-black uppercase sm:text-sm">{personalVolunteer.name}</p>
                  {personalVolunteer.group ? <p className={`mt-0.5 truncate text-[9px] sm:text-[10px] ${muted}`}>{personalVolunteer.group}</p> : null}
                  <button
                    type="button"
                    onClick={unlinkVolunteerDevice}
                    className="mt-1 text-[8px] font-black uppercase underline underline-offset-2 opacity-70"
                  >
                    Cambia profilo
                  </button>
                </div>
              ) : !volunteerOnly ? (
                <button
                  type="button"
                  onClick={() => setPersonalOpen(false)}
                  className="min-h-11 border-2 border-[#b85668] px-3 text-[10px] font-black uppercase sm:text-xs"
                >
                  Torna alla dashboard
                </button>
              ) : null}
            </div>
          </header>

          {volunteerOnly && volunteerDeviceLinked ? (
            <nav className={`sticky top-0 z-30 -mx-1 mb-3 mt-0 border-b-2 border-[#b85668] p-2 shadow-lg ${isLight ? "bg-paper/95" : "bg-ink/95"} backdrop-blur`}>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setVolunteerMessagesOpen(false);
                    setVolunteerReplyOpen(false);
                    setVolunteerAllTurnsOpen(false);
                    document.getElementById("volunteer-turns")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="min-h-10 border px-2 text-[10px] font-black uppercase"
                >
                  I miei turni
                </button>
                <button
                  type="button"
                  onClick={openVolunteerMessages}
                  className={`relative min-h-10 border px-2 text-[10px] font-black uppercase ${volunteerMessagesOpen ? "bg-[#b85668] text-white border-[#b85668]" : ""}`}
                >
                  Messaggi
                  {unreadVolunteerMessageCount ? (
                    <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[#b85668] px-1.5 py-0.5 text-[9px] text-white">
                      {unreadVolunteerMessageCount}
                    </span>
                  ) : unconfirmedVolunteerMessageCount ? (
                    <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full border border-[#b85668] px-1.5 py-0.5 text-[9px]">
                      {unconfirmedVolunteerMessageCount}
                    </span>
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => setVolunteerReplyOpen((current) => !current)}
                  className={`min-h-10 border px-2 text-[10px] font-black uppercase ${volunteerReplyOpen ? "bg-[#b85668] text-white border-[#b85668]" : ""}`}
                >
                  Scrivi
                </button>
              </div>
            </nav>
          ) : null}

          <section className={`border-2 p-3 sm:p-5 ${panel}`}>
            {!(volunteerOnly && volunteerDeviceLinked) ? (
                          <label className="block text-[11px] sm:text-xs">
                            <span className="mb-1 block font-black uppercase opacity-70">Trova il tuo nome</span>
                            <div className={`flex min-h-11 items-center gap-2 border-2 px-3 ${input}`}>
                              <Search className="size-4 shrink-0 opacity-60" />
                              <input
                                value={personalQuery}
                                onChange={(e) => { setPersonalQuery(e.target.value); setPersonalVolunteerId(""); }}
                                placeholder="Nome o cognome"
                                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:opacity-45"
                              />
                              {personalQuery ? <button type="button" onClick={() => { setPersonalQuery(""); setPersonalVolunteerId(""); }} className="text-[10px] font-black uppercase">Pulisci</button> : null}
                            </div>
                          </label>
              
                          ) : null}

            {personalMatches.length && !personalVolunteer ? (
              <div className={`mt-1 max-h-64 overflow-auto border-2 border-[#b85668] p-1 ${isLight ? "bg-white" : "bg-ink"}`}>
                {personalMatches.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => { setPersonalVolunteerId(v.id); setPersonalQuery(v.name); }}
                    className={`block w-full border-b px-3 py-2 text-left last:border-b-0 ${isLight ? "border-ink/10 hover:bg-black/5" : "border-paper/10 hover:bg-white/5"}`}
                  >
                    <span className="block text-sm font-black">{v.name}</span>
                    <span className={`text-[10px] ${muted}`}>{v.group || "Gruppo non indicato"}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {personalVolunteer ? (
              <div className={volunteerOnly && volunteerDeviceLinked ? "mt-3" : "mt-5"}>
                {!(volunteerOnly && volunteerDeviceLinked) ? (
                                  <div className={`border-2 p-4 ${panelSoft}`}>
                                    <p className="text-[10px] font-black uppercase text-[#c76476]">Volontario</p>
                                    <h2 className="mt-1 text-xl font-black uppercase">{personalVolunteer.name}</h2>
                                    {personalVolunteer.group ? <p className={`mt-1 text-xs ${muted}`}>{personalVolunteer.group}</p> : null}
                                  </div>
                ) : null}

                {volunteerOnly && !volunteerDeviceLinked ? (
                  <div className={`mt-3 border-2 p-4 ${panel}`}>
                      <div>
                        <p className="text-[10px] font-black uppercase text-[#c76476]">Verifica in 2 passaggi</p>
                        <p className={`mt-1 text-xs ${muted}`}>Usa i dati già forniti nella candidatura. Non devi aprire la posta.</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <label className="grid gap-1">
                            <span className="text-[10px] font-black uppercase">Email</span>
                            <input
                              type="email"
                              value={volunteerPairEmail}
                              onChange={(e) => setVolunteerPairEmail(e.target.value)}
                              placeholder="La tua email"
                              className={`min-h-11 border-2 px-3 ${input}`}
                              autoComplete="email"
                            />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-black uppercase">Ultime 4 cifre telefono</span>
                            <input
                              inputMode="numeric"
                              maxLength={4}
                              value={volunteerPairPhone4}
                              onChange={(e) => setVolunteerPairPhone4(e.target.value.replace(/\D/g, "").slice(0,4))}
                              placeholder="1234"
                              className={`min-h-11 border-2 px-3 ${input}`}
                            />
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={pairVolunteerDevice}
                          disabled={volunteerPairBusy || !volunteerPairEmail.trim() || volunteerPairPhone4.length !== 4}
                          className="mt-3 min-h-11 border-2 border-[#b85668] bg-[#b85668] px-4 text-xs font-black uppercase text-white disabled:opacity-50"
                        >
                          {volunteerPairBusy ? "Verifica…" : "Associa questo dispositivo"}
                        </button>
                        {volunteerPairError ? <p className="mt-2 text-xs font-bold text-[#c76476]">{volunteerPairError}</p> : null}
                      </div>
                  </div>
                ) : null}

                {volunteerOnly && volunteerDeviceLinked ? (
                  <>
                    {volunteerMessagesOpen ? (
                      <div className={`mt-3 border-2 p-4 ${panel}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-black uppercase text-[#c76476]">Messaggi</p>
                            <h3 className="text-lg font-black uppercase">Comunicazioni per te</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSoundAlertsEnabled((current) => !current)}
                              className={`border px-2 py-1 text-[9px] font-black uppercase ${soundAlertsEnabled ? "border-emerald-600 text-emerald-600" : ""}`}
                            >
                              {soundAlertsEnabled ? "Suono on" : "Suono off"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setVolunteerMessagesOpen(false)}
                              className="grid size-9 place-items-center border border-[#b85668]"
                              aria-label="Chiudi messaggi"
                            >
                              <X className="size-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2">
                          {volunteerMessages.length ? volunteerMessages.map((m) => (
                            <div key={m.id} className={`border-2 p-3 ${m.urgent ? "border-[#b85668]" : panelSoft}`}>
                              <div className="flex items-start justify-between gap-2">
                                <strong className="text-sm">{m.title}</strong>
                                <span className={`text-[9px] font-black uppercase ${m.readAt ? "text-emerald-600" : "text-[#c76476]"}`}>
                                  {m.readAt ? "Letto" : "Nuovo"}
                                </span>
                              </div>
                              <p className="mt-2 text-sm leading-relaxed">{m.body}</p>
                              {m.urgent ? (
                                <div className="mt-3">
                                  {m.acknowledgedAt ? (
                                    <span className="inline-flex items-center gap-1 border border-emerald-600 px-2 py-1 text-xs font-black text-emerald-600">
                                      <CheckCheck className="size-4" /> Confermato
                                    </span>
                                  ) : (
                                    <button type="button" onClick={() => acknowledgeVolunteerMessage(m.id)}
                                      className="inline-flex min-h-10 items-center gap-2 border-2 border-[#b85668] bg-[#b85668] px-3 text-xs font-black uppercase text-white">
                                      <Check className="size-4" /> Confermo di aver letto
                                    </button>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          )) : <p className={`text-sm ${muted}`}>Nessun messaggio per te al momento.</p>}
                        </div>
                      </div>
                    ) : unreadVolunteerMessageCount ? (
                      <button
                        type="button"
                        onClick={openVolunteerMessages}
                        className="mt-3 flex w-full items-center justify-between border-2 border-[#b85668] px-3 py-2 text-left"
                      >
                        <span>
                          <span className="block text-[10px] font-black uppercase text-[#c76476]">Nuovi messaggi</span>
                          <span className="text-sm font-bold">{unreadVolunteerMessageCount} da leggere</span>
                        </span>
                        <MessageSquare className="size-5" />
                      </button>
                    ) : null}

                    {volunteerReplyOpen ? (
                      <div className={`mt-3 border-2 p-4 ${panel}`}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[10px] font-black uppercase text-[#c76476]">Scrivi all'organizzazione</p>
                          <button type="button" onClick={() => setVolunteerReplyOpen(false)} className="grid size-9 place-items-center border border-[#b85668]" aria-label="Chiudi">
                            <X className="size-4" />
                          </button>
                        </div>
                        <textarea
                          value={volunteerReply}
                          onChange={(e) => setVolunteerReply(e.target.value)}
                          placeholder="Es. Non riesco ad arrivare per il turno delle 9…"
                          className={`mt-2 min-h-24 w-full border-2 p-3 text-sm ${input}`}
                        />
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={sendVolunteerReply}
                            disabled={volunteerReplyBusy || !volunteerReply.trim()}
                            className="inline-flex min-h-10 items-center gap-2 border-2 border-[#b85668] bg-[#b85668] px-3 text-xs font-black uppercase text-white disabled:opacity-50"
                          >
                            <Send className="size-4" />
                            {volunteerReplyBusy ? "Invio…" : "Invia"}
                          </button>
                          {volunteerReplyFeedback ? <span className={`text-xs font-bold ${volunteerReplyFeedback.includes("inviato") ? "text-emerald-600" : "text-[#c76476]"}`}>{volunteerReplyFeedback}</span> : null}
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : null}

                <div id="volunteer-turns" className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className={`border-2 p-4 ${panel}`}>
                    <p className="text-[10px] font-black uppercase text-[#c76476]">Prossimo turno</p>
                    {personalNextTeam ? (
                      <>
                        <strong className="mt-2 block text-lg uppercase">{personalNextTeam.activity}</strong>
                        <div className="mt-3 grid gap-2 text-sm">
                          <span className="flex items-center gap-2 border px-2 py-2"><CalendarDays className="size-4" />{personalNextTeam.day}</span>
                          <span className="flex items-center gap-2 border px-2 py-2"><Clock3 className="size-4" />{personalNextTeam.slot}</span>
                          <span className="flex items-center gap-2 border px-2 py-2"><MapPin className="size-4" />{personalNextTeam.place}</span>
                        </div>
                      </>
                    ) : <p className={`mt-3 text-sm ${muted}`}>Nessun turno assegnato al momento.</p>}
                  </div>

                  <div className={`border-2 p-4 ${panel}`}>
                    <button
                      type="button"
                      onClick={() => setVolunteerAllTurnsOpen((current) => !current)}
                      className="flex w-full items-center justify-between gap-3 text-left"
                    >
                      <span>
                        <span className="block text-[10px] font-black uppercase text-[#c76476]">Tutti i miei turni</span>
                        <span className={`mt-1 block text-xs ${muted}`}>{personalTeams.length ? `${personalTeams.length} assegnazioni` : "Nessuna assegnazione"}</span>
                      </span>
                      <span className="text-lg font-black">{volunteerAllTurnsOpen ? "−" : "+"}</span>
                    </button>
                    {volunteerAllTurnsOpen ? (
                      <div className="mt-3 space-y-2">
                        {personalTeams.length ? personalTeams.map((team) => (
                          <div key={team.id} className={`border p-3 ${panelSoft}`}>
                            <strong className="block text-sm uppercase">{team.day} · {team.slot}</strong>
                            <span className="mt-1 block text-xs">{team.activity} · {team.place}</span>
                          </div>
                        )) : <p className={`text-xs ${muted}`}>Nessuna assegnazione.</p>}
                      </div>
                    ) : null}
                  </div>
                </div>

                {personalNextTeam ? (
                  <div className={`mt-3 border-2 p-4 ${panel}`}>
                    <p className="text-[10px] font-black uppercase text-[#c76476]">Con chi sono</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {activeVolunteers.filter((v) => personalNextTeam.memberIds.includes(v.id)).map((v) => (
                        <span key={v.id} className="border px-2 py-1 text-xs font-bold">{v.name}{v.group ? ` · ${v.group}` : ""}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className={`mt-4 border-2 p-4 text-sm ${panelSoft}`}>
                Cerca il tuo nome per vedere soltanto turni, luogo, attività e squadra.
              </div>
            )}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen transition-colors ${shell}`}>
      <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-4 md:px-5 lg:px-8 xl:px-10 lg:py-7">
        <header className="mb-4 border-b-2 border-[#b85668] pb-3 sm:mb-5 lg:mb-6 lg:pb-5">
          <div className="flex flex-col gap-4">
            <div className="flex min-w-0 flex-wrap items-center gap-4 sm:flex-nowrap sm:gap-6">
              <div className="flex h-24 w-48 shrink-0 items-center justify-start sm:h-28 sm:w-64 lg:h-36 lg:w-80">
                <img
                  src={costacciaroLogoDataUri}
                  style={{ filter: "brightness(0) saturate(100%) invert(26%) sepia(86%) saturate(3386%) hue-rotate(330deg) brightness(98%) contrast(93%)" }}
                  alt="Costacciaro 2026"
                  className="h-auto w-full object-contain object-left"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-black uppercase leading-tight tracking-tight sm:text-xl lg:text-2xl xl:text-3xl">
                  Pannello organizzatori
                </h1>
                <p className={`mt-1 max-w-2xl text-[10px] leading-snug sm:text-xs lg:text-sm ${muted}`}>
                  Gestione volontari · Costacciaro 2026
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-[#b85668]/40 pt-3">
            <div className="flex flex-wrap items-center gap-2 sm:mr-4">
              <button type="button" onClick={() => switchDataMode("test")}
                className={`min-h-11 border-2 px-3 text-[10px] font-black uppercase sm:text-xs ${dataMode === "test" ? "border-amber-500 bg-amber-500 text-black" : "border-[#b85668]"}`}>
                Prova
              </button>
              <button type="button" onClick={() => switchDataMode("live")}
                className={`min-h-11 border-2 px-3 text-[10px] font-black uppercase sm:text-xs ${dataMode === "live" ? "border-emerald-600 bg-emerald-600 text-white" : "border-[#b85668]"}`}>
                Operativo
              </button>
              {dataMode === "test" ? (
                <button type="button" onClick={resetTestEnvironment}
                  className="min-h-11 border-2 border-amber-500 px-3 text-[10px] font-black uppercase sm:text-xs">
                  Ripristina prova
                </button>
              ) : null}
            </div>

              <a
                href="/volontario"
                aria-label="Il mio Costacciaro: mostra la vista volontario"
                className="flex min-h-14 flex-col items-center justify-center gap-0.5 border-2 border-[#b85668] px-2 text-center font-black uppercase sm:min-h-11 sm:flex-row sm:gap-2 sm:px-3"
              >
                <UserRound className="size-4" />
                <span className="text-[10px] sm:text-xs">Il mio Costacciaro</span>
                <span className={`text-[8px] font-medium normal-case sm:hidden ${muted}`}>vista volontario</span>
              </a>
              <button type="button"
                onClick={() => { const next = !directoryOpen; setDirectoryOpen(next); if (next) { setPersonalOpen(false); setCatalogOpen(false); setMessagesOpen(false); } }}
                aria-label="Rubrica: cerca contatti di volontari"
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 border-2 border-[#b85668] px-2 text-center font-black uppercase sm:min-h-11 sm:flex-row sm:gap-2 sm:px-3 ${directoryOpen ? "bg-[#b85668] text-white" : ""}`}>
                <Users className="size-4" />
                <span className="text-[10px] sm:text-xs">Contatti</span>
                <span className={`text-[8px] font-medium normal-case sm:hidden ${directoryOpen ? "text-white/80" : muted}`}>telefono · email</span>
              </button>
              <button type="button"
                onClick={() => {
                  const next = !messagesOpen;
                  setMessagesOpen(next);
                  if (next) { setDirectoryOpen(false); setCatalogOpen(false); setPersonalOpen(false); }
                }}
                aria-label={unreadVolunteerInboxCount ? `Messaggi interni: ${unreadVolunteerInboxCount} nuovi` : "Messaggi interni ai volontari"}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 border-2 border-[#b85668] px-2 text-center font-black uppercase sm:min-h-11 sm:flex-row sm:gap-2 sm:px-3 ${messagesOpen ? "bg-[#b85668] text-white" : ""}`}>
                <MessageSquare className="size-4" />
                <span className="text-[10px] sm:text-xs">Messaggi</span>
                {unreadVolunteerInboxCount ? (
                  <span className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] font-black ${messagesOpen ? "bg-white text-[#b85668]" : "bg-[#b85668] text-white"}`}>
                    {unreadVolunteerInboxCount}
                  </span>
                ) : null}
                <span className={`text-[8px] font-medium normal-case sm:hidden ${messagesOpen ? "text-white/80" : muted}`}>
                  {unreadVolunteerInboxCount ? `${unreadVolunteerInboxCount} nuovi` : "singoli · squadre"}
                </span>
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
          <section id="organizer-activities" className={`mb-3 border-2 p-3 lg:p-5 ${panel}`}>
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
          <section id="organizer-personal" className={`mb-3 border-2 p-3 lg:p-5 ${panel}`}>
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
          <section id="organizer-contacts" className={`mb-3 border-2 p-3 lg:p-5 ${panel}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase text-[#c76476]">Contatti volontari</p>
                <h2 className="text-lg font-black uppercase">Telefono, WhatsApp ed email</h2>
              </div>
              <button
                type="button"
                onClick={() => setDirectoryOpen(false)}
                className="grid size-10 shrink-0 place-items-center border-2 border-[#b85668] hover:bg-[#b85668] hover:text-white"
                aria-label="Chiudi rubrica"
                title="Chiudi rubrica"
              >
                <X className="size-5" />
              </button>
            </div>
            <label className="mt-3 block">
              <span className={`mb-1 block text-[10px] font-black uppercase ${mutedStrong}`}>Cerca nella rubrica</span>
              <div className={`flex min-h-10 items-center gap-2 border px-3 ${input}`}>
                <Search className="size-4 shrink-0 opacity-60" />
                <input value={directoryQuery} onChange={(e) => setDirectoryQuery(e.target.value)}
                  list="dashboard-directory-names"
                  autoComplete="off"
                  placeholder="Nome, cognome, gruppo, telefono o email"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:opacity-45" />
                <datalist id="dashboard-directory-names">
                  {directoryVolunteers.filter((v) => v.name).map((v) => <option key={v.id} value={v.name} />)}
                </datalist>
                {directoryQuery ? <button type="button" onClick={() => setDirectoryQuery("")} aria-label="Cancella ricerca" className="px-2 text-xs font-bold">✕</button> : null}
              </div>
            </label>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {filteredDirectoryVolunteers.map((v) => (
                <div
                  key={v.id}
                  className={`w-full border p-3 text-left ${isLight ? "border-ink/15" : "border-paper/20"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedVolunteerIds((current) => current.includes(v.id) ? current.filter((id) => id !== v.id) : [...current, v.id])}
                      className="min-w-0 flex-1 text-left"
                    >
                      <strong className="text-sm">{v.name}</strong>
                      <span className={`ml-1 text-xs ${muted}`}>· {v.group}</span>
                    </button>
                    {expandedVolunteerIds.includes(v.id) ? (
                      <button
                        type="button"
                        onClick={() => setExpandedVolunteerIds((current) => current.filter((id) => id !== v.id))}
                        className="grid size-8 shrink-0 place-items-center border border-[#b85668] hover:bg-[#b85668] hover:text-white"
                        aria-label={`Chiudi scheda ${v.name}`}
                        title="Chiudi scheda"
                      >
                        <X className="size-4" />
                      </button>
                    ) : null}
                  </div>
                  {expandedVolunteerIds.includes(v.id) ? (
                    <span className="mt-2 block text-xs" onClick={(e) => e.stopPropagation()}>
                      <span className="flex flex-wrap gap-2">
                        <a
                          href={v.phone ? `tel:${v.phone.replace(/\s+/g, "")}` : undefined}
                          className={`inline-flex min-h-9 items-center gap-1 border px-2 font-bold ${v.phone ? "border-[#b85668] hover:bg-[#b85668] hover:text-white" : muted}`}
                        >
                          <Phone className="size-3.5" /> Chiama
                        </a>
                        <a
                          href={v.phone ? `https://wa.me/${v.phone.replace(/\D/g, "").replace(/^00/, "")}?text=${encodeURIComponent(`Ciao ${v.name.split(" ")[0] || ""}, ti contatto per Costacciaro 2026.`)}` : undefined}
                          target="_blank"
                          rel="noreferrer"
                          className={`inline-flex min-h-9 items-center gap-1 border px-2 font-bold ${v.phone ? "border-[#b85668] hover:bg-[#b85668] hover:text-white" : muted}`}
                        >
                          WhatsApp
                        </a>
                        <a
                          href={v.email ? `mailto:${v.email}?subject=${encodeURIComponent("Costacciaro 2026")}` : undefined}
                          className={`inline-flex min-h-9 items-center gap-1 border px-2 font-bold ${v.email ? "border-[#b85668] hover:bg-[#b85668] hover:text-white" : muted}`}
                        >
                          <Mail className="size-3.5" /> Email
                        </a>
                      </span>
                      <span className={`mt-2 block text-[10px] ${muted}`}>
                        {v.phone || "Telefono non disponibile"}{v.email ? ` · ${v.email}` : ""}
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
                </div>
              ))}
            </div>
            {dataMode === "live" && liveLoading ? <p className={`mt-3 text-sm ${muted}`}>Caricamento rubrica operativa…</p> : null}
            {dataMode === "live" && !liveLoading && liveError ? <p role="alert" className="mt-3 text-sm text-[#c76476]">Rubrica non disponibile: {liveError}</p> : null}
            {!liveLoading && !liveError && directoryVolunteers.length === 0 ? <p role="status" className={`mt-3 text-sm ${muted}`}>Nessun volontario caricato nella modalità {dataMode === "live" ? "OPERATIVO" : "PROVA"}. La ricerca non può mostrare nomi finché l'elenco non è disponibile.</p> : null}
            {!liveLoading && !liveError && directoryVolunteers.length > 0 && filteredDirectoryVolunteers.length === 0 ? <p className={`mt-3 text-sm ${muted}`}>Nessun nominativo corrispondente. Verifica la scrittura o prova con una parte del cognome.</p> : null}

          </section>
        ) : null}

        {messagesOpen ? (
          <section id="organizer-messages" className={`mb-3 border-2 p-3 lg:p-5 ${panel}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase text-[#c76476]">Comunicazioni interne</p>
                <h2 className="text-lg font-black uppercase">Messaggi ai volontari</h2>
                <p className={`mt-1 text-xs ${muted}`}>Aggiornamento automatico ogni 5 secondi.</p>
              </div>
              <button type="button" onClick={() => setMessagesOpen(false)}
                className="grid size-10 shrink-0 place-items-center border-2 border-[#b85668] hover:bg-[#b85668] hover:text-white"
                aria-label="Chiudi messaggi" title="Chiudi messaggi">
                <X className="size-5" />
              </button>
            </div>

            {dataMode !== "live" ? (
              <div className="mt-3 border-2 border-amber-500 p-3 text-sm font-bold">
                Passa a <strong>Operativo</strong> per inviare messaggi reali.
              </div>
            ) : (
              <>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setMessagePane("compose")}
                    className={`min-h-10 border px-2 text-[10px] font-black uppercase ${messagePane === "compose" ? "bg-[#b85668] text-white border-[#b85668]" : ""}`}>
                    Nuovo
                  </button>
                  <button type="button" onClick={() => setMessagePane("sent")}
                    className={`min-h-10 border px-2 text-[10px] font-black uppercase ${messagePane === "sent" ? "bg-[#b85668] text-white border-[#b85668]" : ""}`}>
                    Inviati
                  </button>
                  <button type="button" onClick={() => setMessagePane("inbox")}
                    className={`relative min-h-10 border px-2 text-[10px] font-black uppercase ${messagePane === "inbox" ? "bg-[#b85668] text-white border-[#b85668]" : ""}`}>
                    Ricevuti
                    {unreadVolunteerInboxCount ? (
                      <span className={`ml-1 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] ${messagePane === "inbox" ? "bg-white text-[#b85668]" : "bg-[#b85668] text-white"}`}>
                        {unreadVolunteerInboxCount}
                      </span>
                    ) : null}
                  </button>
                </div>

                {messagePane === "compose" ? (
                  <div className={`mt-3 border-2 p-3 ${panelSoft}`}>
                    <p className="text-[10px] font-black uppercase text-[#c76476]">Nuovo messaggio</p>
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      <div className="grid gap-3">
                        <label className="grid gap-1 text-xs font-bold">
                          Destinatari
                          <select value={messageType} onChange={(e) => setMessageType(e.target.value as "notice" | "direct" | "team")}
                            className={`min-h-11 border-2 px-3 ${input}`}>
                            <option value="notice">Tutti i volontari</option>
                            <option value="direct">Singolo volontario</option>
                            <option value="team">Squadra di lavoro</option>
                          </select>
                        </label>

                        {messageType === "direct" ? (
                          <div className="grid gap-1 text-xs font-bold">
                            <span>Volontario</span>
                            <div className="relative">
                              <div className={`flex min-h-11 items-center gap-2 border-2 px-3 ${input}`}>
                                <Search className="size-4 shrink-0 opacity-60" />
                                <input
                                  value={messageTargetQuery}
                                  onChange={(e) => {
                                    setMessageTargetQuery(e.target.value);
                                    setMessageTargetVolunteerId("");
                                  }}
                                  placeholder="Scrivi nome o cognome…"
                                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:opacity-45"
                                />
                                {messageTargetQuery ? (
                                  <button type="button" onClick={() => { setMessageTargetQuery(""); setMessageTargetVolunteerId(""); }}
                                    className="text-[10px] font-black uppercase">Pulisci</button>
                                ) : null}
                              </div>
                              {!messageTargetVolunteerId && messageTargetQuery.trim() ? (
                                <div className={`absolute left-0 right-0 top-full z-40 mt-1 max-h-64 overflow-auto border-2 border-[#b85668] p-1 shadow-xl ${isLight ? "bg-white" : "bg-ink"}`}>
                                  {messageVolunteerMatches.length ? messageVolunteerMatches.map((v) => (
                                    <button
                                      key={v.id}
                                      type="button"
                                      onClick={() => {
                                        setMessageTargetVolunteerId(v.id);
                                        setMessageTargetQuery(v.name);
                                      }}
                                      className={`block w-full border-b px-3 py-2 text-left last:border-b-0 ${isLight ? "border-ink/10 hover:bg-black/5" : "border-paper/10 hover:bg-white/5"}`}
                                    >
                                      <span className="block text-sm font-black">{v.name}</span>
                                      <span className={`text-[10px] ${muted}`}>{v.group || "Gruppo non indicato"}</span>
                                    </button>
                                  )) : <div className={`px-3 py-2 text-xs ${muted}`}>Nessun volontario trovato.</div>}
                                </div>
                              ) : null}
                            </div>
                            {messageTargetVolunteerId ? <span className="text-[10px] font-bold text-emerald-600">Destinatario selezionato</span> : null}
                          </div>
                        ) : null}

                        {messageType === "team" ? (
                          <label className="grid gap-1 text-xs font-bold">
                            Squadra
                            <select value={messageTargetTeamId} onChange={(e) => setMessageTargetTeamId(e.target.value)}
                              className={`min-h-11 border-2 px-3 ${input}`}>
                              <option value="">Seleziona…</option>
                              {teams.filter((t) => t.id !== "__draft__").map((t) => (
                                <option key={t.id} value={t.id}>{t.name} · {t.day} · {t.slot}</option>
                              ))}
                            </select>
                          </label>
                        ) : null}

                        <div>
                          <p className="text-[10px] font-black uppercase text-[#c76476]">Messaggi rapidi</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button type="button" onClick={() => applyMessagePreset("shift_change")} className="border px-2 py-1.5 text-[10px] font-black uppercase">Cambio turno</button>
                            <button type="button" onClick={() => applyMessagePreset("assignment")} className="border px-2 py-1.5 text-[10px] font-black uppercase">Nuovo turno</button>
                            <button type="button" onClick={() => applyMessagePreset("confirm")} className="border px-2 py-1.5 text-[10px] font-black uppercase">Conferma</button>
                            <button type="button" onClick={() => applyMessagePreset("reminder")} className="border px-2 py-1.5 text-[10px] font-black uppercase">Promemoria</button>
                            <button type="button" onClick={() => applyMessagePreset("important")} className="border px-2 py-1.5 text-[10px] font-black uppercase">Importante</button>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        <label className="grid gap-1 text-xs font-bold">
                          Titolo
                          <input value={messageTitle} onChange={(e) => setMessageTitle(e.target.value)}
                            className={`min-h-11 border-2 px-3 ${input}`} placeholder="Es. Cambio turno" />
                        </label>

                        <label className="grid gap-1 text-xs font-bold">
                          Messaggio
                          <textarea value={messageBody} onChange={(e) => setMessageBody(e.target.value)}
                            className={`min-h-28 border-2 p-3 ${input}`} placeholder="Scrivi il messaggio…" />
                        </label>

                        <label className="flex items-center gap-2 text-xs font-bold">
                          <input type="checkbox" checked={messageUrgent} onChange={(e) => setMessageUrgent(e.target.checked)} />
                          Richiedi conferma esplicita
                        </label>

                        <button type="button" onClick={submitDashboardMessage} disabled={messageBusy}
                          className="flex min-h-11 items-center justify-center gap-2 border-2 border-[#b85668] bg-[#b85668] px-4 text-xs font-black uppercase text-white disabled:opacity-50">
                          <Send className="size-4" />
                          {messageBusy ? "Invio…" : "Invia messaggio"}
                        </button>
                        {messageError ? <p className="text-xs font-bold text-[#c76476]">{messageError}</p> : null}
                      </div>
                    </div>
                  </div>
                ) : null}

                {messagePane === "sent" ? (
                  <div className={`mt-3 border-2 p-3 ${panelSoft}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-black uppercase text-[#c76476]">Messaggi inviati</p>
                      <button type="button" onClick={() => setSentArchiveOpen((v) => !v)} className="border px-2 py-1 text-[9px] font-black uppercase">
                        {sentArchiveOpen ? "Attivi" : "Archivio"}
                      </button>
                    </div>
                    <div className="mt-3 max-h-[430px] space-y-2 overflow-auto">
                      {(sentArchiveOpen ? archivedDashboardMessages : dashboardMessages).length ? (sentArchiveOpen ? archivedDashboardMessages : dashboardMessages).map((m) => (
                        <div key={m.id} className={`border-2 p-3 ${panel}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <strong className="block text-sm">{m.title}</strong>
                              <span className={`text-[10px] ${muted}`}>{m.targetLabel}</span>
                            </div>
                            {m.urgent && m.acknowledgedCount >= m.recipientCount && m.recipientCount > 0 ? (
                              <span className="inline-flex items-center gap-1 border border-emerald-600 px-2 py-1 text-[9px] font-black uppercase text-emerald-600">
                                <CheckCheck className="size-3.5" /> Confermato
                              </span>
                            ) : m.urgent ? (
                              <span className="border border-[#b85668] px-2 py-1 text-[9px] font-black uppercase text-[#c76476]">Attesa conferma</span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-xs">{m.body}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold">
                            <span className="border px-2 py-1">Destinatari {m.recipientCount}</span>
                            <span className={`border px-2 py-1 ${m.readCount >= m.recipientCount && m.recipientCount > 0 ? "border-emerald-600 text-emerald-600" : ""}`}>Letti {m.readCount}/{m.recipientCount}</span>
                            {m.urgent ? <span className={`border px-2 py-1 ${m.acknowledgedCount >= m.recipientCount && m.recipientCount > 0 ? "border-emerald-600 text-emerald-600" : ""}`}>Confermati {m.acknowledgedCount}/{m.recipientCount}</span> : null}
                            <button type="button" onClick={() => setSentMessageArchived(m.id, !sentArchiveOpen)} className="border px-2 py-1">
                              {sentArchiveOpen ? "Ripristina" : "Archivia"}
                            </button>
                          </div>
                        </div>
                      )) : <p className={`text-xs ${muted}`}>Nessun messaggio inviato.</p>}
                    </div>
                  </div>
                ) : null}

                {messagePane === "inbox" ? (
                  <div className={`mt-3 border-2 p-3 ${panelSoft}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-black uppercase text-[#c76476]">Messaggi dai volontari</p>
                      <button type="button" onClick={() => setInboxArchiveOpen((v) => !v)} className="border px-2 py-1 text-[9px] font-black uppercase">
                        {inboxArchiveOpen ? "Attivi" : "Archivio"}
                      </button>
                    </div>
                    <div className="mt-2 max-h-[430px] space-y-2 overflow-auto">
                      {(inboxArchiveOpen ? archivedVolunteerInbox : volunteerInbox).length ? (inboxArchiveOpen ? archivedVolunteerInbox : volunteerInbox).map((m) => (
                        <div key={m.id} className={`border-2 p-3 ${m.readAt ? panel : "border-[#b85668]"}`}>
                          <div className="flex items-start justify-between gap-2">
                            <strong className="text-sm">{m.volunteerName}</strong>
                            <span className={`text-[9px] font-black uppercase ${m.readAt ? "text-emerald-600" : "text-[#c76476]"}`}>{m.readAt ? "Letto" : "Nuovo"}</span>
                          </div>
                          <p className="mt-2 text-xs">{m.body}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {!m.readAt && !inboxArchiveOpen ? (
                              <button type="button" onClick={() => markInboxRead(m.id)}
                                className="border px-2 py-1 text-[10px] font-black uppercase">
                                Segna letto
                              </button>
                            ) : null}
                            <button type="button" onClick={() => setInboxMessageArchived(m.id, !inboxArchiveOpen)}
                              className="border px-2 py-1 text-[10px] font-black uppercase">
                              {inboxArchiveOpen ? "Ripristina" : "Archivia"}
                            </button>
                          </div>
                        </div>
                      )) : <p className={`text-xs ${muted}`}>Nessun messaggio ricevuto.</p>}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </section>
        ) : null}

        <section className={`mb-3 flex flex-wrap items-center justify-between gap-2 border-2 px-3 py-2 text-xs font-bold ${dataMode === "test" ? "border-amber-500 bg-amber-500/10" : "border-emerald-600 bg-emerald-600/10"}`}>
          <span>{dataMode === "test" ? `PROVA · ${activeVolunteers.length} volontari` : `OPERATIVO · ${liveLoading ? "caricamento…" : `${liveVolunteers.length} volontari`}`}</span>
          {dataMode === "live" && liveSyncLabel ? <span className={liveError ? "text-[#c76476]" : mutedStrong}>{liveError || liveSyncLabel}</span> : null}
        </section>

        {guidedMode ? (
          <section className={`mb-3 border-2 border-amber-400 p-3 ${panel}`} aria-label="Scegli cosa fare">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CircleHelp className="size-6 text-amber-400" />
                <div>
                  <strong className="text-base font-black uppercase">Cosa vuoi fare?</strong>
                  <p className={`text-xs ${muted}`}>Scegli un'operazione: ti porto direttamente ai comandi pertinenti.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" aria-expanded={guideMenuOpen} onClick={() => setGuideMenuOpen(v => !v)} className="min-h-11 border-2 border-amber-400 bg-amber-400 px-4 text-sm font-black text-black">
                  {guideMenuOpen ? "Chiudi le opzioni" : "Scegli operazione →"}
                </button>
                <button type="button" onClick={() => setGuidedMode(false)} className="min-h-11 border px-2 text-xs font-bold" aria-label="Nascondi guida">Nascondi</button>
              </div>
            </div>
            {contextGuideStep !== null && guideChoice !== "overview" && guidedAssignmentStep === null && ["contacts", "messages", "activities", "inbox", "sent", "personal", "preferences", "sharing"].includes(guideChoice) ? contextGuide() : null}
            {guideMenuOpen ? (
              <div className="mt-3 border-t border-amber-400/50 pt-3">
                <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Categorie operazioni">
                  {([["turni","Turni e priorità"],["persone","Volontari"],["messaggi","Messaggi"],["altro","Altro"]] as const).map(([id,label]) => (
                    <button type="button" key={id} aria-pressed={guideCategory === id} onClick={() => setGuideCategory(id)} className={`min-h-11 border px-2 text-xs font-bold ${guideCategory === id ? "border-amber-400 bg-amber-400 text-black" : panelSoft}`}>{label}</button>
                  ))}
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {guideCategory === "persone" ? <button type="button" onClick={startAssignmentGuide} className="min-h-16 border-2 border-amber-400 bg-amber-400/10 p-3 text-left">
                  <strong className="block text-sm">Assegna volontari →</strong>
                  <span className={`mt-1 block text-xs ${muted}`}>Percorso completo guidato, fino alla verifica della squadra</span>
                </button> : null}
                {([
                  ["staffing","Configura un turno","Apri la modifica di fabbisogno e turno"],
                  ["priority","Risolvi posti scoperti","Apri le priorità da gestire"],
                  ["people","Gestisci squadre","Apri la selezione e le assegnazioni"],
                  ["assign","Proponi assegnazioni","Controlla le proposte prima di confermarle"],
                  ["regia","Regia operativa","Controlla criticità e turni da presidiare"],
                  ["myturns","Controlla turni di un volontario","Cerca una persona e verifica le assegnazioni"],
                  ["contacts","Trova un contatto","Apri la ricerca dei volontari"],
                  ["messages","Invia un messaggio","Apri la composizione di un messaggio"],
                  ["inbox","Leggi messaggi ricevuti","Consulta le risposte e le comunicazioni da leggere"],
                  ["sent","Controlla messaggi inviati","Visualizza gli invii precedenti"],
                  ["personal","Visualizza i miei turni","Apri la vista personale del volontario"],
                  ["preferences","Preferenze e modalità dati","Controlla le impostazioni senza cambiare modalità automaticamente"],
                  ["sharing","Condividi informazioni","Controlla cosa e con chi condividere prima dell’invio"],
                  ["activities","Gestisci attività","Apri le attività e i sottogruppi"],
                  ["overview","Torna alla panoramica","Mostra il riepilogo principale"]
                ] as const).filter(([id]) => (
                  guideCategory === "turni" ? ["staffing","priority","regia","activities"].includes(id) :
                  guideCategory === "persone" ? ["people","assign","myturns","contacts","personal"].includes(id) :
                  guideCategory === "messaggi" ? ["messages","inbox","sent","sharing"].includes(id) :
                  ["preferences","overview"].includes(id)
                )).map(([id,label,description]) => (
                  <button key={id} type="button" onClick={() => guideTo(id)} className={`min-h-16 border-2 p-3 text-left ${isLight ? "border-ink/20 hover:border-amber-500" : "border-paper/20 hover:border-amber-400"}`}>
                    <strong className="block text-sm">{label} →</strong>
                    <span className={`mt-1 block text-xs ${muted}`}>{description}</span>
                  </button>
                ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : (
          <button type="button" onClick={() => { setGuidedMode(true); setGuideMenuOpen(true); }} className="mb-3 min-h-11 border-2 border-amber-400 px-4 text-sm font-black">Cosa vuoi fare? · Apri guida</button>
        )}
        <nav className={`sticky top-0 z-30 mb-3 border-2 border-[#b85668] p-1 shadow-lg ${isLight ? "bg-paper/95" : "bg-ink/95"} backdrop-blur`}>
          <div className="flex gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={goToDashboardTop}
              className={`min-h-10 shrink-0 border px-2 text-[10px] font-black uppercase ${panelSoft}`}
              aria-label="Torna all'inizio della dashboard"
              title="Inizio dashboard"
            >
              ↑
            </button>
            <button type="button" onClick={goToDashboardTop} className={`min-h-10 min-w-[100px] shrink-0 border px-2 text-[10px] font-black uppercase sm:text-xs ${activeWorkspace === null ? "bg-[#b85668] text-white border-[#b85668]" : panelSoft}`}>Panoramica</button>
            <button type="button" onClick={() => toggleDashboardWorkspace("places-workspace")} className={`min-h-10 min-w-[120px] flex-1 border px-2 text-[10px] font-black uppercase sm:text-xs ${activeWorkspace === "places-workspace" ? "bg-[#b85668] text-white border-[#b85668]" : panelSoft}`}>Sale e presidi</button>
            <button type="button" onClick={() => toggleDashboardWorkspace("priorities-workspace")} className={`min-h-10 min-w-[92px] flex-1 border px-2 text-[10px] font-black uppercase sm:text-xs ${activeWorkspace === "priorities-workspace" ? "bg-[#b85668] text-white border-[#b85668]" : panelSoft}`}>Priorità</button>
            <button type="button" onClick={() => toggleDashboardWorkspace("coverage-workspace")} className={`min-h-10 min-w-[108px] flex-1 border px-2 text-[10px] font-black uppercase sm:text-xs ${activeWorkspace === "coverage-workspace" ? "bg-[#b85668] text-white border-[#b85668]" : panelSoft}`}>Regia turno</button>
            <button type="button" onClick={() => toggleDashboardWorkspace("turno-workspace")} className={`min-h-10 min-w-[125px] flex-1 border px-2 text-[10px] font-black uppercase sm:text-xs ${activeWorkspace === "turno-workspace" ? "bg-[#b85668] text-white border-[#b85668]" : panelSoft}`}>Turno selezionato</button>
            <button type="button" onClick={() => toggleDashboardWorkspace("people-workspace")} className={`min-h-10 min-w-[88px] flex-1 border px-2 text-[10px] font-black uppercase sm:text-xs ${activeWorkspace === "people-workspace" ? "bg-[#b85668] text-white border-[#b85668]" : panelSoft}`}>Persone</button>
          </div>
        </nav>

        <section id="places-workspace" className={`mb-3 max-h-[66vh] overflow-y-auto scroll-mt-4 border-2 p-3 lg:p-5 ${panel} ${activeWorkspace !== "places-workspace" ? "hidden" : ""}`}>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-black uppercase text-[#c76476] sm:text-xs">Sale e presidi</p>
              <h2 className="text-base font-black uppercase lg:text-lg">Sale e presidi</h2>
            </div>
            <div className={`text-[10px] font-bold sm:text-xs ${mutedStrong}`}>{day} · {slot}</div>
          </div>
          {([
            ["sala", "Sale e spazi evento"],
            ["presidio", "Presidi e servizi"],
          ] as const).map(([kind, label]) => (
            <div key={kind} className="mt-4">
              <div className={`mb-2 text-[10px] font-black uppercase tracking-wide ${mutedStrong}`}>{label}</div>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {operationalPoints.filter((point) => point.kind === kind).map((point) => {
                  const team = teams.find((item) => item.day === day && item.slot === slot && item.activity === point.activity);
                  const assigned = team ? team.memberIds.filter((id) => activeVolunteerIds.has(id)).length : 0;
                  const targetDefined = Boolean(team && team.target > 0);
                  return (
                    <button
                      key={point.id}
                      type="button"
                      onClick={() => openOperationalPoint(point)}
                      className={`border-2 p-3 text-left transition hover:border-[#b85668] ${panelSoft}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <MapPin className="size-4 shrink-0 text-[#c76476]" />
                            <strong className="text-sm uppercase lg:text-base">{point.name}</strong>
                          </div>
                          <p className={`mt-2 text-[10px] leading-snug sm:text-xs ${muted}`}>{point.note}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-lg font-black">{targetDefined ? `${assigned}/${team?.target}` : `${assigned}/?`}</div>
                          <div className={`text-[9px] ${muted}`}>{targetDefined ? "assegnati / necessari" : "persone necessarie: da definire"}</div>
                        </div>
                      </div>
                      <div className={`mt-2 border-t pt-2 text-[10px] font-bold ${mutedStrong}`}>
                        {team ? "Apri gestione della fascia" : "Apri turno"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <section className={`grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:gap-3 ${activeWorkspace !== null ? "hidden" : ""}`}>
          <Kpi label="Volontari" value={String(activeVolunteers.length)} light={isLight} />
          <Kpi label="Disponibili per questo turno" value={String(compatible.length)} light={isLight} />
          <Kpi label="In squadra" value={String(teamMembers.length)} light={isLight} />
          <Kpi label="Copertura" value={coverageLabel} light={isLight} onHelp={() => setHelpTopic("coverage")} />
        </section>

        <section id="priorities-workspace" className={`mt-3 scroll-mt-4 border-2 p-3 lg:mt-4 lg:p-4 ${attentionIssueCount ? "border-[#b85668] bg-[#b85668]/10" : isLight ? "border-emerald-600/50 bg-emerald-50" : "border-emerald-700/50 bg-emerald-950/20"} ${activeWorkspace !== "priorities-workspace" ? "hidden" : ""}`}>
          {guideChoice === "priority" ? contextGuide() : null}
          <div className="flex items-center gap-2">
            {attentionIssueCount ? <AlertTriangle className="size-5 text-[#c76476]" /> : <CheckCircle2 className="size-5 text-emerald-600" />}
            <div>
              <div className="flex items-center gap-1"><p className="text-[10px] font-black uppercase text-[#c76476]">Priorità operative</p><button type="button" onClick={() => setHelpTopic("priorities")} aria-label="Spiega priorità operative" className="rounded-full p-1"><CircleHelp className="size-4" /></button></div>
              <h2 className="text-base font-black uppercase lg:text-lg">{attentionIssueCount ? `Cosa richiede attenzione · ${attentionIssueCount}` : "Nessuna criticità operativa"}</h2>
            </div>
          </div>
          {attentionIssueCount ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <button type="button" onClick={() => {
                if (firstUnderCoveredTeam) {
                  setDay(firstUnderCoveredTeam.day);
                  setSlot(firstUnderCoveredTeam.slot);
                  setActivity(firstUnderCoveredTeam.activity);
                  setMobileTab("turno");
                  setFocusContext(`TURNI DA COPRIRE — aperto il primo turno incompleto: ${firstUnderCoveredTeam.day} · ${firstUnderCoveredTeam.slot} · ${firstUnderCoveredTeam.activity}. Mancano ${Math.max(0, firstUnderCoveredTeam.target - firstUnderCoveredTeam.memberIds.filter((id) => activeVolunteerIds.has(id)).length)} persone.`);
                  goToSection("turno-workspace", true, "priorities-workspace");
                }
              }} className={`min-h-14 border p-3 text-left ${panelSoft}`}>
                <strong className="block text-sm">{underCoveredTeams.length} turni da coprire</strong>
                <span className={`text-[10px] ${muted}`}>Tocca per aprire il primo turno incompleto</span>
              </button>
              <button type="button" onClick={() => { setPeopleFilterOpen(true); setMobileTab("persone"); setFocusContext(`DISPONIBILI NELLA FASCIA — ${availableUnassignedCount} volontari sono disponibili e non ancora assegnati il ${day} · ${slot}. Qui sotto vedi ${compatible.length} persone compatibili con ${activity}; alcune possono risultare già impegnate o assegnate in base alla squadra selezionata.`); goToSection("people-workspace", true, "priorities-workspace"); }} className={`min-h-14 border p-3 text-left ${panelSoft}`}>
                <strong className="block text-sm">{availableUnassignedCount} disponibili nella fascia</strong>
                <span className={`text-[10px] ${muted}`}>Non ancora assegnati · poi filtra i compatibili</span>
              </button>
              <button type="button" onClick={() => { setMobileTab("panoramica"); setFocusContext(`POSTI ANCORA SCOPERTI — ${uncoveredPlaces} posti da coprire il ${day}. Le celle evidenziate mostrano esattamente quali attività e fasce sono incomplete; clicca una cella per gestirla.`); goToSection("coverage-workspace", true, "priorities-workspace"); }} className={`min-h-14 border p-3 text-left ${panelSoft}`}>
                <strong className="block text-sm">{uncoveredPlaces} posti ancora scoperti</strong>
                <span className={`text-[10px] ${muted}`}>Rivedi il quadro complessivo</span>
              </button>
              <button type="button" onClick={() => { setMessagesOpen(true); setMessagePane("inbox"); requestAnimationFrame(goToDashboardTop); }} className={`min-h-14 border p-3 text-left ${panelSoft}`}>
                <strong className="block text-sm">{unreadVolunteerInboxCount} messaggi nuovi</strong>
                <span className={`text-[10px] ${muted}`}>Dai volontari</span>
              </button>
              <button type="button" onClick={() => { setMessagesOpen(true); setMessagePane("sent"); requestAnimationFrame(goToDashboardTop); }} className={`min-h-14 border p-3 text-left ${panelSoft}`}>
                <strong className="block text-sm">{pendingConfirmationsCount} conferme in attesa</strong>
                <span className={`text-[10px] ${muted}`}>Messaggi importanti</span>
              </button>
            </div>
          ) : null}
        </section>



        <section id="coverage-workspace" className={`mt-3 scroll-mt-4 lg:mt-4 ${mobileTab !== "panoramica" ? "hidden lg:block" : ""} ${activeWorkspace !== "coverage-workspace" ? "hidden" : ""}`}>
          {guideChoice === "regia" ? contextGuide() : null}
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
            <div id="guide-shift" className={`mt-3 grid gap-2 border-y py-3 sm:grid-cols-[1fr_1fr_auto] ${guidedAssignmentStep === 0 ? "outline outline-4 outline-amber-400 outline-offset-4" : ""} ${isLight ? "border-ink/10" : "border-paper/10"}`}>
              <Select label="Data" value={day} onChange={(value) => { setDay(value); setFocusContext(""); }} options={["28 ottobre", "29 ottobre", "30 ottobre", "31 ottobre", "1 novembre"]} icon={<CalendarDays className="size-3.5" />} inputClass={input} />
              <Select label="Fascia" value={slot} onChange={(value) => { setSlot(value); setFocusContext(""); }} options={["Mattina", "Pomeriggio", "Sera"]} inputClass={input} />
              <div className={`self-end pb-2 text-[10px] font-bold sm:text-xs ${muted}`}>Poi scegli l’attività qui sotto ↓</div>
            </div>

            {guideActions(0)}
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {currentShiftSummary.map((item) => {
                const targetDefined = item.target > 0;
                const pct = targetDefined ? Math.min(100, Math.round((item.assigned / item.target) * 100)) : 0;
                const complete = targetDefined && item.assigned >= item.target;
                return (
                  <button key={item.activity} type="button" onClick={() => { setActivity(item.activity); setSlot(item.slot); setMobileTab("turno"); setFocusContext(`${item.activity.toUpperCase()} — ${day} · ${item.slot}: ${complete ? "turno coperto" : `mancano ${item.target - item.assigned} persone`}. Qui puoi vedere i compatibili e gestire la squadra.`); goToSection("turno-workspace", true, "coverage-workspace"); }}
                    className="border-l-4 border-y border-r p-3 text-left transition-opacity hover:opacity-90"
                    style={activityTone(item.activity, isLight)}>
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-xs uppercase lg:text-sm">{item.activity}</strong>
                      <span className={`text-sm font-black ${complete ? "" : "text-[#c76476]"}`}>{targetDefined ? `${item.assigned}/${item.target}` : `${item.assigned}/?`}</span>
                    </div>
                    <div className={`mt-2 h-1.5 ${isLight ? "bg-ink/10" : "bg-paper/10"}`}><div className="h-full" style={{ width: `${pct}%`, backgroundColor: paletteFor(item.activity).accent }} /></div>
                    <div className={`mt-1 text-[10px] ${muted}`}>{item.slot} · {!targetDefined ? "Persone necessarie: da definire" : complete ? "Coperto" : `Mancano ${item.target-item.assigned}`}</div>
                  </button>
                );
              })}
            </div>
            <div className={`mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-[10px] sm:text-xs ${isLight ? "border-ink/10" : "border-paper/10"}`}>
              <strong>Da sistemare</strong>
              <span className="text-[#c76476]">{currentShiftSummary.filter((x) => x.target > 0 && x.assigned < x.target).length} turni sotto copertura nella fascia</span>
              <span>{availableUnassignedCount} disponibili non assegnati</span>
              <span>{uncoveredPlaces} posti ancora da coprire</span>
            </div>
          </div>
        </section>

        <section className={`mt-3 lg:mt-4 ${mobileTab !== "panoramica" ? "hidden lg:block" : ""} ${activeWorkspace !== "coverage-workspace" ? "hidden" : ""}`}>
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
                      const targetDefined = team ? team.target > 0 : false;
                      const short = team ? targetDefined && team.memberIds.filter((id) => activeVolunteerIds.has(id)).length < team.target : false;
                      return <button key={s} type="button" onClick={() => { setActivity(item); setSlot(s); setMobileTab("turno"); setFocusContext(`${item.toUpperCase()} — ${day} · ${s}: ${team ? `${team.memberIds.filter((id) => activeVolunteerIds.has(id)).length}/${team.target} assegnati` : "turno non ancora configurato"}. Sei nella gestione esatta di questa cella.`); goToSection("turno-workspace", true, "coverage-workspace"); }}
                        className={`border p-2 text-center font-black ${team ? "" : muted}`}
                        style={team ? activityTone(item, isLight) : undefined}>
                        <span className={`mb-0.5 block text-[8px] font-bold uppercase lg:hidden ${muted}`}>{s}</span>
                        {team ? <><span className={short ? "text-[#c76476]" : ""}>{targetDefined ? `${team.memberIds.filter((id) => activeVolunteerIds.has(id)).length}/${team.target}` : `${team.memberIds.filter((id) => activeVolunteerIds.has(id)).length}/?`}</span><span className={`block text-[9px] font-normal ${muted}`}>{!targetDefined ? "da definire" : short ? "da coprire" : "coperto"}</span></> : "—"}
                      </button>;
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {returnSection ? (
          <button
            type="button"
            onClick={returnToPreviousSection}
            className="fixed bottom-4 right-4 z-40 flex min-h-11 items-center gap-2 border-2 border-[#b85668] bg-ink px-4 text-xs font-black uppercase text-paper shadow-lg hover:bg-[#b85668] hover:text-white"
            aria-label={`Torna a ${returnSection.label}`}
            title={`Torna a ${returnSection.label}`}
          >
            <ArrowUp className="size-4" />
            <span className="hidden sm:inline">Torna a </span>{returnSection.label}
          </button>
        ) : null}

        <section id="turno-workspace" className={`mt-3 ${guidedAssignmentStep === 3 ? "outline outline-4 outline-amber-400 outline-offset-4" : ""} scroll-mt-4 border-2 p-3 lg:mt-4 lg:p-5 ${panel} ${mobileTab !== "turno" ? "hidden lg:block" : ""} ${activeWorkspace !== "turno-workspace" ? "hidden" : ""}`}>
          {guideChoice === "staffing" && contextGuideStep === 0 ? contextGuide() : null}

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
            <div id="guide-activity" className={`border-l-4 pl-2 ${guidedAssignmentStep === 1 ? "outline outline-4 outline-amber-400 outline-offset-4" : ""}`} style={{ borderColor: paletteFor(activity).accent }}>
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
          {guideActions(1)}
          <div className={`mt-3 flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between ${isLight ? "border-ink/10" : "border-paper/10"}`}>
            <div className="text-xs">
              <strong>{day} · {slot} · {activity}</strong>
              <span className={`ml-2 ${muted}`}>{compatible.length} persone compatibili</span>
            </div>
            <button type="button" onClick={() => {
                const next = !peopleFilterOpen;
                setPeopleFilterOpen(next);
                setMobileTab(next ? "persone" : "turno");
                if (next) {
                  setReturnSection({ id: "turno-workspace", label: sectionLabels["turno-workspace"] });
                  goToSection("people-workspace", false);
                } else {
                  setReturnSection(null);
                }
              }}
              className={`min-h-11 border-2 border-[#b85668] px-4 text-xs font-black uppercase ${peopleFilterOpen ? "bg-transparent text-[#c76476]" : "bg-[#b85668] text-white"}`}>
              {peopleFilterOpen ? "Nascondi persone compatibili ↑" : "Vedi persone compatibili →"}
            </button>
          </div>
        </section>

        <section id="people-workspace" className={`mt-3 max-h-[75vh] overflow-y-auto scroll-mt-20 grid gap-3 lg:mt-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,.75fr)] lg:items-stretch lg:gap-5 ${activeWorkspace !== "people-workspace" ? "hidden" : ""}`}>
          {guidedAssignmentStep === null && (guideChoice === "assign" || guideChoice === "myturns") ? <div className="col-span-full">{contextGuide()}</div> : null}
          {guidedAssignmentStep !== null && guidedAssignmentStep >= 2 ? (
            <div className={`sticky top-0 z-30 col-span-full border-2 border-amber-400 p-2 shadow-lg ${isLight ? "bg-white" : "bg-ink"}`}>
              {guideActions(guidedAssignmentStep)}
            </div>
          ) : null}
          <div id="guide-people" className={`border-2 p-3 lg:min-h-[560px] lg:p-5 ${panel} ${mobileTab !== "persone" ? "hidden lg:block" : ""} ${!peopleFilterOpen ? "lg:hidden" : ""}`}>
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
                  className="min-h-9 border-2 border-[#b85668] bg-[#b85668] px-2.5 text-[10px] font-black uppercase text-white sm:text-xs lg:min-h-11 lg:px-4"
                >
                  Proponi assegnazioni
                </button>
                <button type="button" onClick={() => setHelpTopic("suggest")} className="min-h-9 min-w-9 border-2 border-[#b85668] px-2" aria-label="Spiega Proponi persone">
                  <CircleHelp className="mx-auto size-4" />
                </button>
              </div>
            </div>

            {proposal ? (
              <div className={`mb-3 border-2 border-amber-500 p-3 text-xs ${panelSoft}`}>
                <div className="mb-2 flex items-center gap-2 font-black uppercase">Anteprima non salvata
                  <button type="button" onClick={() => setHelpTopic("suggest")} aria-label="Spiegazione proposta"><CircleHelp className="size-4" /></button>
                </div>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {proposal.changes.map((change) => {
                    const team = teams.find((t) => t.id === change.teamId);
                    return <div key={change.teamId} className="border-b pb-2">
                      <strong>{team?.day} · {team?.slot} · {team?.activity}</strong>
                      <p>{change.volunteerIds.map((id) => activeVolunteers.find((v) => v.id === id)?.name || id).join(", ")}</p>
                    </div>;
                  })}
                </div>
                <p className="mt-2 opacity-75">Nessuna persona già assegnata viene rimossa. Il limite provvisorio è 3 turni per persona; non equivale a un limite orario.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={confirmProposal} className="min-h-10 border-2 border-emerald-600 px-3 font-black">Conferma assegnazioni</button>
                  <button type="button" onClick={() => setProposal(null)} className="min-h-10 border-2 border-[#b85668] px-3 font-bold">Annulla proposta</button>
                </div>
              </div>
            ) : null}
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
                    className={`w-full border-2 p-2 text-left transition lg:p-3 ${guidedAssignmentStep === 2 && !inTeam && !conflictTeam ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-transparent " : ""} ${inTeam ? "border-[#b85668] bg-[#b85668]/10" : isLight ? "border-ink/10 hover:border-[#b85668]/55" : "border-paper/15 hover:border-[#b85668]/55"}`}
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

          {(guideChoice === "staffing" || guideChoice === "priority" || guideChoice === "people") && contextGuideStep !== null && contextGuideStep > 0 ? <div className="col-span-full">{contextGuide()}</div> : null}
          <div id="guide-team" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id) toggleMember(id); }}
            className={`flex flex-col border-2 ${guidedAssignmentStep === 3 ? "outline outline-4 outline-amber-400 outline-offset-4" : ""} p-3 lg:min-h-[560px] lg:h-full lg:p-5 ${panel} ${mobileTab !== "squadra" ? "hidden lg:flex" : ""}`}>
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
              <div id="guide-staffing-target"><dt className={`flex items-center gap-1 text-[9px] font-bold uppercase lg:text-xs ${muted}`}>Persone necessarie <button type="button" onClick={() => setHelpTopic("staffing")} aria-label="Spiega fabbisogno del turno"><CircleHelp className="size-3.5" /></button></dt>
                <input type="number" min={0} max={99} value={selectedTeam.target} disabled={!editingTeam} onChange={(e) => updateSelectedTeam({ target: Math.max(0, Number(e.target.value) || 0) })} className={`mt-1 w-full border px-2 py-1 font-bold disabled:cursor-not-allowed disabled:opacity-65 ${input}`} />
                <div className={`mt-1 text-[9px] ${muted}`}>0 = fabbisogno ancora da definire: non riceve proposte</div>
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
                <span>Copertura</span><strong>{selectedTeam.target > 0 ? `${teamMembers.length}/${selectedTeam.target}` : `${teamMembers.length}/?`}</strong>
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


        <button
          type="button"
          onClick={goToDashboardTop}
          className="fixed bottom-4 right-4 z-40 grid size-11 place-items-center rounded-full border-2 border-[#b85668] bg-ink/90 text-paper shadow-xl backdrop-blur"
          aria-label="Torna in alto"
          title="Torna in alto"
        >
          <ArrowUp className="size-5" />
        </button>
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
  guideId,
  guided,
  value,
  onChange,
  options,
  icon,
  inputClass,
}: {
  label: string;
  guideId?: string;
  guided?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  icon?: ReactNode;
  inputClass: string;
}) {
  return (
    <label id={guideId} className={`text-[11px] sm:text-xs ${guided ? "relative z-10 rounded outline outline-4 outline-amber-400 outline-offset-4 bg-amber-400/10" : ""}`}>
      {guided ? <span className="block bg-amber-400 px-1 py-1 text-xs font-black text-black">Clicca qui ↓</span> : null}
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

