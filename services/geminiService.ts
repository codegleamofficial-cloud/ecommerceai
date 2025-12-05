import { GoogleGenAI } from "@google/genai";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash-image';

/**
 * Generates an edited version of the product image based on the prompt.
 * Uses gemini-2.5-flash-image which supports image input and text prompting for editing/generation.
 */
export const generateProductVariation = async (
  imageBase64: string,
  prompt: string
): Promise<string> => {
  try {
    // Strip the data:image/jpeg;base64, prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    
    // Determine mime type from the header or default to jpeg
    const mimeMatch = imageBase64.match(/^data:image\/(png|jpeg|jpg|webp);base64,/);
    const mimeType = mimeMatch ? `image/${mimeMatch[1]}` : 'image/jpeg';

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            text: prompt
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          }
        ]
      }
    });

    // Iterate through parts to find the image
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      throw new Error("No content generated");
    }

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
