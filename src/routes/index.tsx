import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { isAuthed, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={isAuthed ? "/home" : "/record"} />;
}
