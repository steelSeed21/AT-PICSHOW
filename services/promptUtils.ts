import { AttireType, LogoPlacement, PoseCategory, PoseVariant } from '../types';
import { ATTIRE_LOGO_MAPPING, POSE_VARIANTS } from '../constants';

// ============================================================================
// CORE PROMPT TEMPLATES
// ============================================================================

export const ANALYSIS_PROMPT_TEMPLATE = (context: string) => `
ROLE: Senior Photo Editor & Conversion Rate Optimizer (CRO) Specialist.
CONTEXT: ${context}.

OBJECTIVE:
Analyze the input image to identify SPECIFIC visual flaws that reduce its commercial value.
Your goal is to populate the 'quick_edit_suggestions' list with DIRECT, IMPERATIVE COMMANDS to fix these specific flaws.

ANALYSIS INSTRUCTIONS:
1. Scan for Technical Flaws: Noise, blur, bad white balance, overexposure, underexposure.
2. Scan for Composition Flaws: Crooked horizon, distracting objects, clutter, bad framing.
3. Scan for Aesthetic Flaws: Dull colors, unappetizing food texture, messy background.

OUTPUT REQUIREMENTS for 'quick_edit_suggestions':
- Must be ACTIONABLE VERBS (e.g., "Remove trash bin", "Brighten shadows", "Straighten horizon").
- Must be specific to THIS image (do not suggest "Remove people" if there are no people).
- Limit to 3-5 high-impact fixes that would immediately boost the "Offer Strength".

Provide structured analysis following the required schema.
`;

export const ENHANCEMENT_PROMPTS = {
  // --- UNIVERSAL (CORRECTIVE) ---
  studio_clarity: `
STRICT TASK: Professional Image Restoration & Cleanup.
INPUT: A raw or imperfect source image.
OUTPUT: A pristine, high-resolution commercial asset.

ACTIONS:
1. DENOISE: Remove ISO grain and jpeg artifacts without losing texture details.
2. EXPOSURE: Balance the histogram. Recover highlighted details, lift crushed blacks slightly.
3. COLOR: Neutralize color casts (ensure true whites/grays). Boost vibrance naturally (+10%).
4. SHARPNESS: Apply intelligent sharpening to edges and textures.

CONSTRAINTS:
- ❌ DO NOT change the composition.
- ❌ DO NOT add or remove objects.
- ❌ DO NOT alter facial features or product geometry.
- ✅ PRESERVE exact structural integrity.
  `,

  // --- COMMERCIAL (STANDARDS) ---
  real_estate_interior: `
Apply "Architectural Digest" Interior Standards.
1. PERSPECTIVE: Correct vertical keystoning (walls must be 90° vertical).
2. DYNAMIC RANGE: Balance indoor lighting with outdoor window views (HDR).
3. AMBIANCE: Brighten corners, warm up artificial lights (2700K-3000K).
4. CLARITY: Enhance wood grain, fabric textures, and reflective surfaces.
  `,
  culinary_pop: `
Apply "Michelin Guide" Food Photography Standards.
1. APPETITE APPEAL: Boost saturation of fresh elements (herbs, fruits, sear marks).
2. LIGHTING: Create a "Rembrandt" lighting scheme (directional, soft shadows).
3. FOCUS: Simulate f/2.8 aperture to isolate the dish from the background.
4. FINISH: Enhance gloss/specular highlights on sauces and moisture.
  `,
  ecommerce_hero: `
Apply "Amazon/Shopify" Hero Image Standards.
1. ISOLATION: Ensure the background is clean, neutral, and distraction-free.
2. FORM: Use "Butterfly Lighting" to define the product's 3D shape.
3. ACCURACY: Maximize color fidelity and text readability on labels.
4. SURFACE: Make matte surfaces uniform and glossy surfaces reflective.
  `,

  // --- ATMOSPHERIC (CREATIVE) ---
  golden_hour: `
Style: "Luxury Travel Magazine" - Golden Hour.
Lighting: Warm, low-angle sunlight (approx 3500K).
Mood: Relaxing, expensive, inviting.
Shadows: Long, soft, dramatic.
Best for: Exteriors, patios, portraits.
  `,
  modern_bright: `
Style: "Modern Tech/Startup" - High Key.
Lighting: Bright, even, diffuse white light.
Color: Cool undertones, high brightness, moderate contrast.
Mood: Clean, efficient, optimistic, futuristic.
  `,
  vibrant_tropical: `
Style: "Summer Vacation" - High Saturation.
Colors: Push Teal (Sky/Water) and Orange (Skin/Sand) contrast.
Lighting: Hard, direct noon sunlight simulation.
Mood: Energetic, hot, exciting.
  `,
  nordic_soft: `
Style: "Scandi Minimalist" - Desaturated.
Lighting: Overcast, ultra-soft window light.
Color: Low saturation, slate blues, crisp whites, charcoal grays.
Mood: Calm, silent, expensive, organic.
  `,
  cinematic_drama: `
Style: "Blockbuster Movie" - Color Grade.
Grading: Teal/Orange split tone.
Contrast: High (Crushed blacks, bright highlights).
Lighting: Chiaroscuro effect (strong play of light and dark).
Mood: Intense, emotional, premium.
  `,
  blue_hour: `
Style: "Luxury Evening" - Twilight.
Sky: Deep royal blue/purple gradient.
Practical Lights: Warm glow from windows/lamps (contrast against blue sky).
Mood: Magical, cozy, premium nightlife.
  `
};

export const EDIT_STRICT_CONSTRAINT_PROMPT = (userPrompt: string) => {
  // Detect geometric keywords
  const isGeometric = /straighten|align|crop|horizon|rotate|tilt|level|center|perspective|skew|distortion/i.test(userPrompt);

  // If geometric keywords are present, inject strong overrides
  const geometricHeader = isGeometric ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ GEOMETRIC TRANSFORMATION REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The user has requested a spatial adjustment (Rotation/Cropping/Perspective).
YOU MUST:
1. ROTATE the image grid to align vertical/horizontal lines (e.g., fix crooked horizon).
2. CROP strictly to remove any black/empty edges caused by rotation.
3. DISREGARD any previous instructions to "preserve composition" or "maintain framing".
4. RE-RENDER the entire scene with the new corrected perspective.
` : '';

  // If NOT geometric, we enforce composition preservation to prevent unwanted changes
  const compositionConstraint = !isGeometric 
    ? '5. COMPOSITION: Preserve original framing and composition unless explicitly asked to change it.' 
    : '5. COMPOSITION: You are AUTHORIZED to change framing/cropping to achieve the geometric correction.';

  return `
ROLE: High-End Commercial Retoucher & Visual Artist.
TASK: Execute the SPECIFIC user request with HIGH VISUAL IMPACT and precision.
USER REQUEST: "${userPrompt}"

${geometricHeader}

EXECUTION GUIDELINES:
1. IMPACT: The requested change must be clearly visible and definitive.
2. CLARITY: Maintain razor-sharp details and high micro-contrast.
3. REALISM: Use photorealistic lighting and material physics.
4. SCOPE: Modify ONLY what is requested.
${compositionConstraint}

TECHNICAL SPECS:
- High Dynamic Range (HDR)
- Zero Noise
- Crisp Textures
- Professional Color Grading
`;
};

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