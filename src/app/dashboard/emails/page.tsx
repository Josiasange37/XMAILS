import { redirect } from "next/navigation";

export default function EmailsPage() {
  redirect("/dashboard/emails/inbox");
}
