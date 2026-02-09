
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { UserProfile, DietPlan, ChatMessage, NutritionSummary } from "../types";

export const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateWelcomeEmail = async (name: string, email: string, clinicalId: string): Promise<string> => {
  const ai = getAIInstance();
  const prompt = `Write a professional, welcoming, and high-detail clinical "Welcome Protocol" email for a new practitioner named ${name} who just joined NutriPlan AI. 
  
  MANDATORY DATA:
  - Clinical Practitioner ID: ${clinicalId}
  - Registry Email: ${email}

  The email should outline:
  1. Official confirmation of their new Clinical ID: ${clinicalId}.
  2. Brief explanation of the AI's biometric synthesis capabilities.
  3. A note on data privacy and AES-256 encryption standards.
  4. Steps to initialize their first wellness protocol.
  
  Keep it formal, medical-grade, and encouraging. Use Markdown formatting.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are the NutriPlan AI Automated Onboarding System. You send professional, clinical-grade welcome communications containing official identifiers."
    }
  });

  return response.text || `Welcome to NutriPlan AI. Your account is now active. Your Clinical ID is ${clinicalId}.`;
};

export const generateWellnessProtocol = async (profile: UserProfile): Promise<DietPlan> => {
  const ai = getAIInstance();
  
  const prompt = `Generate a COMPREHENSIVE clinical wellness strategy for a ${profile.age}-year-old ${profile.gender} (${profile.persona}).
    
    BIO-CONTEXT:
    - Stats: ${profile.weight}kg, ${profile.height}cm
    - Activity: ${profile.activityLevel}
    - Medical History: ${profile.conditions || "None"}
    - Diet: ${profile.dietType} | Goal: ${profile.goal}
    
    REQUIRED SECTIONS (STRICT FORMATTING):
    1. Nutrition: 5 specific Meal Events.
       - suggestions: MUST be a detailed list of ingredients with exact weights/portions (e.g., "150g Grilled Chicken Breast", "1/2 cup Quinoa").
       - preparationSteps: MUST be professional, numbered, step-by-step culinary instructions. Avoid vague summaries.
    2. Strength Protocol (Workout): 4 exercises tailored to their profile.
       - instructions: 3-4 specific movement cues.
       - precautions: Age/condition-specific safety warnings.
    3. Mind-Body Protocol (Yoga): 4 poses/sequences.
       - instructions: Detailed alignment and breathing cues.
       - precautions: 1 critical contraindication warning.
    
    Return ONLY valid JSON. Ensure all instructions are actionable and precise.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are a Senior Clinical Wellness Consultant. You provide professional, high-detail health protocols. Meal plans must include specific portion sizes and exact cooking steps. Activity plans must prioritize biomechanical safety and clear instructions.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dailyCalories: { type: Type.NUMBER },
          macros: {
            type: Type.OBJECT,
            properties: {
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fats: { type: Type.NUMBER }
            },
            required: ["protein", "carbs", "fats"]
          },
          mealPlan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                meal: { type: Type.STRING },
                time: { type: Type.STRING },
                suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                preparationSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                prepTime: { type: Type.STRING },
                nutritionalBenefits: { type: Type.STRING }
              },
              required: ["meal", "time", "suggestions", "preparationSteps", "prepTime"]
            }
          },
          workoutPlan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                sets: { type: Type.STRING },
                reps: { type: Type.STRING },
                instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                precautions: { type: Type.STRING }
              },
              required: ["name", "sets", "reps", "instructions", "precautions"]
            }
          },
          yogaPlan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                duration: { type: Type.STRING },
                instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                precautions: { type: Type.STRING }
              },
              required: ["name", "duration", "instructions", "precautions"]
            }
          },
          hydration: { type: Type.STRING },
          lifestyleTips: { type: Type.ARRAY, items: { type: Type.STRING } },
          medicalAdvice: { type: Type.STRING },
          disclaimer: { type: Type.STRING }
        },
        required: ["dailyCalories", "macros", "mealPlan", "workoutPlan", "yogaPlan", "hydration", "lifestyleTips", "medicalAdvice", "disclaimer"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("AI Analysis Empty");
  
  return JSON.parse(text) as DietPlan;
};

export const analyzeFoodIntake = async (foods: string[]): Promise<NutritionSummary> => {
  const ai = getAIInstance();
  const prompt = `Estimate total nutritional value for this list of foods consumed in one day: ${foods.join(", ")}. 
    Return a single JSON object with estimated totals. Be realistic based on average portion sizes.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are a clinical nutrition estimator. Provide reasonable estimates for calories, protein, carbs, and fats in grams based on food descriptions. Return JSON ONLY.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fats: { type: Type.NUMBER }
        },
        required: ["calories", "protein", "carbs", "fats"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Estimation Failed");
  return JSON.parse(text) as NutritionSummary;
};

export const generateWellnessImage = async (type: 'meal' | 'workout' | 'yoga', name: string, context: string): Promise<string> => {
  const ai = getAIInstance();
  
  let subjectDescription = "";
  if (type === 'meal') {
    subjectDescription = `A top-down professional food photography shot of a delicious and healthy ${name}, featuring ingredients like ${context}. Served on a minimalist ceramic plate.`;
  } else if (type === 'workout') {
    subjectDescription = `A fitness photography style shot showing the correct starting position or peak contraction of the exercise: ${name}. Character wearing athletic gear in a modern, brightly lit gym environment.`;
  } else if (type === 'yoga') {
    subjectDescription = `A peaceful wellness photography shot of the yoga posture ${name}. Person in a calm, neutral-colored studio with soft morning light. Focus on poise and alignment.`;
  }

  const prompt = `${subjectDescription} 4k resolution, clean background, sharp focus, professional lighting, realistic aesthetic.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: { aspectRatio: "16:9" }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Failed to generate image");
};

export async function* chatWithNutritionistStream(history: ChatMessage[], message: string) {
  const ai = getAIInstance();
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: "You are a Clinical Nutrition Assistant. Be extremely concise and fast. Use Markdown. Focus on clinical accuracy."
    }
  });
  const response = await chat.sendMessageStream({ message });
  for await (const chunk of response) {
    const c = chunk as GenerateContentResponse;
    yield c.text || '';
  }
}
