import { redirect } from "next/navigation";

export default function AskAiPage() {
  redirect("/dashboard?ai=1");
}
