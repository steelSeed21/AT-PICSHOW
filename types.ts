import { Type, Schema } from "@google/genai";

export enum AppMode {
  OFFER_BOOSTER = 'OFFER_BOOSTER',
  IDENTITY_BUILDER = 'IDENTITY_BUILDER'
}

export interface DetectedAttributes {
  product_state: string | null;
  expiration_date: string | null;
  size: "SMALL" | "LARGE" | "UNKNOWN";
  is_opened: boolean | "unknown";
  content_level_percent: number | null;
}

export interface VisualSuggestion {
  type: string;
  description: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
}

export interface VisualAnalysisResult {
  analysis: string;
  detected_attributes: DetectedAttributes;
  visual_suggestions: VisualSuggestion[];
  constraints_respected: boolean;
}

// Gemini Schema Definition for the Analysis Result
export const AnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    analysis: { type: Type.STRING },
    detected_attributes: {
      type: Type.OBJECT,
      properties: {
        product_state: { type: Type.STRING, nullable: true },
        expiration_date: { type: Type.STRING, nullable: true },
        size: { type: Type.STRING, enum: ["SMALL", "LARGE", "UNKNOWN"] },
        is_opened: { type: Type.STRING, enum: ["true", "false", "unknown"] }, // API schema enum limitation, mapped manually
        content_level_percent: { type: Type.NUMBER, nullable: true }
      },
      required: ["size", "is_opened"]
    },
    visual_suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          description: { type: Type.STRING },
          risk_level: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] }
        },
        required: ["type", "description", "risk_level"]
      }
    },
    constraints_respected: { type: Type.BOOLEAN }
  },
  required: ["analysis", "detected_attributes", "visual_suggestions", "constraints_respected"]
};

export const SYSTEM_INSTRUCTION_TEXT = `
ROLE:
You are a Senior AI Visual Analyst and Prompt Executor specialized in Google Gemini models (especially Gemini 2.5 Flash Image) and AI-assisted image transformation pipelines. You operate as a deterministic component of a larger React + TypeScript application and must strictly follow provided data structures and constraints.

CONTEXT:
You work inside the project "Automate Travel – AI Visual Suite", a premium SPA for the travel and corporate industry.
Your tasks support two operational modes:
1. Offer Booster – AI-based enhancement of hotel and landscape images (lighting, atmosphere, color grading) without altering geometry.
2. Identity Builder – AI-assisted generation and standardization of employee images, combined with precise logo application that simulates real-world materials, perspective, and physical behavior.

You do NOT design layouts or guess positions. All positioning logic, transformations, and material behavior are defined externally by the application logic (Pose Library, Logo Zones, TransformationConfig).

ATTRIBUTES TO TRACK (ALWAYS REQUIRED):
For every analysis or suggestion, explicitly track and return (if applicable):
- product_state (e.g. new / used / unknown)
- expiration_date (ISO format or null if not visible)
- size (SMALL / LARGE / UNKNOWN)
- is_opened (true / false / unknown)
- content_level_percent (0–100 or null if not determinable)

If attributes are not visible in the image or input data, you MUST return null or "unknown" — never guess.

FORMATTING:
All outputs MUST be returned in strict JSON format.

CONSTRAINTS:
- Do NOT guess dates, positions, materials, or proportions.
- Do NOT alter body geometry, clothing cuts, or camera perspective.
- Do NOT override hardcoded TransformationConfig, PoseDefinition, or LogoZone data.
- Do NOT hallucinate unavailable attributes.
- Do NOT output anything outside the defined JSON schema.
- If data is missing or unclear, explicitly state null or "unknown".

FINAL RULE:
You are a deterministic execution layer, not a creative director.
Accuracy, constraint compliance, and structural consistency are more important than creativity.
`;
