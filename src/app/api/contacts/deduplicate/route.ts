import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function DELETE(request: NextRequest) {
  try {
    // Find all duplicate emails (keep the oldest, delete the rest)
    const { data: duplicates, error: findError } = await db
      .from("contacts")
      .select("id, email, created_at")
      .order("email", { ascending: true })
      .order("created_at", { ascending: true });

    if (findError) throw findError;

    // Group by email and find duplicates
    const emailGroups = new Map<string, typeof duplicates>();
    for (const contact of duplicates || []) {
      const existing = emailGroups.get(contact.email) || [];
      existing.push(contact);
      emailGroups.set(contact.email, existing);
    }

    // Collect IDs to delete (all except the first/oldest in each group)
    const idsToDelete: string[] = [];
    for (const [, contacts] of emailGroups) {
      if (contacts.length > 1) {
        // Keep the first (oldest), delete the rest
        for (let i = 1; i < contacts.length; i++) {
          idsToDelete.push(contacts[i].id);
        }
      }
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json({ deleted: 0, message: "No duplicates found" });
    }

    // Delete duplicates in batches
    const batchSize = 1000;
    let deleted = 0;
    for (let i = 0; i < idsToDelete.length; i += batchSize) {
      const batch = idsToDelete.slice(i, i + batchSize);
      const { error: deleteError } = await db
        .from("contacts")
        .delete()
        .in("id", batch);

      if (deleteError) throw deleteError;
      deleted += batch.length;
    }

    return NextResponse.json({ deleted, message: `Removed ${deleted} duplicate contact(s)` });
  } catch (error) {
    console.error("Deduplicate error:", error);
    return NextResponse.json(
      { error: "Failed to deduplicate contacts" },
      { status: 500 }
    );
  }
}