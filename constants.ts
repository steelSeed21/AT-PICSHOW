import { AttireType, LogoTechnique, LogoPlacement, PoseCategory, PoseVariant, PoseConfig, EnhancementPreset } from './types';
import { HarmCategory, HarmBlockThreshold } from '@google/genai';

// ============================================================================
// SYSTEM PROMPTS & SETTINGS
// ============================================================================

export const SAFETY_SETTINGS = [
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

export const SYSTEM_INSTRUCTION_TEXT = `
ROLE:
You are a Senior AI Visual Analyst and Identity Standardization Engine specialized in Google Gemini models (especially Gemini 2.5 Flash Image).
You operate as a deterministic execution layer inside a React + TypeScript SPA.
Your responsibility is to generate and analyze professional employee imagery with strict visual consistency, predefined poses, controlled clothing presets, and physically realistic brand integration.

You are NOT a creative director.
You do NOT guess.
You follow rules, schemas, and real-world standards.

CONTEXT:
You work inside the project "Automate Travel – AI Visual Suite", specifically within the Identity Builder (IB) module.

The Identity Builder is used to:
- generate standardized employee images
- ensure consistent corporate appearance
- integrate branding directly into clothing using real-world garment logic
- eliminate the “sticker effect” by treating logos as physical elements

All positioning logic, pose definitions, and transformations are externally controlled by the application.
You must respect hardcoded pose libraries, logo zones, and transformation data.

ATTRIBUTES TO TRACK (ALWAYS REQUIRED):
For every analysis or suggestion, explicitly track and return (if applicable):

- product_state (e.g. new / used / unknown)
- expiration_date (ISO 8601 string or null if not visible)
- size (SMALL / LARGE / UNKNOWN)
- is_opened (true / false / unknown)
- content_level_percent (0–100 or null if not determinable)

If an attribute is not visible or inferable, return null or "unknown".
Never guess.
`;

export const DEFAULT_TIPS = [
  "Remove clutter",
  "Blue sky fix",
  "Warm lighting",
  "Remove tourists",
  "Sharpen details"
];

// ============================================================================
// POSE CONFIGURATION
// ============================================================================

export const POSE_VARIANTS: Record<PoseCategory, Record<PoseVariant, PoseConfig>> = {
  [PoseCategory.NEUTRAL]: {
    [PoseVariant.A]: {
      category: PoseCategory.NEUTRAL,
      variant: PoseVariant.A,
      name: "Classic Corporate",
      description: "Traditional professional headshot",
      handPosition: "Arms at sides, natural relaxed position",
      bodyAngle: "Straight-on, 0° rotation, centered",
      expression: "Neutral professional smile, approachable",
      icon: "👔"
    },
    [PoseVariant.B]: {
      category: PoseCategory.NEUTRAL,
      variant: PoseVariant.B,
      name: "Approachable",
      description: "Warm corporate presence",
      handPosition: "Hands clasped in front at waist level",
      bodyAngle: "Slight 5° left rotation, open stance",
      expression: "Warm welcoming smile, friendly demeanor",
      icon: "🤝"
    },
    [PoseVariant.C]: {
      category: PoseCategory.NEUTRAL,
      variant: PoseVariant.C,
      name: "Executive",
      description: "Senior leadership style",
      handPosition: "One hand in pocket, other relaxed at side",
      bodyAngle: "Subtle 10° right rotation, confident",
      expression: "Calm confident demeanor, slight smile",
      icon: "💼"
    }
  },
  
  [PoseCategory.POWER]: {
    [PoseVariant.A]: {
      category: PoseCategory.POWER,
      variant: PoseVariant.A,
      name: "Authority",
      description: "Confident leadership stance",
      handPosition: "Arms crossed over chest, strong posture",
      bodyAngle: "Direct forward facing, commanding presence",
      expression: "Strong decisive gaze, serious confidence",
      icon: "💪"
    },
    [PoseVariant.B]: {
      category: PoseCategory.POWER,
      variant: PoseVariant.B,
      name: "Confidence",
      description: "Dynamic assertive pose",
      handPosition: "Hands on hips, elbows out to sides",
      bodyAngle: "Slight 15° angle, dynamic positioning",
      expression: "Assertive energetic expression",
      icon: "⚡"
    },
    [PoseVariant.C]: {
      category: PoseCategory.POWER,
      variant: PoseVariant.C,
      name: "Visionary",
      description: "Action-oriented visionary",
      handPosition: "One arm extended forward, pointing or gesturing",
      bodyAngle: "20° turn, forward-leaning action stance",
      expression: "Inspirational driven look, focused",
      icon: "🎯"
    }
  },

  [PoseCategory.RELAXED]: {
    [PoseVariant.A]: {
      category: PoseCategory.RELAXED,
      variant: PoseVariant.A,
      name: "Leaning",
      description: "Comfortable approachable style",
      handPosition: "Leaning on surface, one hand supporting body weight",
      bodyAngle: "30° lean to side, comfortable relaxed",
      expression: "Easy-going friendly smile, relaxed",
      icon: "😊"
    },
    [PoseVariant.B]: {
      category: PoseCategory.RELAXED,
      variant: PoseVariant.B,
      name: "Seated",
      description: "Conversational ease",
      handPosition: "Hands resting on lap or chair armrest",
      bodyAngle: "Reclined 20° back, at ease in chair",
      expression: "Open conversational demeanor, genuine",
      icon: "🪑"
    },
    [PoseVariant.C]: {
      category: PoseCategory.RELAXED,
      variant: PoseVariant.C,
      name: "Standing Ease",
      description: "Natural relaxed standing",
      handPosition: "Thumbs in pockets, fingers visible outside",
      bodyAngle: "Weight on one leg, hip slightly cocked",
      expression: "Approachable genuine smile, authentic",
      icon: "🧘"
    }
  },

  [PoseCategory.ANGLE]: {
    [PoseVariant.A]: {
      category: PoseCategory.ANGLE,
      variant: PoseVariant.A,
      name: "Profile Power",
      description: "Classic profile strength",
      handPosition: "Arms at sides, hands visible in frame",
      bodyAngle: "45° turn showing strong profile view",
      expression: "Focused determined look, strong jawline",
      icon: "📐"
    },
    [PoseVariant.B]: {
      category: PoseCategory.ANGLE,
      variant: PoseVariant.B,
      name: "Over-Shoulder",
      description: "Engaging look-back pose",
      handPosition: "One hand adjusting jacket collar or lapel",
      bodyAngle: "60° turn, looking back over shoulder",
      expression: "Engaging intriguing expression, eye contact",
      icon: "👁️"
    },
    [PoseVariant.C]: {
      category: PoseCategory.ANGLE,
      variant: PoseVariant.C,
      name: "Dynamic Turn",
      description: "Active communication pose",
      handPosition: "One hand in motion, mid-gesture naturally",
      bodyAngle: "70° rotation, captured mid-movement",
      expression: "Active communicative, speaking energy",
      icon: "🗣️"
    }
  },

  [PoseCategory.CASUAL]: {
    [PoseVariant.A]: {
      category: PoseCategory.CASUAL,
      variant: PoseVariant.A,
      name: "Coffee Break",
      description: "Relatable everyday moment",
      handPosition: "Holding coffee cup or mug casually",
      bodyAngle: "Slight forward lean, informal stance",
      expression: "Relaxed personable smile, authentic",
      icon: "☕"
    },
    [PoseVariant.B]: {
      category: PoseCategory.CASUAL,
      variant: PoseVariant.B,
      name: "Thinking",
      description: "Thoughtful professional",
      handPosition: "Hand on chin or temple, contemplative gesture",
      bodyAngle: "15° head tilt, thoughtful positioning",
      expression: "Intelligent reflective look, considering",
      icon: "🤔"
    },
    [PoseVariant.C]: {
      category: PoseCategory.CASUAL,
      variant: PoseVariant.C,
      name: "Collaborative",
      description: "Team-oriented openness",
      handPosition: "Arms open in welcoming gesture, palms visible",
      bodyAngle: "Forward lean, engaging with viewer",
      expression: "Team-oriented inclusive smile, warm",
      icon: "🤗"
    }
  }
};

// ============================================================================
// ATTIRE & LOGO MAPPING
// ============================================================================

export const ATTIRE_LOGO_MAPPING: Record<AttireType, LogoPlacement> = {
  [AttireType.SUIT]: {
    technique: LogoTechnique.EMBROIDERED_PIN,
    position: "Left lapel, 3cm below notch point",
    size: "15mm diameter circular pin, subtle professional",
    material: "Brushed metal pin with enamel inlay, secured with butterfly clasp on reverse",
    physicalityRules: `
CRITICAL RENDERING REQUIREMENTS:
- Metal surface with subtle brushed texture (NOT mirror polish)
- Slight protrusion 1-2mm from fabric surface creating visible shadow
- Pin casts soft shadow on lapel fabric beneath
- Enamel areas show glass-like smooth finish with depth
- Metal edges catch environmental light highlights
- Butterfly clasp slightly visible from side viewing angles
- Pin sits at natural angle following lapel curve
- Metal shows micro-scratches appropriate for worn business accessory
    `,
    lightingBehavior: "Anisotropic specular highlights on brushed metal rim, diffuse reflection on enamel center"
  },

  [AttireType.SHIRT]: {
    technique: LogoTechnique.EMBROIDERED_PIN,
    position: "Left chest pocket area, centered 2cm above pocket edge",
    size: "18mm diameter pin, professional visibility",
    material: "Matte finish metal pin with silk-screened logo design, magnetic or clip clasp",
    physicalityRules: `
CRITICAL RENDERING REQUIREMENTS:
- Matte metallic finish (NO mirror reflections or shine)
- Pin sits nearly flat against shirt with minimal shadow (0.5mm)
- Logo design etched or screen-printed directly on metal surface
- Slight depth variation in engraved text/design areas
- Edges show appropriate wear patina (not brand new)
- Pin follows shirt fabric plane without major protrusion
- Magnetic clasp creates slight fabric dimple on reverse side
- Metal surface shows fingerprint smudges if touched (realistic wear)
    `,
    lightingBehavior: "Soft diffuse specular on matte metal surface, no harsh mirror reflections"
  },

  [AttireType.POLO]: {
    technique: LogoTechnique.CHEST_EMBROIDERY,
    position: "Left chest, 8cm below collar point, centered on chest area",
    size: "40mm width logo, classic polo embroidery sizing",
    material: "Direct thread embroidery on pique cotton knit fabric using polyester embroidery thread",
    physicalityRules: `
CRITICAL RENDERING REQUIREMENTS:
- Individual thread stitches MUST be clearly visible at close inspection
- Embroidery raises 1-1.5mm above fabric baseline surface
- Thread pattern follows logo design curves and details precisely
- Pique texture (waffle pattern) visible through embroidery gaps
- Stitches follow fabric weave direction creating slight bias
- Subtle fabric puckering around densely stitched areas (normal)
- Thread exhibits directional sheen varying with viewing angle
- Stitch density varies (denser in solid areas, lighter in details)
- Loose thread ends NOT visible (clean professional finish)
- Logo curves and folds with fabric when body moves
    `,
    lightingBehavior: "Anisotropic specular reflection on embroidery thread (directional shine like silk), matte on base fabric"
  },

  [AttireType.TSHIRT]: {
    technique: LogoTechnique.SCREEN_PRINT,
    position: "Center chest, 10cm below neckline seam, centered on torso",
    size: "80mm width, bold statement sizing for casual wear",
    material: "Plastisol ink screen-printed on 100% cotton jersey knit fabric",
    physicalityRules: `
CRITICAL RENDERING REQUIREMENTS:
- Completely FLAT surface with NO raised embroidery threads
- Ink sits ON TOP of fabric (not woven into fibers)
- Slight ink layer thickness 0.1-0.2mm creating subtle edge
- MATTE finish on ink (avoid any glossy or shiny appearance)
- Fabric jersey texture visible in unprinted areas and through thin ink
- Micro-cracks in ink visible if shirt is worn/stretched (realistic aging)
- Print edges are SHARP and clean (not fuzzy or bleeding)
- Ink color is opaque and solid (not translucent)
- Print follows t-shirt fabric stretching and draping naturally
- NO shadows cast by print (it's flat on surface)
    `,
    lightingBehavior: "Uniform matte diffuse reflection, absolutely NO thread highlights or specular shine"
  },

  [AttireType.JACKET]: {
    technique: LogoTechnique.WOVEN_PATCH,
    position: "Left chest OR right sleeve upper arm (specify in prompt), positioned prominently",
    size: "60mm diameter circular or shield-shaped patch, tactical/outdoor style",
    material: "Woven polyester thread patch with merrowed edge stitching, hook-and-loop (velcro) backed",
    physicalityRules: `
CRITICAL RENDERING REQUIREMENTS:
- Patch sits raised 2-3mm above jacket surface creating clear shadow
- Merrowed edge (overlock stitching) clearly visible around perimeter
- Woven threads create logo image (NOT printed on fabric)
- Patch follows body contour with subtle curve (not flat sticker)
- Hook-and-loop backing texture visible at patch edges
- Shadow cast by raised patch on jacket fabric beneath
- Edge stitching uses contrasting thread color for definition
- Patch shows slight texture variation from weaving process
- Logo design formed by thread density variations (tight weave vs loose)
- Patch corners slightly curl up from jacket surface (realistic)
- Velcro grip creates slight fabric dimpling around patch
    `,
    lightingBehavior: "Matte diffuse on patch surface with subtle woven texture, soft shadow underneath patch"
  }
};

// ============================================================================
// OFFER BOOSTER PRESETS (GROUPED)
// ============================================================================

export const ENHANCEMENT_PRESETS: EnhancementPreset[] = [
  // --- UNIVERSAL ---
  {
    id: "studio_clarity",
    label: "Studio Clarity",
    description: "Universal cleanup. Removes noise, fixes exposure, sharpens.",
    icon: "💎",
    category: "UNIVERSAL",
    tags: ["universal", "standard", "cleanup", "fix"]
  },

  // --- COMMERCIAL (TRAVEL STANDARDS) ---
  {
    id: "real_estate_interior",
    label: "Hotel & Interiors",
    description: "Bright, airy rooms. Perfect vertical walls. Welcoming atmosphere.",
    icon: "🏨",
    category: "COMMERCIAL",
    tags: ["room", "interior", "bedroom", "lobby", "hotel", "resort", "suite", "spa", "indoor"]
  },
  {
    id: "culinary_pop",
    label: "Dining & Culinary",
    description: "Rich textures for restaurants, buffets, and plated dishes.",
    icon: "🍽️",
    category: "COMMERCIAL",
    tags: ["food", "dish", "plate", "meal", "restaurant", "buffet", "breakfast", "drink", "bar", "dining"]
  },
  {
    id: "ecommerce_hero",
    label: "Market & Details",
    description: "Focus on local crafts, souvenirs, and architectural details.",
    icon: "🏺",
    category: "COMMERCIAL",
    tags: ["craft", "souvenir", "market", "detail", "object", "macro", "texture", "shopping", "gift"]
  },
  
  // --- ATMOSPHERE & MOOD ---
  {
    id: "golden_hour",
    label: "Golden Hour",
    description: "Warm sunset glow. Best for beaches, exteriors, and landmarks.",
    icon: "🌅",
    category: "ATMOSPHERE",
    tags: ["outdoor", "exterior", "landscape", "beach", "pool", "garden", "resort", "patio", "sunset", "sunrise", "view"]
  },
  {
    id: "nordic_soft",
    label: "Nordic Minimalist",
    description: "Cool, clean, serene. Great for winter destinations or modern spas.",
    icon: "❄️",
    category: "ATMOSPHERE",
    tags: ["minimal", "winter", "snow", "ski", "spa", "modern", "clean", "white"]
  },
  {
    id: "vibrant_tropical",
    label: "Tropical Punch",
    description: "Saturated blues and greens. Essential for island and pool promotions.",
    icon: "🏝️",
    category: "ATMOSPHERE",
    tags: ["tropical", "jungle", "sea", "ocean", "forest", "summer", "vacation", "swim", "pool", "palm"]
  },
  {
    id: "cinematic_drama",
    label: "Cinematic Mood",
    description: "High contrast, emotional. Good for nightlife, tours, and culture.",
    icon: "🎬",
    category: "ATMOSPHERE",
    tags: ["night", "tour", "city", "urban", "street", "dark", "moody", "culture", "museum"]
  },
  {
    id: "blue_hour",
    label: "Twilight Magic",
    description: "Deep evening blues with warm city lights. Perfect for cityscapes.",
    icon: "🌃",
    category: "ATMOSPHERE",
    tags: ["twilight", "evening", "city", "skyline", "dusk", "architecture", "night"]
  }
];