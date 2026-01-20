import { AttireType, LogoPlacement, PoseCategory, PoseVariant } from '../types';
import { ATTIRE_LOGO_MAPPING, POSE_VARIANTS } from '../constants';

// ============================================================================
// CORE PROMPT TEMPLATES
// ============================================================================

export const ANALYSIS_PROMPT_TEMPLATE = (context: string) => `
Analyze this image in the context of: ${context}. 
Provide structured analysis following the required schema.
`;

export const ENHANCEMENT_PROMPTS = {
  // --- UNIVERSAL ---
  studio_clarity: `
Apply a universal "High-End Studio" enhancement to this image.
1. CLARITY: Remove noise and compression artifacts. Sharpen key edges slightly.
2. LIGHTING: Balance exposure (fix overexposed highlights/crushed blacks). Ensure the subject is well-lit.
3. COLOR: Correct white balance to be neutral (remove unwanted color casts). Boost vibrance subtly (10%).
4. OUTPUT: The image should look like it was shot on a high-resolution professional camera. Keep the scene natural, just "better".
  `,

  // --- COMMERCIAL ---
  real_estate_interior: `
Apply professional Real Estate Photography standards to this image.
1. GEOMETRY: Visually straighten vertical lines (architectural correction) to eliminate keystone distortion.
2. LIGHTING: Apply an HDR effect to balance bright windows with darker interiors. Brighten corners.
3. COLOR: Ensure walls look clean and whites are pure. Warm up the interior lighting slightly for coziness.
4. COMPOSITION: Make the space feel spacious and airy.
  `,
  culinary_pop: `
Apply high-end Food Photography styling to this image.
1. TEXTURE: Emphasize the texture of the food (crispness, gloss, freshness). Add specular highlights to liquids/sauces.
2. COLOR: Boost saturation of fresh ingredients (greens, reds) to look appetizing.
3. DEPTH: Simulate a mild depth of field to separate the hero dish from the background.
4. LIGHTING: Use soft, directional "window light" from the side.
  `,
  ecommerce_hero: `
Apply Commercial Product Photography standards.
1. ISOLATION: Clean up the background to be neutral and non-distracting (smooth studio look).
2. LIGHTING: Use even, softbox-style lighting to eliminate harsh shadows and highlight product form.
3. FIDELITY: Ensure accurate product color representation with high contrast and clarity.
4. MATERIALS: Enhance material properties (metal looks metallic, glass looks clear).
  `,

  // --- ATMOSPHERIC ---
  golden_hour: `
Transform this image to have a warm golden hour lighting effect.
Add warm orange/amber tones, soft diffused sunlight, long shadows.
Enhance atmospheric quality while maintaining natural appearance.
Optimize for hospitality marketing and booking appeal.
  `,
  modern_bright: `
Enhance this image with modern bright clean aesthetic.
Increase brightness and clarity, boost vibrant colors slightly.
Add crisp clean modern feel suitable for contemporary marketing.
Maintain natural appearance, avoid oversaturation.
  `,
  vibrant_tropical: `
Transform this image with a vibrant, punchy color palette suitable for tropical or summer marketing.
Boost saturation specifically in blues (sky/water) and greens (foliage).
Increase contrast slightly to make colors pop.
Ensure lighting looks like bright, direct midday sun.
  `,
  nordic_soft: `
Apply a Nordic/Scandi minimalist aesthetic to this image.
Use cool, slightly desaturated tones.
Soften the lighting to create a diffuse, airy look with low contrast.
Ensure whites are crisp and neutral.
Create a calm, serene, and sophisticated atmosphere.
  `,
  cinematic_drama: `
Apply a cinematic color grade to this image.
Increase contrast to create deep, rich shadows and distinct highlights.
Use a subtle teal/orange split-tone (warmer highlights, cooler shadows).
Focus on mood, depth, and atmospheric lighting.
Make the image feel expensive and high-end.
  `,
  blue_hour: `
Transform this image to simulate "Blue Hour" lighting (just after sunset).
Cast a deep, rich blue tone over the sky and environment.
If there are artificial lights (windows, streetlamps), ensure they glow warmly against the cool background.
Create a magical, evening twilight atmosphere.
  `
};

export const EDIT_STRICT_CONSTRAINT_PROMPT = (userPrompt: string) => `
ROLE: Professional Photo Editor.
TASK: Edit the image according to the User Request.
USER REQUEST: ${userPrompt}
REQUIREMENTS:
- High resolution and photorealistic.
- Professional lighting.
- Maintain the scene integrity unless asked to change.
`;

// ============================================================================
// DYNAMIC PROMPT BUILDERS (IDENTITY BUILDER)
// ============================================================================

export function buildLogoPhysicalityPrompt(
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

export function buildPosePrompt(pose: { category: PoseCategory; variant: PoseVariant }): string {
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

export function buildAttireSpecification(attire: AttireType): string {
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

export function buildFullIdentityPrompt(
  effectivePrompt: string,
  pose: { category: PoseCategory; variant: PoseVariant },
  attire: AttireType
): string {
  return `
╔════════════════════════════════════════════════════════════════════╗
║  CORPORATE EMPLOYEE PORTRAIT GENERATION REQUEST                   ║
╚════════════════════════════════════════════════════════════════════╝

BASE DESCRIPTION:
${effectivePrompt}

${buildPosePrompt(pose)}

${buildAttireSpecification(attire)}
`;
}

export const REFERENCE_IMAGE_GUIDANCE = `
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

export const TECHNICAL_PHOTOGRAPHY_REQUIREMENTS = `
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