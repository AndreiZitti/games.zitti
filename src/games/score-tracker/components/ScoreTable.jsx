import React, { useState } from "react";
import { AddRoundModal } from "./AddRoundModal";
import { WhistBidModal } from "./WhistBidModal";

export function ScoreTable({
  gameType,
  players,
  teams,
  rounds,
  totals,
  leaderIndex,
  config,
  isTeamGame,
  // Whist-specific props
  whistData,
  whistTotals,
  whistActiveRoundIndex,
  whistIsComplete,
  onAddRound,
  onUpdateRound,
  onDeleteRound,
  onUpdateWhistBids,
  onUpdateWhistTricks,
  onRevertWhistToBidding,
  onNewGame,
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRound, setEditingRound] = useState(null);
  const [whistModalRound, setWhistModalRound] = useState(null);

  const isWhist = gameType === "whist";

  // For display: use team names for team games, player names for individual games
  const columnHeaders = isTeamGame
    ? teams.map((team) => team[0]) // team[0] is the team name
    : players;

  const handleAddRound = (scores, roundData = null) => {
    onAddRound(scores, roundData);
    setShowAddModal(false);
  };

  const handleEditRound = (scores, roundData = null) => {
    if (editingRound) {
      onUpdateRound(editingRound.id, scores, roundData);
      setEditingRound(null);
    }
  };

  const handleCellClick = (round) => {
    if (!isWhist) {
      setEditingRound(round);
    }
  };

  // Whist: Handle clicking on a round row
  const handleWhistRowClick = (round, roundIndex) => {
    if (round.phase === 'bidding' || round.phase === 'tricks') {
      setWhistModalRound({ ...round, roundIndex });
    } else if (round.phase === 'complete') {
      // Allow editing completed rounds
      setWhistModalRound({ ...round, roundIndex, isEditing: true });
    }
  };

  // Whist: Save bids and move to tricks phase
  const handleWhistBidsSave = (bids) => {
    if (whistModalRound) {
      onUpdateWhistBids(whistModalRound.roundIndex, bids);
      // Reopen modal in tricks phase
      setWhistModalRound(null);
    }
  };

  // Whist: Save tricks (and optionally bids) and calculate scores
  const handleWhistTricksSave = (tricks, bids = null) => {
    if (whistModalRound) {
      onUpdateWhistTricks(whistModalRound.roundIndex, tricks, bids);
      setWhistModalRound(null);
    }
  };

  // Whist: Go back to bidding phase
  const handleWhistRevert = () => {
    if (whistModalRound) {
      onRevertWhistToBidding(whistModalRound.roundIndex);
      setWhistModalRound(null);
    }
  };

  // Compute whist leader
  const whistLeaderIndex = whistTotals && whistTotals.length > 0
    ? whistTotals.reduce((maxIdx, val, idx, arr) => (val > arr[maxIdx] ? idx : maxIdx), 0)
    : -1;

  // Export results to clipboard
  const handleExport = () => {
    if (!whistData || !players) return;

    const finalTotals = [...whistTotals];
    const sortedPlayers = players
      .map((name, i) => ({ name, score: finalTotals[i] }))
      .sort((a, b) => b.score - a.score);

    let exportText = `🃏 WHIST RESULTS\n`;
    exportText += `${'─'.repeat(24)}\n\n`;
    exportText += `🏆 FINAL STANDINGS\n\n`;

    sortedPlayers.forEach((p, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
      exportText += `${medal} ${p.name}: ${p.score} pts\n`;
    });

    exportText += `\n${'─'.repeat(24)}\n`;
    exportText += `📊 ${whistData.length} rounds played\n`;

    navigator.clipboard.writeText(exportText).then(() => {
      alert('Results copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy. Here are your results:\n\n' + exportText);
    });
  };

  // Whist-specific render
  if (isWhist && whistData) {
    const completedRounds = whistData.filter(r => r.phase === 'complete').length;

    return (
      <div className="score-table-container">
        <div className="score-table-header">
          <span className="score-table-title">{config.name}</span>
          <button className="btn-new-game" onClick={onNewGame}>
            New
          </button>
        </div>

        {/* Whist progress and actions bar */}
        <div className="whist-status-bar">
          <div className="whist-progress-info">
            <span className="whist-progress-label">
              {completedRounds}/{whistData.length}
            </span>
            <div className="whist-progress-bar">
              <div
                className="whist-progress-fill"
                style={{ width: `${(completedRounds / whistData.length) * 100}%` }}
              />
            </div>
          </div>

          {whistActiveRoundIndex >= 0 && !whistIsComplete && (
            <div className="whist-action-buttons">
              <button
                className={`btn-action ${whistData[whistActiveRoundIndex].phase === 'bidding' ? 'active' : 'done'}`}
                onClick={() => {
                  const activeRound = whistData[whistActiveRoundIndex];
                  if (activeRound.phase === 'bidding') {
                    handleWhistRowClick(activeRound, whistActiveRoundIndex);
                  }
                }}
                disabled={whistData[whistActiveRoundIndex].phase !== 'bidding'}
              >
                + Bid
              </button>
              <button
                className={`btn-action ${whistData[whistActiveRoundIndex].phase === 'tricks' ? 'active' : ''}`}
                onClick={() => {
                  const activeRound = whistData[whistActiveRoundIndex];
                  if (activeRound.phase === 'tricks') {
                    handleWhistRowClick(activeRound, whistActiveRoundIndex);
                  }
                }}
                disabled={whistData[whistActiveRoundIndex].phase !== 'tricks'}
              >
                + Trick
              </button>
            </div>
          )}

          {whistIsComplete && (
            <span className="whist-complete">Complete!</span>
          )}
        </div>

        <div className="score-table-wrapper whist-full-table">
          <table className="score-table whist-table-simple">
            <thead>
              <tr>
                <th className="round-col">#</th>
                {players.map((name, i) => (
                  <th
                    key={i}
                    className={`player-col ${i === whistLeaderIndex && completedRounds > 0 ? "leader" : ""}`}
                  >
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {whistData.map((round, rowIndex) => {
                const isActive = round.phase === 'bidding' || round.phase === 'tricks';
                const isClickable = isActive || round.phase === 'complete';
                const dealerIndex = rowIndex % players.length;

                // Calculate running totals up to this round
                const runningTotals = players.map((_, playerIndex) => {
                  let total = 0;
                  for (let i = 0; i <= rowIndex; i++) {
                    const s = whistData[i].scores?.[playerIndex];
                    if (s !== null && s !== undefined) total += s;
                  }
                  return total;
                });

                return (
                  <tr
                    key={rowIndex}
                    className={`whist-row-simple ${round.phase} ${isActive ? 'active-round' : ''}`}
                    onClick={() => isClickable && handleWhistRowClick(round, rowIndex)}
                  >
                    <td className="round-col cards-col">{round.cards}</td>
                    {players.map((_, playerIndex) => {
                      const runningTotal = runningTotals[playerIndex];
                      const score = round.scores?.[playerIndex];
                      const hasScore = round.phase === 'complete';
                      const isDealer = playerIndex === dealerIndex;

                      return (
                        <td
                          key={playerIndex}
                          className={`total-col ${hasScore ? (runningTotal < 0 ? 'negative' : '') : ''} ${playerIndex === whistLeaderIndex && hasScore ? 'leader' : ''} ${isDealer ? 'dealer' : ''}`}
                        >
                          {isDealer && <span className="dealer-marker">●</span>}
                          {hasScore ? runningTotal : '-'}
                          {hasScore && score !== null && (
                            <span className={`score-delta ${score < 0 ? 'negative' : 'positive'}`}>
                              {score >= 0 ? '+' : ''}{score}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {whistIsComplete && (
          <div className="game-complete-message">
            <p>Winner: <strong>{players[whistLeaderIndex]}</strong> with {whistTotals[whistLeaderIndex]} points!</p>
            <button className="btn btn-export" onClick={handleExport}>
              Export Results
            </button>
          </div>
        )}

        {whistModalRound && (
          <WhistBidModal
            round={whistModalRound}
            players={players}
            onSaveBids={handleWhistBidsSave}
            onSaveTricks={handleWhistTricksSave}
            onRevert={handleWhistRevert}
            onClose={() => setWhistModalRound(null)}
          />
        )}
      </div>
    );
  }

  // Non-Whist games (Septica, Rentz, etc.)
  return (
    <div className="score-table-container">
      <div className="score-table-header">
        <span className="score-table-title">{config.name}</span>
        <button className="btn-new-game" onClick={onNewGame}>
          New
        </button>
      </div>

      {/* Show team members for team games */}
      {isTeamGame && (
        <div className="team-members-display">
          {teams.map((team, i) => (
            <div key={i} className="team-members">
              <span className="team-label">{team[0]}:</span>
              <span className="team-players-list">{team.slice(1).join(" & ")}</span>
            </div>
          ))}
        </div>
      )}

      <div className="score-table-wrapper">
        <table className="score-table">
          <thead>
            <tr>
              <th className="round-col">#</th>
              {columnHeaders.map((name, i) => (
                <th
                  key={i}
                  className={`player-col ${i === leaderIndex && rounds.length > 0 ? "leader" : ""}`}
                >
                  {name}
                </th>
              ))}
              <th className="delete-col"></th>
            </tr>
          </thead>
          <tbody>
            {rounds.map((round, rowIndex) => (
              <tr key={round.id} onClick={() => handleCellClick(round)}>
                <td className="round-col">{rowIndex + 1}</td>
                {round.scores.map((score, i) => (
                  <td
                    key={i}
                    className={`score-cell ${score < 0 ? "negative" : ""} ${i === leaderIndex && rounds.length > 0 ? "leader" : ""}`}
                  >
                    {score >= 0 ? "+" : ""}{score}
                  </td>
                ))}
                <td className="delete-col">
                  <button
                    className="delete-round-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRound(round.id);
                    }}
                  >
                    &times;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="totals-row">
              <td className="round-col">&#931;</td>
              {totals.map((total, i) => (
                <td
                  key={i}
                  className={`score-cell total ${total < 0 ? "negative" : ""} ${i === leaderIndex && rounds.length > 0 ? "leader" : ""}`}
                >
                  {total}
                </td>
              ))}
              <td className="delete-col"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {rounds.length === 0 && (
        <div className="empty-state">
          <p>No rounds yet. Add your first round!</p>
        </div>
      )}

      <div className="button-group">
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          + Add Round
        </button>
      </div>

      {showAddModal && (
        <AddRoundModal
          gameType={gameType}
          players={players}
          teams={teams}
          isTeamGame={isTeamGame}
          config={config}
          onSave={handleAddRound}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingRound && (
        <AddRoundModal
          gameType={gameType}
          players={players}
          teams={teams}
          isTeamGame={isTeamGame}
          config={config}
          initialScores={editingRound.scores}
          initialData={editingRound.data}
          onSave={handleEditRound}
          onClose={() => setEditingRound(null)}
          isEditing
        />
      )}
    </div>
  );
}
