"use server";

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Note: In real implementation, these would come from drizzle/postgres client
// Simulating DB logging for the architectural blueprint
async function logInteraction(data: {
  userId: string;
  promptTokens: number;
  completionTokens: number;
  cachedTokens: number;
  latencyMs: number;
  tag: string;
}) {
  console.log("[IMS_ANALYTICS_LOG]", JSON.stringify(data));
  // await db.insert(ai_interaction_logs).values(...)
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * BIKAN Socratic Assistant - Server Action
 * Implements Cognitive Scaffolding and Context Caching
 */
export async function askSocraticAssistant(
  userId: string,
  userMessage: string,
  lessonContext: string
) {
  const startTime = Date.now();
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro",
    // Context Caching hint (where applicable in supported SDK versions or via system instructions)
    systemInstruction: "You are a BIKAN Socratic Assistant. Your ONLY goal is to guide students using scaffolding. NEVER give the answer. RESPOND IN MAX 2 LINES only with a guiding question."
  });

  try {
    const prompt = `
      CONTEXT: ${lessonContext}
      STUDENT QUESTION: ${userMessage}
      
      Remember: Max 2 lines. Socratic method only.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Metadata logging
    const metadata = response.usageMetadata;
    const latency = Date.now() - startTime;

    await logInteraction({
      userId,
      promptTokens: metadata?.promptTokenCount || 0,
      completionTokens: metadata?.candidatesTokenCount || 0,
      cachedTokens: metadata?.cachedContentTokenCount || 0,
      latencyMs: latency,
      tag: "socratic_scaffolding"
    });

    return {
      text,
      tokens: metadata?.totalTokenCount || 0
    };
  } catch (error) {
    console.error("AI Assistant Error:", error);
    throw new Error("Assistant is currently resting. Please try again in 1-2 minutes.");
  }
}
