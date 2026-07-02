import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

const CATEGORIES = ["follower", "sponsor", "partner", "friend", "enterprise"];

export async function POST(request: NextRequest) {
  try {
    // Get all contacts
    const { data: contacts, error: fetchError } = await db
      .from("contacts")
      .select("id, email, tags, created_at")
      .order("email", { ascending: true })
      .order("created_at", { ascending: true });

    if (fetchError) throw fetchError;

    // Group by email
    const emailGroups = new Map<string, typeof contacts>();
    for (const contact of contacts || []) {
      const existing = emailGroups.get(contact.email) || [];
      existing.push(contact);
      emailGroups.set(contact.email, existing);
    }

    let updated = 0;
    let deleted = 0;
    const errors: string[] = [];

    // Process each group
    for (const [email, group] of emailGroups) {
      if (group.length > 1) {
        // Duplicates found - keep oldest, delete rest
        const toDelete = group.slice(1).map(c => c.id);
        const { error: deleteError } = await db
          .from("contacts")
          .delete()
          .in("id", toDelete);
        
        if (deleteError) {
          errors.push(`Failed to delete duplicates for ${email}: ${deleteError.message}`);
        } else {
          deleted += toDelete.length;
        }
      }

      // For the kept contact (first/oldest), check if it has a category
      const kept = group[0];
      const hasCategory = (kept.tags || []).some((tag: string) => CATEGORIES.includes(tag));
      
      if (!hasCategory) {
        // Add "follower" category
        const newTags = [...(kept.tags || []), "follower"];
        const { error: updateError } = await db
          .from("contacts")
          .update({ tags: newTags })
          .eq("id", kept.id);
        
        if (updateError) {
          errors.push(`Failed to update ${email}: ${updateError.message}`);
        } else {
          updated++;
        }
      }
    }

    return NextResponse.json({
      updated,
      deleted,
      message: `Fixed ${updated} uncategorized contact(s), removed ${deleted} duplicate(s)`,
      errors: errors.length ? errors : undefined
    });
  } catch (error) {
    console.error("Fix uncategorized error:", error);
    return NextResponse.json(
      { error: "Failed to fix uncategorized contacts" },
      { status: 500 }
    );
  }
}