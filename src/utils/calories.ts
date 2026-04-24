/**
 * Calculates the Basal Metabolic Rate (BMR) using the Harris-Benedict equation.
 * 
 * Formula:
 * Men: BMR = 66.5 + (13.75 * weight) + (5.003 * height) - (6.75 * age)
 * Women: BMR = 655.1 + (9.563 * weight) + (1.850 * height) - (4.676 * age)
 */
export const calculateBMR = (
  weight: number,
  height: number,
  age: number,
  sex: 'Masculino' | 'Feminino'
): number => {
  if (sex === 'Masculino') {
    return 66.5 + (13.75 * weight) + (5.003 * height) - (6.75 * age);
  }
  return 655.1 + (9.563 * weight) + (1.850 * height) - (4.676 * age);
};

/**
 * Maps activity level to multipliers.
 */
export const activityMultipliers = {
  'Sedentário': 1.2,
  'Leve': 1.375,
  'Moderado': 1.55,
  'Muito Ativo': 1.725,
} as const;

export type ActivityLevel = keyof typeof activityMultipliers;

/**
 * Calculates the Daily Caloric Goal.
 */
export const calculateDailyGoal = (bmr: number, activityLevel: ActivityLevel): number => {
  return Math.round(bmr * activityMultipliers[activityLevel]);
};

/**
 * Calculates expiration date based on plan duration.
 */
export const calculateExpirationDate = (duration: '3 meses' | '6 meses' | '1 ano'): Date => {
  const now = new Date();
  const months = duration === '3 meses' ? 3 : duration === '6 meses' ? 6 : 12;
  const expiration = new Date(now);
  expiration.setMonth(now.getMonth() + months);
  return expiration;
};
