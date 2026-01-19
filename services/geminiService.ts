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
  buildAttireSpecification, 
  buildLogoPhysicalityPrompt, 
  buildPosePrompt 
} from './promptUtils';

const getAIClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found in environment variables");
    }
    return new GoogleGenAI({ apiKey });
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper to convert file to base64, with auto-conversion for unsupported types
const fileToGenerativePart = async (file: File): Promise<Part> => {
    // List of MIME types directly supported by Gemini API
    const supportedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
    let mimeType = file.type;
    let base64Data = '';
  
    // If the file is already a supported type (or close enough), read it directly
    if (supportedTypes.includes(file.type) || file.type === 'image/jpg') {
       // Convert jpg to jpeg just in case
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
      // If not supported (e.g. image/avif, or empty type), attempt to convert to PNG
      try {
        console.log(`Attempting conversion for file type: ${file.type}`);
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error("Could not get canvas context for image conversion");
        }
    
        ctx.drawImage(bitmap, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        base64Data = dataUrl.split(',')[1];
        mimeType = 'image/png';
      } catch (error) {
        console.error("Image conversion failed:", error);
        throw new Error(`Unsupported image format: ${file.type || 'Unknown'}. Please use PNG, JPEG, or WEBP.`);
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

  const prompt = `Analyze this image in the context of: ${context}. 
Provide structured analysis following the required schema.`;

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
    
    // Normalizing boolean/string fields from schema limitations
    const json = JSON.parse(text);
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
// GENERATE EMPLOYEE IMAGE - ENHANCED WITH MULTI-VARIANT POSE & SMART LOGO
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
  
  // Get logo placement configuration for selected attire
  const logoPlacement = ATTIRE_LOGO_MAPPING[attire];

  // Determine effective prompt
  let effectivePrompt = prompt;
  if (!effectivePrompt || effectivePrompt.trim() === '') {
     effectivePrompt = "The exact person depicted in the reference image, maintaining their exact grooming and features.";
  }
  
  // Build comprehensive prompt
  let fullPrompt = `
╔════════════════════════════════════════════════════════════════════╗
║  CORPORATE EMPLOYEE PORTRAIT GENERATION REQUEST                   ║
╚════════════════════════════════════════════════════════════════════╝

BASE DESCRIPTION:
${effectivePrompt}

${buildPosePrompt(pose)}

${buildAttireSpecification(attire)}
`;

  // Add logo integration if provided
  if (logoFile) {
    const logoPart = await fileToGenerativePart(logoFile);
    parts.push(logoPart);
    fullPrompt += `\n${buildLogoPhysicalityPrompt(attire, logoPlacement)}`;
  }

  // Add reference image (MANDATORY)
  const referencePart = await fileToGenerativePart(referenceImage);
  parts.push(referencePart);

  fullPrompt += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REFERENCE PHOTO GUIDANCE - STRICT IDENTITY & GROOMING COPY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRIMARY DIRECTIVE:
You are to generate a portrait of the SPECIFIC INDIVIDUAL shown in the reference image.
You must transport this exact person into the new pose and attire defined above.

CRITICAL GROOMING & FEATURES CHECKLIST:
1.  **FACIAL HAIR / GROOMING**:
    *   Look at the reference face immediately.
    *   Is the person clean-shaven? -> **OUTPUT MUST BE CLEAN-SHAVEN.**
    *   Does the person have a specific beard style? -> **OUTPUT MUST MATCH EXACTLY.**
    *   **DO NOT** add a mustache or beard if the reference face is smooth.
    *   **DO NOT** make the person look "older" or "more corporate" by adding facial hair.

2.  **FACIAL STRUCTURE**:
    *   Maintain exact eye shape, nose shape, and jawline.
    *   Maintain skin tone and texture age.

3.  **HAIR**:
    *   Match the hair color, texture, and general style/length from reference.

CONTRADICTION HANDLING:
If the "Corporate Employee" context implies a beard but the Reference Image is clean-shaven, **OBEY THE REFERENCE IMAGE**.
The Reference Image is the source of truth for the person's physical appearance.
    `;

  // Add technical photography requirements
  fullPrompt += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECHNICAL PHOTOGRAPHY REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMAGE FORMAT:
- Style: Professional corporate headshot
- Framing: Head and shoulders, upper torso visible
- Orientation: Vertical portrait orientation

LIGHTING SETUP:
- Key Light: Soft diffused light at 45° angle from subject
- Fill Light: Subtle fill to reduce harsh shadows (ratio 3:1)
- Hair Light: Optional backlight to separate from background
- Overall: Soft, flattering, professional studio lighting

BACKGROUND:
- Style: Blurred modern office environment (bokeh effect)
- Color: Neutral tones (gray, beige, soft blue)
- Depth: Clear separation between subject and background
- Details: Subtle hints of office furniture/windows out of focus

CAMERA SETTINGS (SIMULATED):
- Depth of Field: f/2.8 equivalent (subject sharp, background soft)
- Focal Length: 85mm portrait lens equivalent
- Perspective: Slight downward angle (camera at eye level or slightly above)

COLOR GRADING:
- Skin Tones: Natural, healthy, properly white-balanced
- White Balance: Slightly cool (5500K-6000K) for corporate feel
- Saturation: Natural, not oversaturated
- Contrast: Moderate contrast, professional appearance

QUALITY STANDARDS:
- Resolution: High detail suitable for print at 300 DPI
- Noise: Minimal grain/noise, clean professional image
- Sharpness: Tack-sharp focus on eyes and face
- Overall: Photorealistic, indistinguishable from professional photography

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL QUALITY CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before finalizing the image, verify:
☑ Pose matches specified configuration exactly
☑ Attire is appropriate and well-fitted
☑ Logo integration is photorealistic (if applicable)
☑ GROOMING MATCHES REFERENCE (Check facial hair again!)
☑ Lighting is professional and flattering
☑ Background is appropriately blurred
☑ Overall image looks like professional studio photography
☑ No artificial or "AI-generated" appearance
  `;

  parts.push({ text: fullPrompt });

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: { parts },
        config: { safetySettings: SAFETY_SETTINGS }
    });

    const responseParts = response.candidates?.[0]?.content?.parts;
    if (!responseParts || responseParts.length === 0) {
        throw new Error("Content generation blocked by safety filters. Please try a different photo or prompt.");
    }

    for (const part of responseParts) {
        if (part.inlineData && part.inlineData.data) {
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
}

// ============================================================================
// ENHANCE IMAGE (FOR OFFER BOOSTER MODE)
// ============================================================================

export async function enhanceImage(
  imageFile: File,
  enhancement: 'golden_hour' | 'declutter' | 'modern_bright'
): Promise<string> {
  const ai = getAIClient();
  const imagePart = await fileToGenerativePart(imageFile);

  const enhancementPrompts = {
    golden_hour: `
Transform this image to have a warm golden hour lighting effect.
Add warm orange/amber tones, soft diffused sunlight, long shadows.
Enhance atmospheric quality while maintaining natural appearance.
Optimize for hospitality marketing and booking appeal.
    `,
    declutter: `
Remove visual clutter and distracting elements from this image.
Simplify composition, remove unnecessary objects in background.
Enhance focus on main subject, create cleaner more professional look.
Maintain natural appearance, avoid over-processing.
    `,
    modern_bright: `
Enhance this image with modern bright clean aesthetic.
Increase brightness and clarity, boost vibrant colors slightly.
Add crisp clean modern feel suitable for contemporary marketing.
Maintain natural appearance, avoid oversaturation.
    `
  };

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
            parts: [imagePart, { text: enhancementPrompts[enhancement] }]
        },
        config: { safetySettings: SAFETY_SETTINGS }
    });

    const responseParts = response.candidates?.[0]?.content?.parts;
    if (!responseParts || responseParts.length === 0) {
        throw new Error("Enhancement blocked by safety filters.");
    }

    for (const part of responseParts) {
        if (part.inlineData && part.inlineData.data) {
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No enhanced image generated.");
  } catch (error) {
    console.error("Gemini Enhancement Error:", error);
    throw error;
  }
}

// ============================================================================
// EDIT IMAGE (GENERIC FALLBACK FOR CUSTOM PROMPTS)
// ============================================================================

export const editImage = async (file: File, prompt: string): Promise<string> => {
  const ai = getAIClient();
  const imagePart = await fileToGenerativePart(file);

  const strictConstraints = `
    ROLE: Professional Photo Editor.
    TASK: Edit the image according to the User Request.
    USER REQUEST: ${prompt}
    REQUIREMENTS:
    - High resolution and photorealistic.
    - Professional lighting.
    - Maintain the scene integrity unless asked to change.
  `;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
            parts: [imagePart, { text: strictConstraints }]
        },
        config: { safetySettings: SAFETY_SETTINGS }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0) {
         throw new Error("Edit generation blocked by safety filters.");
    }

    for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image data found in edit response");
  } catch (error) {
    console.error("Gemini Edit Error:", error);
    throw error;
  }
};