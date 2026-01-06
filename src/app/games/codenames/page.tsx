"use client";

import { useRouter } from "next/navigation";
import { CodenamesGame } from "@/games/codenames/CodenamesGame";

export default function CodenamesPage() {
  const router = useRouter();

  return <CodenamesGame onBack={() => router.push("/")} />;
}
