import { getEventWithProgramById } from "@/lib/db";
import EventEditor from "@/components/EventEditor";

export const dynamic = "force-dynamic";

export default async function EventEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;

  if (idStr === "new") {
    return <EventEditor mode="create" initial={null} />;
  }

  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return <EventEditor mode="create" initial={null} />;
  }

  const event = getEventWithProgramById(id);
  if (!event) {
    return (
      <div className="p-6 text-red-600">Event not found (#{id}).</div>
    );
  }

  return <EventEditor mode="edit" initial={event} />;
}