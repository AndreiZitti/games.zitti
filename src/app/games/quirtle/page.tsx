"use client";

import { useRouter } from "next/navigation";
import { QuirtleGame } from "@/games/quirtle/QuirtleGame";

export default function QuirtlePage() {
  const router = useRouter();

  return <QuirtleGame onBack={() => router.push("/")} />;
}
