import { EnhancementPreset } from '../types';
import { ENHANCEMENT_PRESETS } from '../constants';

/**
 * Analyzes the Gemini result text and matches it against preset tags
 * to recommend the most relevant enhancement options.
 */
export const getRecommendedPresets = (analysisText: string | undefined): Set<string> => {
  const recommended = new Set<string>();
  
  // Always recommend Studio Clarity as a base fix
  recommended.add('studio_clarity');

  if (!analysisText) return recommended;

  const textLower = analysisText.toLowerCase();

  ENHANCEMENT_PRESETS.forEach(preset => {
    // Skip checking Universal since it's always added
    if (preset.category === 'UNIVERSAL') return;

    // Check if any tag exists in the analysis text
    const hasMatch = preset.tags.some(tag => textLower.includes(tag.toLowerCase()));
    
    if (hasMatch) {
      recommended.add(preset.id);
    }
  });

  return recommended;
};