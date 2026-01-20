import { Type, Schema } from "@google/genai";

export enum AppMode {
  OFFER_BOOSTER = 'OFFER_BOOSTER',
  IDENTITY_BUILDER = 'IDENTITY_BUILDER'
}

// ============================================================================
// APP STATE TYPES
// ============================================================================

export interface HistoryItem {
  id: string; // Unique identifier for stable rendering and updates
  file: File;
  url: string;
  analysis: VisualAnalysisResult | null;
  tips: string[];
  timestamp: number;
}

export interface ProcessingState {
  isAnalyzing: boolean;
  isGenerating: boolean;
  isEnhancing: boolean;
  isEditing: boolean;
}

// ============================================================================
// ENHANCEMENT SYSTEM
// ============================================================================

export type EnhancementCategory = 'UNIVERSAL' | 'COMMERCIAL' | 'ATMOSPHERE';

export interface EnhancementPreset {
  id: string;
  label: string;
  description: string;
  icon: string;
  category: EnhancementCategory;
  tags: string[]; // Keywords to match against analysis for recommendations
}

// ============================================================================
// POSE SYSTEM
// ============================================================================

export enum PoseCategory {
  NEUTRAL = 'neutral',
  POWER = 'power',
  RELAXED = 'relaxed',
  ANGLE = 'angle',
  CASUAL = 'casual'
}

export enum PoseVariant {
  A = 'A',
  B = 'B',
  C = 'C'
}

export interface PoseConfig {
  category: PoseCategory;
  variant: PoseVariant;
  name: string;
  description: string;
  handPosition: string;
  bodyAngle: string;
  expression: string;
  icon: string;
}

// ============================================================================
// ATTIRE & LOGO
// ============================================================================

export enum AttireType {
  SUIT = 'suit',
  SHIRT = 'shirt',
  POLO = 'polo',
  TSHIRT = 'tshirt',
  JACKET = 'jacket'
}

export enum LogoTechnique {
  EMBROIDERED_PIN = 'embroidered_pin',
  CHEST_EMBROIDERY = 'chest_embroidery',
  SCREEN_PRINT = 'screen_print',
  WOVEN_PATCH = 'woven_patch',
  ENGRAVED_BADGE = 'engraved_badge'
}

export interface LogoPlacement {
  technique: LogoTechnique;
  position: string;
  size: string;
  material: string;
  physicalityRules: string;
  lightingBehavior: string;
}

export interface IdentityConfigState {
  pose: { category: PoseCategory; variant: PoseVariant };
  attire: AttireType;
  logoFile: File | null;
}

// ============================================================================
// VISUAL ANALYSIS
// ============================================================================

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
  pose_preset?: string | null;
  clothing_type?: string | null;
  brand_application?: "ENAMEL_PIN" | "WOVEN_PATCH" | "DIRECT_PRINT" | null;
  logo_placement?: string | null;
  detected_attributes: DetectedAttributes;
  visual_suggestions: VisualSuggestion[];
  quick_edit_suggestions: string[];
  constraints_respected: boolean;
}

// Gemini Schema Definition for the Analysis Result
export const AnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    analysis: { type: Type.STRING },
    pose_preset: { type: Type.STRING, nullable: true },
    clothing_type: { type: Type.STRING, nullable: true },
    brand_application: { type: Type.STRING, enum: ["ENAMEL_PIN", "WOVEN_PATCH", "DIRECT_PRINT"], nullable: true },
    logo_placement: { type: Type.STRING, nullable: true },
    detected_attributes: {
      type: Type.OBJECT,
      properties: {
        product_state: { type: Type.STRING, nullable: true },
        expiration_date: { type: Type.STRING, nullable: true },
        size: { type: Type.STRING, enum: ["SMALL", "LARGE", "UNKNOWN"] },
        is_opened: { type: Type.STRING, enum: ["true", "false", "unknown"] },
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
    quick_edit_suggestions: {
      type: Type.ARRAY,
      description: "List of 5-6 short, actionable 2-4 word phrases to improve this specific image (e.g., 'Fix white balance', 'Remove glare').",
      items: { type: Type.STRING }
    },
    constraints_respected: { type: Type.BOOLEAN }
  },
  required: ["analysis", "detected_attributes", "visual_suggestions", "quick_edit_suggestions", "constraints_respected"]
};