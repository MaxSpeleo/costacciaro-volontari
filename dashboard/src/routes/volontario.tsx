import { createFileRoute } from "@tanstack/react-router";
import { OrganizzatoriDashboard } from "./organizzatori";

export const Route = createFileRoute("/volontario")({
  component: VolontarioPage,
  head: () => ({
    meta: [
      { title: "Il mio Costacciaro — Costacciaro 2026" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function VolontarioPage() {
  return <OrganizzatoriDashboard volunteerOnly />;
}
