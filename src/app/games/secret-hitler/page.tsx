"use client";

import { useRouter } from "next/navigation";
import { SecretHitlerGame } from "@/games/secret-hitler/SecretHitlerGame";

export default function SecretHitlerPage() {
  const router = useRouter();

  return <SecretHitlerGame onBack={() => router.push("/")} />;
}
