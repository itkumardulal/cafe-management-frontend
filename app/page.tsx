import { redirect } from "next/navigation";

/** Fallback when middleware does not run; middleware normally routes `/` by session cookies. */
export default function Home() {
  redirect("/login");
}
