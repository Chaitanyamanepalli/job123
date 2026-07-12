const { GoogleGenAI } = require('@google/genai');

let aiInstance = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined in environmental variables!");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

/**
 * Generates JSON content using gemini-3.5-flash
 * @param {string} prompt 
 * @param {object} [fallback] Fallback object if the call fails
 * @returns {Promise<object>} Parsed JSON response
 */
const generateJSON = async (prompt, fallback = {}) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Received empty response from Gemini API");
    }

    // Try to parse JSON from the response text
    try {
      return JSON.parse(responseText.trim());
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON. Raw output:", responseText);
      // Clean up in case there are markdown block backticks around it
      const cleaned = responseText.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, '');
      return JSON.parse(cleaned.trim());
    }
  } catch (error) {
    console.error("Gemini API Error:", error.message || error);
    return fallback;
  }
};

module.exports = {
  getAI,
  generateJSON
};
