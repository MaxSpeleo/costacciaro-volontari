import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/smart")({
  beforeLoad: () => {
    throw redirect({ to: "/organizzatori" });
  },
});
