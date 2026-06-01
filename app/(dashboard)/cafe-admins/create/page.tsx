import { redirect } from "next/navigation";

export default function CreateCafeAdminRedirectPage() {
  redirect("/cafe-admins?add=1");
}
