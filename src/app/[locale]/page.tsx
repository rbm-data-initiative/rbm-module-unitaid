import { redirect } from "@/navigation";

// The sandbox has a single page: the module under development.
export default function Home() {
	redirect("/unitaid");
}
