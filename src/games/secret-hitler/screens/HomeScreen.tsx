import React from "react";
import { motion } from "framer-motion";
import { ThemeLabels } from "../assets/themes";

interface HomeScreenProps {
  onBack: () => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  themeLabels: ThemeLabels;
}

export function HomeScreen({ onBack, onCreateRoom, onJoinRoom, themeLabels }: HomeScreenProps) {
  return (
    <motion.div
      className="secret-hitler-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button className="btn-back" onClick={onBack}>
        &larr; Back to Games
      </button>

      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {themeLabels.themeName.toUpperCase()}
      </motion.h1>
      <motion.p
        className="subtitle"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        A game of political intrigue and betrayal
      </motion.p>

      <motion.div
        className="how-to-play"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <ul>
          <li>{themeLabels.gameDescription.factionSplit}</li>
          <li>{themeLabels.gameDescription.liberalGoal}</li>
          <li>{themeLabels.gameDescription.fascistGoal}</li>
          <li>Trust no one - anyone could be lying about their identity!</li>
        </ul>
      </motion.div>

      <motion.div
        className="button-group"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <button className="btn btn-primary" onClick={onCreateRoom}>
          Create Room
        </button>
        <button className="btn btn-secondary" onClick={onJoinRoom}>
          Join Room
        </button>
      </motion.div>

      <motion.div
        className="credits"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p>
          Adapted from the original{" "}
          <a
            href="https://secrethitler.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Secret Hitler
          </a>{" "}
          board game by Goat, Wolf, & Cabbage.
        </p>
        <p>
          Licensed under{" "}
          <a
            href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
            target="_blank"
            rel="noopener noreferrer"
          >
            CC BY-NC-SA 4.0
          </a>
        </p>
      </motion.div>
    </motion.div>
  );
}

export default HomeScreen;
