"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { ChromaGame } from "@/games/chroma/ChromaGame";

function ChromaContent() {
  const router = useRouter();
  return <ChromaGame onBack={() => router.push("/")} />;
}

export default function ChromaPage() {
  return (
    <Suspense>
      <ChromaContent />
    </Suspense>
  );
}
