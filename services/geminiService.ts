import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisSchema, SYSTEM_INSTRUCTION_TEXT, VisualAnalysisResult } from "../types";

// Helper to convert file to base64
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeImage = async (file: File, context: string): Promise<VisualAnalysisResult> => {
  const ai = getAIClient();
  const modelId = "gemini-3-flash-preview"; // Best for multimodal analysis + JSON

  const imagePart = await fileToGenerativePart(file);

  const prompt = `
    Analyze this image in the context of: ${context}.
    Extract attributes and provide visual suggestions based on the strict JSON schema provided.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [imagePart, { text: prompt }]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_TEXT,
        responseMimeType: "application/json",
        responseSchema: AnalysisSchema,
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster analysis response
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");

    const json = JSON.parse(text);

    // Normalizing boolean/string fields from schema limitations if necessary
    // The schema defines is_opened as string enum "true"/"false"/"unknown" to be safe with older parsers,
    // but we map it back to the interface type.
    return {
      ...json,
      detected_attributes: {
        ...json.detected_attributes,
        is_opened: json.detected_attributes.is_opened === "true" ? true :
                   json.detected_attributes.is_opened === "false" ? false : "unknown"
      }
    } as VisualAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const generateEmployeeImage = async (prompt: string): Promise<string> => {
  const ai = getAIClient();
  const modelId = "gemini-2.5-flash-image"; // Requested model for generation

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [{ text: `Professional employee portrait, ${prompt}, neutral background, suitable for corporate identity.` }]
      },
      config: {
          // No responseSchema for image generation models typically
      }
    });

    // Check for image parts
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error("No content generated");

    for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
