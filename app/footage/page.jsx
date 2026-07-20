import { redirect } from "next/navigation";

export const metadata = {
  title: "Reference Remix Studio · Alyssa Creative SOP",
  description: "Record and adapt competitor reference videos into original treatment creative versions.",
};

export default function LegacyFootagePage() {
  redirect("/remix");
}
