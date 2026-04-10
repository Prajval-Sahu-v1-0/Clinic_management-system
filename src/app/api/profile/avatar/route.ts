import { auth } from "@/../auth";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save as [user_id].jpg (assuming we standardize or let it guess, but passing contentType helps)
    const fileName = `${userId}.jpg`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, buffer, { 
        upsert: true,
        contentType: file.type || 'image/jpeg'
      });

    if (error) {
       console.error("Storage upload error:", error);
       return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the change
    logAudit({
      action: "update",
      actor_id: userId,
      actor_role: (session.user as any).role || "patient",
      entity_type: "user",
      entity_id: userId,
      after_data: { avatar_updated: true },
    });

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${fileName}`;

    return NextResponse.json({ ok: true, url: publicUrl });
  } catch (e: any) {
    console.error("Avatar upload exception:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
