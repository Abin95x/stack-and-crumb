"use client";

import dynamic from "next/dynamic";
import type { Render } from "@/lib/menu";

const StudioScene = dynamic(() => import("@/components/three/StudioScene"), { ssr: false });

export default function Studio({ render }: { render: Render }) {
  return <StudioScene render={render} />;
}
