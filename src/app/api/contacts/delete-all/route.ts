import { NextResponse } from "next/server";
import { db } from "@/db";

export async function DELETE() {
  try {
    const { error } = await db.from("contacts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw error;
    return NextResponse.json({ message: "All contacts deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete contacts" }, { status: 500 });
  }
}
