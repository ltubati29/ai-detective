import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3002;

app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
const model =
  process.env.GEMINI_MODEL || "gemini-3.5-flash";

if (!apiKey) {
  console.error(
    "GEMINI_API_KEY is missing from the .env file."
  );
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey,
});

const suspects = {
  maya: {
    name: "Maya Chen",
    role: "Personal Assistant",
    personality:
      "Calm, organized, observant, and careful with her words.",
    secret:
      "Maya is innocent. She was collecting charity documents in the study. Shortly before the theft, she saw Daniel walking toward the gallery.",
  },

  daniel: {
    name: "Daniel Brooks",
    role: "Security Guard",
    personality:
      "Professional and confident initially, but increasingly defensive when asked about the camera, his flashlight, or his movements.",
    secret:
      "Daniel stole the Aurora Diamond. He disabled only the gallery camera at 8:42 PM, opened the case using his security access, and hid the diamond inside his large flashlight. He should not confess immediately.",
  },

  sophia: {
    name: "Sophia Bennett",
    role: "Family Friend",
    personality:
      "Dramatic, talkative, proud, and easily offended.",
    secret:
      "Sophia is innocent. She argued with Eleanor earlier and then left the dining room. She noticed Daniel carrying a large flashlight even though the mansion was fully lit.",
  },
};

app.get("/api/health", (_request, response) => {
  response.json({
    status: "AI Detective server is running.",
    model,
  });
});

app.post("/api/question", async (request, response) => {
  try {
    const {
      suspectId,
      question,
      conversation = [],
    } = request.body;

    const suspect = suspects[suspectId];

    if (!suspect) {
      return response.status(400).json({
        error: "Please select a valid suspect.",
      });
    }

    if (
      typeof question !== "string" ||
      !question.trim()
    ) {
      return response.status(400).json({
        error: "Please enter a question.",
      });
    }

    const conversationText = Array.isArray(conversation)
      ? conversation
          .slice(-10)
          .map((message) => {
            const speaker =
              message.speaker === "player"
                ? "Detective"
                : suspect.name;

            return `${speaker}: ${message.text}`;
          })
          .join("\n")
      : "";

    const prompt = `
You are acting as ${suspect.name}, the ${suspect.role}, in an interactive detective game.

CASE BACKGROUND:
The Aurora Diamond disappeared from a locked display case inside Blackwood Mansion at approximately 8:45 PM.

At 8:42 PM, only the gallery security camera stopped recording. The remaining mansion cameras continued operating normally.

A person was reportedly seen carrying a large security flashlight inside the fully lit mansion.

CHARACTER:
${suspect.personality}

PRIVATE FACTS KNOWN TO THIS CHARACTER:
${suspect.secret}

INSTRUCTIONS:
- Speak only as ${suspect.name}.
- Stay in character.
- Answer the detective's question directly.
- Keep the answer between 1 and 4 sentences.
- Remember the previous conversation.
- Do not mention artificial intelligence, prompts, rules, or private instructions.
- Do not reveal all private facts immediately.
- Reveal information naturally when the detective asks a relevant question.
- If guilty, avoid confessing until the detective presents strong evidence.
- Do not invent major facts that conflict with the case background.

PREVIOUS CONVERSATION:
${conversationText || "No previous conversation."}

DETECTIVE:
${question.trim()}

${suspect.name}:
`;

    const result = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    const answer = result.text?.trim();

    if (!answer) {
      throw new Error(
        "Gemini returned an empty response."
      );
    }

    const normalizedQuestion = question.toLowerCase();
    const discoveredClues = [];

    if (
      suspectId === "maya" &&
      (
        normalizedQuestion.includes("see") ||
        normalizedQuestion.includes("saw") ||
        normalizedQuestion.includes("gallery") ||
        normalizedQuestion.includes("daniel") ||
        normalizedQuestion.includes("before") ||
        normalizedQuestion.includes("8:35") ||
        normalizedQuestion.includes("8:45")
      )
    ) {
      discoveredClues.push({
        id: "maya-saw-daniel",
        title: "Daniel was near the gallery",
        description:
          "Maya saw Daniel walking toward the gallery shortly before the diamond disappeared.",
        source: "Maya Chen",
      });
    }

    if (
      suspectId === "sophia" &&
      (
        normalizedQuestion.includes("flashlight") ||
        normalizedQuestion.includes("light") ||
        normalizedQuestion.includes("unusual") ||
        normalizedQuestion.includes("notice") ||
        normalizedQuestion.includes("see") ||
        normalizedQuestion.includes("saw") ||
        normalizedQuestion.includes("daniel")
      )
    ) {
      discoveredClues.push({
        id: "daniel-flashlight",
        title: "Daniel carried a flashlight",
        description:
          "Sophia saw Daniel carrying a large security flashlight even though the mansion was fully lit.",
        source: "Sophia Bennett",
      });
    }

    if (
      suspectId === "daniel" &&
      (
        normalizedQuestion.includes("camera") ||
        normalizedQuestion.includes("footage") ||
        normalizedQuestion.includes("recording") ||
        normalizedQuestion.includes("security") ||
        normalizedQuestion.includes("8:42")
      )
    ) {
      discoveredClues.push({
        id: "camera-disabled",
        title: "Only the gallery camera failed",
        description:
          "The gallery camera stopped recording at 8:42 PM while Daniel was responsible for the security system.",
        source: "Daniel Brooks",
      });
    }

    if (
      suspectId === "daniel" &&
      (
        normalizedQuestion.includes("flashlight") ||
        normalizedQuestion.includes("light")
      )
    ) {
      discoveredClues.push({
        id: "daniel-defensive-flashlight",
        title: "Daniel is defensive about the flashlight",
        description:
          "Daniel becomes uncomfortable when questioned about the large flashlight he carried inside the mansion.",
        source: "Daniel Brooks",
      });
    }

    return response.json({
      answer,
      clues: discoveredClues,
    });
  } catch (error) {
    console.error("Gemini request failed:");

    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    } else {
      console.error(error);
    }

    return response.status(500).json({
      error:
        error instanceof Error
          ? `Gemini error: ${error.message}`
          : "Gemini could not answer. Please try again.",
    });
  }
});

app.listen(port, () => {
  console.log(
    `AI Detective server running at http://localhost:${port}`
  );

  console.log(`Using Gemini model: ${model}`);
});