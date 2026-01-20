import { GoogleGenAI, Part } from '@google/genai';
import { 
  VisualAnalysisResult, 
  AnalysisSchema, 
  AttireType,
  PoseCategory,
  PoseVariant
} from '../types';
import { 
  SAFETY_SETTINGS, 
  SYSTEM_INSTRUCTION_TEXT, 
  ATTIRE_LOGO_MAPPING 
} from '../constants';
import { 
  buildFullIdentityPrompt, 
  buildLogoPhysicalityPrompt, 
  ANALYSIS_PROMPT_TEMPLATE,
  ENHANCEMENT_PROMPTS,
  EDIT_STRICT_CONSTRAINT_PROMPT,
  REFERENCE_IMAGE_GUIDANCE,
  TECHNICAL_PHOTOGRAPHY_REQUIREMENTS
} from './promptUtils';

const getAIClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      // We throw a specific error that can be caught by the UI
      throw new Error("API_KEY_MISSING"); 
    }
    return new GoogleGenAI({ apiKey });
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const cleanJsonString = (text: string): string => {
  if (!text) return "";
  let cleaned = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
  return cleaned.trim();
};

const fileToGenerativePart = async (file: File): Promise<Part> => {
    const supportedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
    let mimeType = file.type;
    let base64Data = '';
  
    // Optimization: Direct read for supported types to avoid canvas overhead
    if (supportedTypes.includes(file.type) || file.type === 'image/jpg') {
       if (file.type === 'image/jpg') mimeType = 'image/jpeg';
       
       base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve(base64String.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } else {
      // Fallback conversion for unsupported types
      try {
        console.log(`Attempting conversion for file type: ${file.type}`);
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) throw new Error("Canvas context error");
    
        ctx.drawImage(bitmap, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        base64Data = dataUrl.split(',')[1];
        mimeType = 'image/png';
      } catch (error) {
        console.error("Image conversion failed:", error);
        throw new Error(`Unsupported image format: ${file.type}. Please use PNG, JPEG, or WEBP.`);
      }
    }

    return {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };
  };

// ============================================================================
// ANALYZE IMAGE
// ============================================================================

export async function analyzeImage(
  imageFile: File,
  context: string
): Promise<VisualAnalysisResult> {
  const ai = getAIClient();
  const imagePart = await fileToGenerativePart(imageFile);
  const prompt = ANALYSIS_PROMPT_TEMPLATE(context);

  try {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
            parts: [imagePart, { text: prompt }]
        },
        config: {
            safetySettings: SAFETY_SETTINGS,
            systemInstruction: SYSTEM_INSTRUCTION_TEXT,
            responseMimeType: "application/json",
            responseSchema: AnalysisSchema,
            thinkingConfig: { thinkingBudget: 0 },
        }
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");
    
    const cleanedText = cleanJsonString(text);
    const json = JSON.parse(cleanedText);

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
}

// ============================================================================
// GENERATE EMPLOYEE IMAGE
// ============================================================================

export async function generateEmployeeImage(
  prompt: string,
  logoFile: File | null | undefined,
  referenceImage: File | null | undefined,
  attire: AttireType = AttireType.SUIT,
  pose: { category: PoseCategory; variant: PoseVariant } = { 
    category: PoseCategory.NEUTRAL, 
    variant: PoseVariant.A 
  }
): Promise<string> {
  
  if (!referenceImage) {
      throw new Error("Reference Image is REQUIRED. You must upload a photo of the person to preserve their identity.");
  }

  const ai = getAIClient();
  const parts: Part[] = [];
  
  const logoPlacement = ATTIRE_LOGO_MAPPING[attire];

  // Determine effective prompt
  let effectivePrompt = prompt;
  if (!effectivePrompt || effectivePrompt.trim() === '') {
     effectivePrompt = "The exact person depicted in the reference image, maintaining their exact grooming and features.";
  }
  
  // 1. Build Base Prompt
  let fullPrompt = buildFullIdentityPrompt(effectivePrompt, pose, attire);

  // 2. Add Logo (if exists)
  if (logoFile) {
    const logoPart = await fileToGenerativePart(logoFile);
    parts.push(logoPart);
    fullPrompt += `\n${buildLogoPhysicalityPrompt(attire, logoPlacement)}`;
  }

  // 3. Add Reference Image
  const referencePart = await fileToGenerativePart(referenceImage);
  parts.push(referencePart);

  // 4. Append Guidance & Tech Specs
  fullPrompt += REFERENCE_IMAGE_GUIDANCE;
  fullPrompt += TECHNICAL_PHOTOGRAPHY_REQUIREMENTS;

  parts.push({ text: fullPrompt });

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: { parts },
        config: { safetySettings: SAFETY_SETTINGS }
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
}

// ============================================================================
// ENHANCE IMAGE
// ============================================================================

export type EnhancementType = 
  | 'studio_clarity'
  | 'real_estate_interior' 
  | 'culinary_pop' 
  | 'ecommerce_hero'
  | 'golden_hour' 
  | 'modern_bright' 
  | 'vibrant_tropical' 
  | 'nordic_soft' 
  | 'cinematic_drama' 
  | 'blue_hour';

export async function enhanceImage(
  imageFile: File,
  enhancement: EnhancementType
): Promise<string> {
  const ai = getAIClient();
  const imagePart = await fileToGenerativePart(imageFile);
  const promptText = ENHANCEMENT_PROMPTS[enhancement];

  if (!promptText) {
      throw new Error(`Enhancement preset '${enhancement}' not found.`);
  }

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
            parts: [imagePart, { text: promptText }]
        },
        config: { safetySettings: SAFETY_SETTINGS }
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Gemini Enhancement Error:", error);
    throw error;
  }
}

// ============================================================================
// EDIT IMAGE
// ============================================================================

export const editImage = async (file: File, prompt: string): Promise<string> => {
  const ai = getAIClient();
  const imagePart = await fileToGenerativePart(file);
  const promptText = EDIT_STRICT_CONSTRAINT_PROMPT(prompt);

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
            parts: [imagePart, { text: promptText }]
        },
        config: { safetySettings: SAFETY_SETTINGS }
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Gemini Edit Error:", error);
    throw error;
  }
};

// Helper to safely extract image
function extractImageFromResponse(response: any): string {
    const responseParts = response.candidates?.[0]?.content?.parts;
    if (!responseParts || responseParts.length === 0) {
        throw new Error("Content generation blocked by safety filters.");
    }

    for (const part of responseParts) {
        if (part.inlineData && part.inlineData.data) {
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image data found in response");
}