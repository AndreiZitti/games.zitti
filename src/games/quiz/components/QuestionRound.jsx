import { useState } from 'react'
import { Timer } from './Timer'

export function QuestionRound({
  room,
  currentQuestion,
  timeRemaining,
  hasAnswered,
  onSubmitAnswer
}) {
  const [textAnswer, setTextAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState(null)

  const handleTextSubmit = (e) => {
    e.preventDefault()
    if (textAnswer.trim() && !hasAnswered) {
      onSubmitAnswer(textAnswer.trim())
      setTextAnswer('')
    }
  }

  const handleOptionSelect = (option) => {
    if (hasAnswered) return
    setSelectedOption(option)
    onSubmitAnswer(option)
  }

  // Count how many have answered
  const answeredCount = room.players.filter(p => p.hasAnswered).length
  const totalPlayers = room.players.length
  const progressPercent = totalPlayers > 0 ? (answeredCount / totalPlayers) * 100 : 0

  // Determine question type
  const questionType = currentQuestion.type || 'text'
  const isMultipleChoice = questionType === 'multiple' || questionType === 'boolean'

  // Option letters for multiple choice
  const optionLetters = ['A', 'B', 'C', 'D']

  return (
    <div className="screen quiz-question quiz-game">
      {/* Header with meta and timer */}
      <div className="question-header">
        <div className="question-meta">
          <span className="question-meta__category">{currentQuestion.category}</span>
          <span className="question-meta__value">{currentQuestion.value} pts</span>
        </div>
        <Timer
          seconds={timeRemaining}
          maxSeconds={60}
          warningAt={30}
          criticalAt={10}
        />
      </div>

      {/* Question card */}
      <div className="question-content">
        <p className="question-text">{currentQuestion.question}</p>
      </div>

      {/* Answer area */}
      {!hasAnswered ? (
        isMultipleChoice ? (
          // Multiple choice or True/False
          <div className={`options-grid ${questionType === 'boolean' ? 'options-grid--boolean' : ''}`}>
            {currentQuestion.options?.map((option, index) => (
              <button
                key={index}
                className={`option-btn ${selectedOption === option ? 'option-btn--selected' : ''}`}
                onClick={() => handleOptionSelect(option)}
                disabled={hasAnswered}
              >
                {questionType !== 'boolean' && (
                  <span className="option-letter">
                    {optionLetters[index]}
                  </span>
                )}
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>
        ) : (
          // Free text input
          <form onSubmit={handleTextSubmit} className="answer-form">
            <input
              type="text"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Type your answer..."
              autoFocus
              maxLength={100}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!textAnswer.trim()}
            >
              Submit
            </button>
          </form>
        )
      ) : (
        // Answer submitted state
        <div className="answer-submitted">
          <p className="answer-submitted__title">Answer submitted!</p>
          {selectedOption && (
            <p className="answer-submitted__answer">
              Your answer: <strong>{selectedOption}</strong>
            </p>
          )}
        </div>
      )}

      {/* Footer: player progress */}
      <div className="answer-status">
        <p className="answer-status__text">
          {answeredCount} of {totalPlayers} players answered
        </p>
        <div className="answer-status__progress">
          <div
            className="answer-status__progress-bar"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="answer-indicators">
          {room.players.map(player => (
            <div
              key={player.id}
              className={`answer-indicator ${player.hasAnswered ? 'answer-indicator--answered' : ''}`}
              title={player.name}
            >
              {player.name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
