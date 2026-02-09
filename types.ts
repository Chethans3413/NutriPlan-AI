
export enum ActivityLevel {
  SEDENTARY = 'sedentary',
  LIGHT = 'lightly active',
  MODERATE = 'moderately active',
  VERY = 'very active',
  EXTRA = 'extra active'
}

export enum Goal {
  WEIGHT_LOSS = 'Weight Loss',
  MAINTENANCE = 'Maintenance',
  MUSCLE_GAIN = 'Muscle Gain',
  HEALTH_MANAGEMENT = 'Medical/Health Management'
}

export enum DietType {
  VEG = 'Vegetarian',
  NON_VEG = 'Non-Vegetarian',
  VEGAN = 'Vegan',
  KETO = 'Keto',
  PALEO = 'Paleo'
}

export enum Persona {
  STUDENT = 'Student',
  PROFESSIONAL = 'Working Professional',
  ATHLETE = 'Athlete',
  GENERAL = 'General Wellness'
}

export interface UserProfile {
  age: number;
  gender: string;
  weight: number;
  height: number;
  activityLevel: ActivityLevel;
  conditions: string;
  allergies: string;
  dietType: DietType;
  persona: Persona;
  goal: Goal;
  targetCalories?: number;
  macroFocus?: string;
}

export interface Meal {
  meal: string;
  time: string;
  suggestions: string[];
  preparationSteps: string[];
  nutritionalBenefits: string;
  prepTime: string;
  imageUrl?: string;
}

export interface Exercise {
  name: string;
  sets: string;
  reps: string;
  instructions: string[];
  precautions: string;
  imageUrl?: string;
}

export interface YogaPose {
  name: string;
  duration: string;
  instructions: string[];
  precautions: string;
  imageUrl?: string;
}

export interface DietPlan {
  dailyCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  mealPlan: Meal[];
  workoutPlan: Exercise[];
  yogaPlan: YogaPose[];
  hydration: string;
  lifestyleTips: string[];
  medicalAdvice: string;
  disclaimer: string;
  sources: { title: string; uri: string }[];
}

export interface LoggedFood {
  id: string;
  name: string;
  timestamp: string;
}

export interface NutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface DailyTasks {
  date: string;
  tasks: Record<string, boolean>;
  loggedFoods: LoggedFood[];
  customNutrition?: NutritionSummary;
}

export interface SavedPlan {
  id: string;
  timestamp: number;
  plan: DietPlan;
  label: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface EmailMessage {
  id: string;
  sender: string;
  subject: string;
  content: string;
  timestamp: number;
  isRead: boolean;
}
