import { useState } from "react";
import "./App.css";

type SuspectId = "maya" | "daniel" | "sophia";

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
    description: "Calm, organized, and observant.",
  },
  {
    id: "daniel",
    name: "Daniel Brooks",
    role: "Security Guard",
    description:
      "Responsible for the mansion's cameras and gallery security.",
  },
  {
    id: "sophia",
    name: "Sophia Bennett",
    role: "Family Friend",
    description:
      "A longtime family friend who argued with the owner earlier.",
  },
];

const API_URL = "http://localhost:3002";

function App() {
  const [selectedSuspect, setSelectedSuspect] =
    useState<SuspectId>("maya");

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clues, setClues] = useState<Clue[]>([]);

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

  const currentConversation = conversations[selectedSuspect];

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
      const response = await fetch(`${API_URL}/api/question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          suspectId: selectedSuspect,
          question: trimmedQuestion,
          conversation: currentConversation,
        }),
      });

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

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      askQuestion();
    }
  }

  function useSuggestedQuestion(
    suggestedQuestion: string
  ) {
    setQuestion(suggestedQuestion);
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">
          Gemini-powered mystery game
        </p>

        <h1>AI Detective</h1>

        <p className="subtitle">
          The Missing Aurora Diamond
        </p>
      </header>

      <section className="case-card">
        <div>
          <p className="section-label">Case briefing</p>

          <h2>
            A priceless diamond vanished during a mansion
            party.
          </h2>

          <p>
            At 8:00 PM, wealthy art collector Eleanor
            Blackwood welcomed guests to Blackwood Mansion
            for a private charity celebration. The main
            attraction was the Aurora Diamond, a rare blue
            diamond displayed inside a locked glass case in
            the mansion's gallery.
          </p>

          <p>
            The gallery was protected by a security camera,
            a motion sensor, and an electronic display-case
            lock. Daniel Brooks, the mansion's security
            guard, was responsible for monitoring the
            cameras and controlling access to the gallery.
          </p>

          <p>
            At approximately 8:35 PM, Maya Chen, Eleanor's
            personal assistant, entered the nearby study to
            collect documents for the evening's charity
            announcement. At around the same time, Sophia
            Bennett, a family friend, was seen leaving the
            dining room after an argument with Eleanor.
          </p>

          <p>
            At 8:42 PM, the gallery security camera suddenly
            stopped recording. No general power failure was
            reported, and the other cameras in the mansion
            continued working normally. The gallery camera
            remained offline for several minutes.
          </p>

          <p>
            Some guests also reported seeing a person
            carrying a large security flashlight inside the
            mansion. This was unusual because the mansion
            was fully lit and no electrical problem had been
            reported.
          </p>

          <p>
            At 8:45 PM, Eleanor entered the gallery and
            discovered that the Aurora Diamond was missing.
            The glass case was closed and showed no visible
            signs of forced entry. The doors to the mansion
            had remained guarded, suggesting that the
            diamond may still have been somewhere inside the
            building.
          </p>

          <p>
            Only three people had a believable reason to be
            near the gallery during the critical ten-minute
            period: Maya Chen, Daniel Brooks, and Sophia
            Bennett. Question each suspect, compare their
            stories, identify contradictions, and collect
            enough evidence to determine who stole the
            diamond.
          </p>
        </div>

        <div className="case-facts">
          <span>
            <strong>8:00 PM</strong>
            <br />
            Party begins
          </span>

          <span>
            <strong>8:35 PM</strong>
            <br />
            Suspects seen near the gallery area
          </span>

          <span>
            <strong>8:42 PM</strong>
            <br />
            Gallery camera stops recording
          </span>

          <span>
            <strong>8:45 PM</strong>
            <br />
            Diamond reported missing
          </span>

          <span>
            <strong>Known detail</strong>
            <br />
            A flashlight was seen inside the mansion
          </span>

          <span>
            <strong>Suspects</strong>
            <br />
            Maya, Daniel, and Sophia
          </span>
        </div>
      </section>

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
      </section>

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
                useSuggestedQuestion(
                  "Where were you between 8:35 PM and 8:45 PM?"
                )
              }
            >
              Where were you before the theft?
            </button>

            <button
              type="button"
              onClick={() =>
                useSuggestedQuestion(
                  "Did you see anyone near the gallery before the diamond disappeared?"
                )
              }
            >
              Who was near the gallery?
            </button>

            <button
              type="button"
              onClick={() =>
                useSuggestedQuestion(
                  "What do you know about the gallery camera stopping at 8:42 PM?"
                )
              }
            >
              What happened to the camera?
            </button>

            <button
              type="button"
              onClick={() =>
                useSuggestedQuestion(
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
              Gemini character active
            </span>
          </div>

          <div className="conversation">
            {currentConversation.length === 0 ? (
              <div className="empty-state">
                <p>
                  Begin by asking {currentSuspect.name} where
                  they were between 8:35 PM and 8:45 PM.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setQuestion(
                      "Where were you between 8:35 PM and 8:45 PM?"
                    )
                  }
                >
                  Use suggested question
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
                <p>Thinking...</p>
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
              onKeyDown={handleKeyDown}
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
                Ask about the gallery, the missing camera
                footage, the suspects' locations, and the
                flashlight.
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
                You have enough evidence.
              </strong>

              <p>
                You can now make an accusation.
              </p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

export default App;