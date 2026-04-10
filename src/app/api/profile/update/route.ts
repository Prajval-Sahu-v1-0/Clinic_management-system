import { auth } from "@/../auth";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
  }

  const userId = session.user.id;
  const oldName = session.user.name || "";

  const { error } = await supabase
    .from("user")
    .update({ name: name.trim() })
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logAudit({
    action: "update",
    actor_id: userId,
    actor_role: (session.user as any).role || "patient",
    entity_type: "user",
    entity_id: userId,
    before_data: { name: oldName },
    after_data: { name: name.trim() },
  });

  return NextResponse.json({ ok: true, name: name.trim() });
}
