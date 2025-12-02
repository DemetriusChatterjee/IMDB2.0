// Utility functions for formatting text content

export const formatGeminiAnalysis = (text) => {
  if (!text) return text

  // Replace structured tags with formatted sections
  let formatted = text
    .replace(/\[VISUAL_STYLE\]/g, '\nVisual Style:\n')
    .replace(/\[NARRATIVE_ARC\]/g, '\nNarrative Arc:\n')
    .replace(/\[AUDIO_LANDSCAPE\]/g, '\nAudio Landscape:\n')
    .replace(/\[EMOTIONAL_VIBE\]/g, '\nEmotional Vibe:\n')
    .replace(/\[STYLE\]/g, '\nStyle:\n')
    .replace(/\[THEME\]/g, '\nThemes:\n')
    .replace(/\[GENRE\]/g, '\nGenre:\n')
    .replace(/\[MOOD\]/g, '\nMood:\n')
    .replace(/\[CINEMATOGRAPHY\]/g, '\nCinematography:\n')
    .replace(/\[PACING\]/g, '\nPacing:\n')

  // Clean up extra whitespace and newlines
  formatted = formatted
    .replace(/\n\s*\n/g, '\n\n')  // Replace multiple newlines with double
    .replace(/^\s+|\s+$/g, '')    // Trim whitespace from start/end
    .replace(/\n/g, '<br/>')      // Convert newlines to HTML breaks

  return formatted
}

export const extractSectionFromGemini = (text, sectionTag) => {
  if (!text) return null

  const regex = new RegExp(`\\[${sectionTag}\\]\\s*([^\\[]+)`, 'i')
  const match = text.match(regex)

  return match ? match[1].trim() : null
}