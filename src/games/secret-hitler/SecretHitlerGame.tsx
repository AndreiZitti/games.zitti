"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Import CSS files
import "./index.css";
import "./App.css";
import "./Lobby.css";
import "./Login.css";
import "./fonts.css";
import "./variables.css";

interface SecretHitlerGameProps {
  onBack: () => void;
}

// Dynamically import App with SSR disabled since it uses window.location
const App = dynamic(() => import("./App"), {
  ssr: false,
  loading: () => (
    <div className="secret-hitler-loading">
      <p>Loading Secret Hitler...</p>
    </div>
  ),
});

export function SecretHitlerGame({ onBack }: SecretHitlerGameProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="secret-hitler-loading">
        <p>Loading Secret Hitler...</p>
      </div>
    );
  }

  return (
    <div className="secret-hitler-container">
      <App onBack={onBack} />
    </div>
  );
}

export default SecretHitlerGame;
