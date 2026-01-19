import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Part } from '@google/genai';
import { 
  VisualAnalysisResult, 
  AnalysisSchema, 
  SYSTEM_INSTRUCTION_TEXT,
  AttireType,
  PoseCategory,
  PoseVariant,
  POSE_VARIANTS,
  ATTIRE_LOGO_MAPPING,
  LogoPlacement
} from '../types';

const getAIClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found in environment variables");
    }
    return new GoogleGenAI({ apiKey });
};

// ============================================================================
// SAFETY SETTINGS - CRITICAL: DO NOT MAKE MORE RESTRICTIVE
// ============================================================================

const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper to convert file to base64, with auto-conversion for unsupported types
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
    // List of MIME types directly supported by Gemini API
    const supportedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
  
    // If the file is already a supported type (or close enough), read it directly
    if (supportedTypes.includes(file.type) || file.type === 'image/jpg') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove data url prefix (e.g. "data:image/jpeg;base64,")
          const base64Data = base64String.split(',')[1];
          resolve({
            inlineData: {
              data: base64Data,
              mimeType: file.type === 'image/jpg' ? 'image/jpeg' : file.type,
            },
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  
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
      const base64Data = dataUrl.split(',')[1];
  
      return {
        inlineData: {
          data: base64Data,
          mimeType: 'image/png',
        },
      };
    } catch (error) {
      console.error("Image conversion failed:", error);
      throw new Error(`Unsupported image format: ${file.type || 'Unknown'}. Please use PNG, JPEG, or WEBP.`);
    }
  };

export const checkTransparency = (file: File): Promise<boolean> => {
    // JPEGs never support transparency
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      return Promise.resolve(false);
    }
  
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(false); // Default to false if we can't check
          return;
        }
        ctx.drawImage(img, 0, 0);
        
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          URL.revokeObjectURL(url);
  
          // Scan for any pixel with alpha < 250 (allowing for some compression noise, but essentially looking for transparency)
          // Optimization: checking every 10th pixel to speed up large images is usually sufficient for a logo check
          for (let i = 3; i < data.length; i += 40) {
            if (data[i] < 250) { 
              resolve(true);
              return;
            }
          }
          resolve(false);
        } catch (e) {
          console.warn("Could not check transparency (likely CORS or format issue)", e);
          URL.revokeObjectURL(url);
          resolve(false);
        }
      };
      img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(false);
      };
      img.src = url;
    });
  };

// ============================================================================
// DYNAMIC PROMPT BUILDER FOR LOGO PHYSICALITY
// ============================================================================

function buildLogoPhysicalityPrompt(
  attire: AttireType, 
  logoPlacement: LogoPlacement
): string {
  const { technique, position, size, material, physicalityRules, lightingBehavior } = logoPlacement;
  
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOGO INTEGRATION SPECIFICATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Application Method: ${technique.toUpperCase().replace(/_/g, ' ')}
Placement Location: ${position}
Logo Dimensions: ${size}
Material Composition: ${material}

${physicalityRules}

LIGHTING & MATERIAL INTERACTION:
${lightingBehavior}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORBIDDEN RENDERING BEHAVIORS (STRICTLY AVOID):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ DO NOT render logo as flat 2D sticker overlay
❌ DO NOT use Photoshop-style layer blending
❌ DO NOT ignore fabric/material physical interaction
❌ DO NOT create uniform depth across entire logo
❌ DO NOT make logo appear "pasted on" or artificial

✅ Logo MUST follow garment folds and body contours naturally
✅ Logo MUST exhibit proper material physics (threads, metal, ink)
✅ Logo MUST cast appropriate shadows and receive environmental lighting
✅ Logo MUST show realistic wear patterns where applicable
  `;
}

// ============================================================================
// POSE CONFIGURATION PROMPT BUILDER
// ============================================================================

function buildPosePrompt(pose: { category: PoseCategory; variant: PoseVariant }): string {
  const config = POSE_VARIANTS[pose.category][pose.variant];
  
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POSE CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pose Category: ${config.category.toUpperCase()}
Pose Variant: ${config.variant} - "${config.name}"
Style Description: ${config.description}

BODY POSITIONING:
- Angle & Rotation: ${config.bodyAngle}
- Hand Placement: ${config.handPosition}
- Facial Expression: ${config.expression}

EXECUTION REQUIREMENTS:
✓ Body angle must be exactly as specified
✓ Hand position must be natural and professional
✓ Expression should match the intended mood
✓ Overall posture should appear comfortable, not forced
✓ Weight distribution should look balanced
✓ Eye contact with camera should feel genuine
  `;
}

