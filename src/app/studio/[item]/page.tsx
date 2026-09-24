import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RENDERABLE } from "@/lib/menu";
import Studio from "./Studio";

export const metadata: Metadata = { robots: { index: false } };

/**
 * Dev-only photo booth: renders one menu item on a transparent canvas so
 * a headless browser can capture it into /public/menu (see README).
 */
export default async function StudioPage({ params }: PageProps<"/studio/[item]">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { item } = await params;
  const found = RENDERABLE.find((i) => i.id === item);
  if (!found?.render) notFound();
  return (
    <main style={{ width: 900, height: 900, background: "transparent" }}>
      <style>{"html,body{background:transparent!important}body::before{display:none!important}"}</style>
      <Studio render={found.render} />
    </main>
  );
}
