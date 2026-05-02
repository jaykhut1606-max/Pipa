// /scan was the legacy entry — Home now hosts the scan cards. Kept as a
// permanent redirect so older links and the post-onboarding default still
// resolve.
import { redirect } from "next/navigation";

export default function ScanRedirect() {
  redirect("/home");
}