// ============================================================================
// ATTIRE SPECIFICATION BUILDER
// ============================================================================

function buildAttireSpecification(attire: AttireType): string {
  const specs: Record<AttireType, string> = {
    [AttireType.SUIT]: `
BUSINESS SUIT SPECIFICATION:
- Style: Two-button single-breasted suit jacket
- Color: Charcoal gray or navy blue solid color
- Fit: Modern tailored fit, not baggy or overly tight
- Lapel: Notch lapel, standard width (7-8cm)
- Shirt: White or light blue dress shirt underneath
- Tie: Optional - solid color or subtle pattern if included
- Material: Wool blend with natural drape and texture
- Details: Working buttonholes, functioning pockets
    `,
    [AttireType.SHIRT]: `
DRESS SHIRT SPECIFICATION:
- Style: Long-sleeve button-down dress shirt
- Collar: Spread collar or point collar, crisp and pressed
- Color: White, light blue, or subtle pattern
- Fit: Slim or regular fit, professional appearance
- Material: Cotton or cotton-blend with visible weave
- Details: Buttoned cuffs, chest pocket optional
- Condition: Freshly pressed, no wrinkles
    `,
    [AttireType.POLO]: `
POLO SHIRT SPECIFICATION:
- Style: Short-sleeve polo with 2-3 button placket
- Collar: Ribbed knit collar, standing properly
- Color: Solid color (navy, black, white, or brand color)
- Fit: Athletic or regular fit, not oversized
- Material: Pique cotton knit (waffle texture visible)
- Details: Ribbed sleeve cuffs, side vents at hem
- Condition: Clean, well-maintained appearance
    `,
    [AttireType.TSHIRT]: `
T-SHIRT SPECIFICATION:
- Style: Crew neck short-sleeve t-shirt
- Neckline: Classic crew neck, not stretched
- Color: Solid color (white, black, gray, or brand color)
- Fit: Regular or slightly fitted, casual but neat
- Material: 100% cotton jersey knit
- Details: Simple clean design, no excessive graphics
- Condition: Fresh appearance, no fading or pilling
    `,
    [AttireType.JACKET]: `
JACKET SPECIFICATION:
- Style: Zip-front technical or casual jacket
- Collar: Stand collar or low profile collar
- Color: Navy, black, gray, or neutral earth tone
- Fit: Athletic fit, allows movement
- Material: Technical fabric (nylon/polyester) with slight sheen
- Details: Zip pockets, brand patch placement area
- Condition: Clean modern appearance
    `
  };
  
  return specs[attire];
}

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
// REMOVE BACKGROUND
// ============================================================================

export async function removeBackground(logoFile: File): Promise<string> {
  const ai = getAIClient();
  const imagePart = await fileToGenerativePart(logoFile);

  const prompt = `
Extract the logo from this image and place it on a pure white background (#FFFFFF).
Remove all background elements, keeping only the logo design.
Maintain the original logo proportions and details.
Output should be clean and professional, suitable for corporate use.
  `;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
            parts: [imagePart, { text: prompt }]
        },
        config: {
            safetySettings: SAFETY_SETTINGS,
        }
    });

    const responseParts = response.candidates?.[0]?.content?.parts;
    if (!responseParts || responseParts.length === 0) {
      console.warn('Background removal blocked by safety filters, returning original');
      return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    }

    for (const part of responseParts) {
        if (part.inlineData && part.inlineData.data) {
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
    }
    return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

  } catch (error) {
    console.warn('Background removal failed, using original:', error);
    return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
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
  const parts: any[] = [];
  
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