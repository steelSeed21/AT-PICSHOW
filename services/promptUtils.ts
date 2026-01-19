import { AttireType, LogoPlacement, PoseCategory, PoseVariant } from '../types';
import { ATTIRE_LOGO_MAPPING, POSE_VARIANTS } from '../constants';

// ============================================================================
// DYNAMIC PROMPT BUILDER FOR LOGO PHYSICALITY
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

// ============================================================================
// POSE CONFIGURATION PROMPT BUILDER
// ============================================================================

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

// ============================================================================
// ATTIRE SPECIFICATION BUILDER
// ============================================================================

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