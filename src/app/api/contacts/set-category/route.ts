import { NextResponse } from "next/server";
import { db } from "@/db";

const CATEGORIES = ["follower", "sponsor", "partner", "friend", "enterprise"];

export async function POST() {
  try {
    const { data: contacts, error } = await db.from("contacts").select("id, tags");
    if (error) throw error;

    let updated = 0;
    for (const c of contacts || []) {
      const tags = c.tags || [];
      const hasCategory = CATEGORIES.some((cat) => tags.includes(cat));
      if (!hasCategory || !tags.includes("follower")) {
        const newTags = hasCategory ? [...tags.filter((t: string) => !CATEGORIES.includes(t)), "follower"] : [...tags, "follower"];
        const { error: updateError } = await db
          .from("contacts")
          .update({ tags: newTags })
          .eq("id", c.id);
        if (updateError) throw updateError;
        updated++;
      }
    }

    return NextResponse.json({ updated, total: contacts?.length || 0 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update categories" }, { status: 500 });
  }
}
