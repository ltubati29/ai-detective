import { useState } from "react";
import "./App.css";

type SuspectId = "maya" | "daniel" | "sophia";

type GameScreen =
  | "welcome"
  | "briefing"
  | "investigation"
  | "accusation"
  | "result";

type Message = {
  speaker: "player" | "suspect";
  text: string;
};

type Suspect = {
  id: SuspectId;
  name: string;
  role: string;
  description: string;
};

type Clue = {
  id: string;
  title: string;
  description: string;
  source: string;
};

const suspects: Suspect[] = [
  {
    id: "maya",
    name: "Maya Chen",
    role: "Personal Assistant",
    description:
      "Calm, organized, and observant.",
  },
  {
    id: "daniel",
    name: "Daniel Brooks",
    role: "Security Guard",
    description:
      "Responsible for gallery access and security cameras.",
  },
  {
    id: "sophia",
    name: "Sophia Bennett",
    role: "Family Friend",
    description:
      "Dramatic, talkative, and recently argued with Eleanor.",
  },
];

const API_URL = "http://localhost:3002";

function App() {
  const [screen, setScreen] =
    useState<GameScreen>("welcome");

  const [selectedSuspect, setSelectedSuspect] =
    useState<SuspectId>("maya");

  const [accusedSuspect, setAccusedSuspect] =
    useState<SuspectId | "">("");

  const [question, setQuestion] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clues, setClues] = useState<Clue[]>([]);
  const [usedFallback, setUsedFallback] =
    useState(false);

  const [conversations, setConversations] = useState<
    Record<SuspectId, Message[]>
  >({
    maya: [],
    daniel: [],
    sophia: [],
  });

  const currentSuspect = suspects.find(
    (suspect) => suspect.id === selectedSuspect
  )!;

  const currentConversation =
    conversations[selectedSuspect];

  const caseSolved = accusedSuspect === "daniel";

  async function askQuestion() {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || loading) {
      return;
    }

    setError("");
    setQuestion("");
    setLoading(true);

    const playerMessage: Message = {
      speaker: "player",
      text: trimmedQuestion,
    };

    const updatedConversation = [
      ...currentConversation,
      playerMessage,
    ];

    setConversations((previous) => ({
      ...previous,
      [selectedSuspect]: updatedConversation,
    }));

    try {
      const response = await fetch(
        `${API_URL}/api/question`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            suspectId: selectedSuspect,
            question: trimmedQuestion,
            conversation: currentConversation,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "The suspect could not answer."
        );
      }

      const suspectMessage: Message = {
        speaker: "suspect",
        text: data.answer,
      };

      setConversations((previous) => ({
        ...previous,
        [selectedSuspect]: [
          ...updatedConversation,
          suspectMessage,
        ],
      }));

      if (data.usedFallback) {
        setUsedFallback(true);
      }

      if (Array.isArray(data.clues)) {
        setClues((previousClues) => {
          const newClues = data.clues.filter(
            (newClue: Clue) =>
              !previousClues.some(
                (existingClue) =>
                  existingClue.id === newClue.id
              )
          );

          return [...previousClues, ...newClues];
        });
      }
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to contact the detective server.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function restartGame() {
    setScreen("welcome");
    setSelectedSuspect("maya");
    setAccusedSuspect("");
    setQuestion("");
    setReasoning("");
    setLoading(false);
    setError("");
    setClues([]);
    setUsedFallback(false);
    setConversations({
      maya: [],
      daniel: [],
      sophia: [],
    });
  }

  function handleQuestionKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      askQuestion();
    }
  }

  function submitAccusation() {
    if (!accusedSuspect) {
      setError("Choose a suspect before submitting.");
      return;
    }

    setError("");
    setScreen("result");
  }

  if (screen === "welcome") {
    return (
      <main className="opening-screen">
        <div className="opening-card">
          <p className="eyebrow">
            Gemini-powered mystery game
          </p>

          <div className="detective-icon">⌕</div>

          <h1>AI Detective</h1>

          <h2>The Missing Aurora Diamond</h2>

          <p>
            A priceless diamond has vanished from a
            guarded mansion. Interview suspects, collect
            evidence, identify contradictions, and catch
            the thief before they escape.
          </p>

          <button
            className="primary-button"
            type="button"
            onClick={() => setScreen("briefing")}
          >
            Open Case File
          </button>
        </div>
      </main>
    );
  }

  if (screen === "briefing") {
    return (
      <main className="briefing-screen">
        <section className="briefing-card">
          <div className="briefing-header">
            <div>
              <p className="eyebrow">
                Case file #247
              </p>

              <h1>The Missing Aurora Diamond</h1>
            </div>

            <span className="case-status">
              Unsolved
            </span>
          </div>

          <div className="briefing-grid">
            <section>
              <p className="section-label">
                Background
              </p>

              <p>
                At 8:00 PM, wealthy art collector
                Eleanor Blackwood welcomed guests to
                Blackwood Mansion for a private charity
                celebration.
              </p>

              <p>
                The evening's main attraction was the
                Aurora Diamond, a rare blue diamond
                displayed inside a locked glass case in
                the gallery.
              </p>

              <p>
                The gallery was protected by a camera,
                motion sensors, an electronic lock, and
                Daniel Brooks, the mansion's security
                guard.
              </p>

              <p>
                At approximately 8:35 PM, Maya Chen went
                to the study to collect charity
                documents. Around the same time, Sophia
                Bennett left the dining room after an
                argument with Eleanor.
              </p>

              <p>
                At 8:42 PM, only the gallery camera
                stopped recording. Every other camera
                continued operating normally.
              </p>

              <p>
                A guest later reported seeing someone
                carrying a large security flashlight
                inside the mansion, even though the
                building was fully lit.
              </p>

              <p>
                At 8:45 PM, Eleanor entered the gallery
                and discovered the diamond was missing.
                The display case was closed and showed no
                signs of forced entry.
              </p>
            </section>

            <aside>
              <p className="section-label">
                Critical timeline
              </p>

              <div className="timeline">
                <div>
                  <strong>8:00 PM</strong>
                  <span>Charity party begins</span>
                </div>

                <div>
                  <strong>8:35 PM</strong>
                  <span>
                    Suspects move near the gallery area
                  </span>
                </div>

                <div>
                  <strong>8:42 PM</strong>
                  <span>
                    Gallery camera stops recording
                  </span>
                </div>

                <div>
                  <strong>8:44 PM</strong>
                  <span>
                    Security flashlight reportedly seen
                  </span>
                </div>

                <div>
                  <strong>8:45 PM</strong>
                  <span>Diamond reported missing</span>
                </div>
              </div>
            </aside>
          </div>

          <section className="known-facts">
            <p className="section-label">
              Known facts
            </p>

            <div>
              <span>✓ No forced entry</span>
              <span>✓ Display case was closed</span>
              <span>✓ Mansion exits were guarded</span>
              <span>✓ Only one camera failed</span>
              <span>
                ✓ Diamond may still be inside the mansion
              </span>
            </div>
          </section>

          <section className="mission-box">
            <p className="section-label">
              Your mission
            </p>

            <h2>
              Interview the suspects and identify the
              thief.
            </h2>

            <p>
              Collect at least three clues before making
              your accusation.
            </p>
          </section>

          <div className="briefing-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => setScreen("welcome")}
            >
              Back
            </button>

            <button
              className="primary-button"
              type="button"
              onClick={() =>
                setScreen("investigation")
              }
            >
              Begin Investigation
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "accusation") {
    return (
      <main className="accusation-screen">
        <section className="accusation-card">
          <p className="eyebrow">
            Final decision
          </p>

          <h1>Who stole the Aurora Diamond?</h1>

          <p>
            Review your evidence and select the suspect
            you believe committed the crime.
          </p>

          <div className="accusation-clues">
            <p className="section-label">
              Evidence collected
            </p>

            {clues.map((clue) => (
              <div key={clue.id}>
                <strong>{clue.title}</strong>
                <span>{clue.description}</span>
              </div>
            ))}
          </div>

          <div className="accusation-options">
            {suspects.map((suspect) => (
              <button
                key={suspect.id}
                type="button"
                className={
                  accusedSuspect === suspect.id
                    ? "accusation-option selected"
                    : "accusation-option"
                }
                onClick={() =>
                  setAccusedSuspect(suspect.id)
                }
              >
                <strong>{suspect.name}</strong>
                <span>{suspect.role}</span>
              </button>
            ))}
          </div>

          <label className="reasoning-box">
            Explain your reasoning
            <textarea
              value={reasoning}
              onChange={(event) =>
                setReasoning(event.target.value)
              }
              placeholder="Example: The camera stopped while Daniel controlled security, and witnesses saw him carrying a flashlight..."
            />
          </label>

          {error && (
            <p className="error-message standalone">
              {error}
            </p>
          )}

          <div className="briefing-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() =>
                setScreen("investigation")
              }
            >
              Continue Investigating
            </button>

            <button
              className="danger-button"
              type="button"
              onClick={submitAccusation}
            >
              Submit Accusation
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "result") {
    return (
      <main className="result-screen">
        <section
          className={
            caseSolved
              ? "result-card solved"
              : "result-card unsolved"
          }
        >
          <div className="result-icon">
            {caseSolved ? "✓" : "×"}
          </div>

          <p className="eyebrow">
            {caseSolved
              ? "Investigation complete"
              : "Case remains unsolved"}
          </p>

          <h1>
            {caseSolved
              ? "Case Solved!"
              : "Wrong Suspect"}
          </h1>

          {caseSolved ? (
            <>
              <p>
                Daniel Brooks stole the Aurora Diamond.
              </p>

              <div className="solution-box">
                <p>
                  Daniel disabled the gallery camera at
                  8:42 PM and used his security access to
                  open the display case.
                </p>

                <p>
                  He hid the diamond inside the large
                  flashlight he carried through the
                  mansion.
                </p>

                <p>
                  Maya placed him near the gallery, while
                  Sophia confirmed that he was carrying
                  the suspicious flashlight.
                </p>
              </div>
            </>
          ) : (
            <>
              <p>
                The evidence does not support your
                accusation.
              </p>

              <div className="solution-box">
                <p>
                  The real thief was Daniel Brooks, the
                  security guard.
                </p>

                <p>
                  He controlled the gallery security
                  system and used his flashlight to hide
                  the stolen diamond.
                </p>
              </div>
            </>
          )}

          {reasoning.trim() && (
            <div className="player-reasoning">
              <p className="section-label">
                Your reasoning
              </p>

              <p>{reasoning}</p>
            </div>
          )}

          <button
            className="primary-button"
            type="button"
            onClick={restartGame}
          >
            Play Again
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="investigation-header">
        <div>
          <p className="eyebrow">
            Case file #247
          </p>

          <h1>AI Detective</h1>

          <p className="subtitle">
            The Missing Aurora Diamond
          </p>
        </div>

        <button
          className="secondary-button"
          type="button"
          onClick={() => setScreen("briefing")}
        >
          Review Case File
        </button>
      </header>

      <section className="progress-section">
        <div>
          <p className="section-label">
            Investigation progress
          </p>

          <strong>
            {clues.length} of 4 clues discovered
          </strong>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${Math.min(
                (clues.length / 4) * 100,
                100
              )}%`,
            }}
          />
        </div>

        <button
          className="accuse-button"
          type="button"
          disabled={clues.length < 3}
          onClick={() => {
            setError("");
            setScreen("accusation");
          }}
        >
          {clues.length >= 3
            ? "Accuse Suspect"
            : "Collect 3 Clues"}
        </button>
      </section>

      {usedFallback && (
        <div className="fallback-notice">
          Gemini quota was unavailable, so the game used
          backup character responses. Gameplay remains
          active.
        </div>
      )}

      <section className="game-layout">
        <aside className="suspect-panel">
          <p className="section-label">
            Choose a suspect
          </p>

          <div className="suspect-list">
            {suspects.map((suspect) => (
              <button
                key={suspect.id}
                className={
                  suspect.id === selectedSuspect
                    ? "suspect-button selected"
                    : "suspect-button"
                }
                onClick={() =>
                  setSelectedSuspect(suspect.id)
                }
                type="button"
              >
                <strong>{suspect.name}</strong>
                <span>{suspect.role}</span>
                <small>{suspect.description}</small>
              </button>
            ))}
          </div>

          <div className="suggested-questions">
            <p className="section-label">
              Suggested questions
            </p>

            <button
              type="button"
              onClick={() =>
                setQuestion(
                  "Where were you between 8:35 PM and 8:45 PM?"
                )
              }
            >
              Where were you before the theft?
            </button>

            <button
              type="button"
              onClick={() =>
                setQuestion(
                  "Did you see anyone near the gallery before the diamond disappeared?"
                )
              }
            >
              Who was near the gallery?
            </button>

            <button
              type="button"
              onClick={() =>
                setQuestion(
                  "What do you know about the gallery camera stopping at 8:42 PM?"
                )
              }
            >
              What happened to the camera?
            </button>

            <button
              type="button"
              onClick={() =>
                setQuestion(
                  "Did you see anyone carrying a flashlight inside the mansion?"
                )
              }
            >
              Who had the flashlight?
            </button>
          </div>
        </aside>

        <section className="interview-panel">
          <div className="interview-header">
            <div>
              <p className="section-label">
                Interrogation room
              </p>

              <h2>{currentSuspect.name}</h2>
              <p>{currentSuspect.role}</p>
            </div>

            <span className="status-badge">
              Character active
            </span>
          </div>

          <div className="conversation">
            {currentConversation.length === 0 ? (
              <div className="empty-state">
                <p>
                  Begin by asking {currentSuspect.name} where
                  they were before the theft.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setQuestion(
                      "Where were you between 8:35 PM and 8:45 PM?"
                    )
                  }
                >
                  Use Suggested Question
                </button>
              </div>
            ) : (
              currentConversation.map(
                (message, index) => (
                  <div
                    key={`${message.speaker}-${index}`}
                    className={`message ${message.speaker}`}
                  >
                    <span>
                      {message.speaker === "player"
                        ? "Detective"
                        : currentSuspect.name}
                    </span>

                    <p>{message.text}</p>
                  </div>
                )
              )
            )}

            {loading && (
              <div className="message suspect">
                <span>{currentSuspect.name}</span>
                <p>Considering the question...</p>
              </div>
            )}
          </div>

          {error && (
            <p className="error-message">{error}</p>
          )}

          <div className="question-box">
            <input
              value={question}
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              onKeyDown={handleQuestionKeyDown}
              placeholder={`Question ${currentSuspect.name}...`}
              disabled={loading}
            />

            <button
              type="button"
              onClick={askQuestion}
              disabled={loading || !question.trim()}
            >
              {loading ? "Waiting..." : "Ask"}
            </button>
          </div>
        </section>

        <aside className="clues-panel">
          <div className="clues-heading">
            <div>
              <p className="section-label">
                Evidence board
              </p>

              <h2>Collected Clues</h2>
            </div>

            <span className="clue-count">
              {clues.length}/4
            </span>
          </div>

          {clues.length === 0 ? (
            <div className="no-clues">
              <span className="magnifying-glass">
                ⌕
              </span>

              <p>No clues collected yet.</p>

              <small>
                Ask about the gallery, camera, suspect
                movements, and flashlight.
              </small>
            </div>
          ) : (
            <div className="clue-list">
              {clues.map((clue, index) => (
                <article
                  className="clue-card"
                  key={clue.id}
                >
                  <span className="clue-number">
                    {index + 1}
                  </span>

                  <div>
                    <h3>{clue.title}</h3>
                    <p>{clue.description}</p>
                    <small>
                      Source: {clue.source}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          )}

          {clues.length >= 3 && (
            <div className="accusation-ready">
              <strong>
                Enough evidence collected.
              </strong>

              <p>
                You may now accuse a suspect.
              </p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

export default App;