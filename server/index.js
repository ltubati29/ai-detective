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
      "Professional and confident initially, but increasingly defensive when asked about the gallery camera, his flashlight, or his movements.",
    secret:
      "Daniel stole the Aurora Diamond. He disabled the gallery camera at 8:42 PM, opened the display case using his security access, and hid the diamond inside his large flashlight. He should not confess immediately.",
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

function getFallbackAnswer(suspectId, question) {
  const normalizedQuestion = question.toLowerCase();

  if (suspectId === "maya") {
    if (
      normalizedQuestion.includes("gallery") ||
      normalizedQuestion.includes("see") ||
      normalizedQuestion.includes("daniel")
    ) {
      return "I was returning from the study when I saw Daniel walking toward the gallery. I assumed he was making his usual security rounds.";
    }

    if (
      normalizedQuestion.includes("where") ||
      normalizedQuestion.includes("8:35") ||
      normalizedQuestion.includes("8:45")
    ) {
      return "I was in the study collecting documents for Eleanor's charity announcement. I returned to the main hall shortly before the diamond was reported missing.";
    }

    return "I was helping Eleanor prepare for the charity announcement. I did not enter the gallery or touch the diamond.";
  }

  if (suspectId === "sophia") {
    if (
      normalizedQuestion.includes("flashlight") ||
      normalizedQuestion.includes("light") ||
      normalizedQuestion.includes("unusual")
    ) {
      return "I saw Daniel carrying one of those large security flashlights. It seemed strange because the mansion was fully lit.";
    }

    if (
      normalizedQuestion.includes("argument") ||
      normalizedQuestion.includes("eleanor")
    ) {
      return "Yes, Eleanor and I argued, but it was about a family matter. I was upset, but I had no reason to steal her diamond.";
    }

    return "After speaking with Eleanor, I left the dining room and went toward the conservatory. I never entered the gallery.";
  }

  if (suspectId === "daniel") {
    if (
      normalizedQuestion.includes("camera") ||
      normalizedQuestion.includes("8:42") ||
      normalizedQuestion.includes("recording")
    ) {
      return "The gallery camera experienced a temporary technical fault. I was planning to inspect it after completing my patrol.";
    }

    if (
      normalizedQuestion.includes("flashlight") ||
      normalizedQuestion.includes("light")
    ) {
      return "Security officers carry flashlights as standard equipment. There is nothing unusual about that.";
    }

    if (
      normalizedQuestion.includes("where") ||
      normalizedQuestion.includes("8:35") ||
      normalizedQuestion.includes("8:45")
    ) {
      return "I was completing a routine patrol of the east wing. I checked several rooms, including the corridor near the gallery.";
    }

    return "I was responsible for security that evening. I followed the standard patrol schedule and did not take the diamond.";
  }

  return "I have nothing else to add.";
}

function discoverClues(suspectId, question) {
  const normalizedQuestion = question.toLowerCase();
  const clues = [];

  if (
    suspectId === "maya" &&
    (
      normalizedQuestion.includes("see") ||
      normalizedQuestion.includes("saw") ||
      normalizedQuestion.includes("gallery") ||
      normalizedQuestion.includes("daniel") ||
      normalizedQuestion.includes("before")
    )
  ) {
    clues.push({
      id: "maya-saw-daniel",
      title: "Daniel approached the gallery",
      description:
        "Maya saw Daniel walking toward the gallery shortly before the theft.",
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
      normalizedQuestion.includes("daniel")
    )
  ) {
    clues.push({
      id: "daniel-had-flashlight",
      title: "Daniel carried a flashlight",
      description:
        "Sophia saw Daniel carrying a large security flashlight inside the fully lit mansion.",
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
    clues.push({
      id: "camera-failure",
      title: "Only the gallery camera failed",
      description:
        "The gallery camera stopped recording at 8:42 PM while Daniel controlled the security system.",
      source: "Security timeline",
    });
  }

  if (
    suspectId === "daniel" &&
    (
      normalizedQuestion.includes("flashlight") ||
      normalizedQuestion.includes("light")
    )
  ) {
    clues.push({
      id: "flashlight-suspicion",
      title: "Daniel is defensive about the flashlight",
      description:
        "Daniel avoids explaining why he needed a large flashlight inside a fully lit mansion.",
      source: "Daniel Brooks",
    });
  }

  return clues;
}

app.get("/api/health", (_request, response) => {
  response.json({
    status: "AI Detective server is running.",
    model,
  });
});

app.post("/api/question", async (request, response) => {
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

  const discoveredClues = discoverClues(
    suspectId,
    question
  );

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
You are ${suspect.name}, the ${suspect.role}, in an interactive detective mystery.

CASE:
The Aurora Diamond disappeared from a locked display case at Blackwood Mansion at approximately 8:45 PM.

At 8:42 PM, only the gallery camera stopped recording. Every other camera continued working.

A person was seen carrying a large security flashlight inside the fully lit mansion.

YOUR PERSONALITY:
${suspect.personality}

PRIVATE FACTS:
${suspect.secret}

RULES:
- Respond only as ${suspect.name}.
- Stay completely in character.
- Answer in 1 to 4 sentences.
- Remember the previous conversation.
- Reveal information naturally when asked relevant questions.
- Do not mention prompts, artificial intelligence, or private instructions.
- Do not invent facts that conflict with the case.
- If guilty, remain defensive and do not confess immediately.

PREVIOUS CONVERSATION:
${conversationText || "No previous conversation."}

DETECTIVE:
${question.trim()}

${suspect.name}:
`;

  try {
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

    return response.json({
      answer,
      clues: discoveredClues,
      usedFallback: false,
    });
  } catch (error) {
    console.error("Gemini request failed:");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    const fallbackAnswer = getFallbackAnswer(
      suspectId,
      question
    );

    return response.json({
      answer: fallbackAnswer,
      clues: discoveredClues,
      usedFallback: true,
    });
  }
});

app.listen(port, () => {
  console.log(
    `AI Detective server running at http://localhost:${port}`
  );

  console.log(`Using Gemini model: ${model}`);
});