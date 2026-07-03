import type { DateType, MemberItem } from '@/types';
import { round } from 'es-toolkit';

export function calculatePlanData(data: MemberItem, dateType: DateType = 'yearly') {
  const originalPrice = data[dateType]?.originalPrice || 0;
  const price = data[dateType]?.price || 0;
  const discount = data[dateType]?.discount || 0;

  const discountMoney = round(originalPrice - price, 0);
  const monthlyMoney = dateType === 'yearly' ? round(price / 12, 2) : price;

  return {
    originalPrice,
    price,
    discount,
    discountMoney,
    monthlyMoney,
  }
}

const LEVEL_SCORE: Record<string, number> = {
  galaxy: 3,
  luna: 2,
  star: 1,
  free: 0,
};

const TIME_SCORE: Record<string, number> = {
  yearly: 2,
  monthly: 1,
};

/**
 * 检查是否允许购买
 * @param currentPlan 当前会员等级
 * @param currentType 当前会员类型
 * @param targetPlan 目标会员等级
 * @param targetType 目标会员类型
 * @param validUntil 会员过期时间
 * @returns true: 受限(不允许购买); false: 允许购买
 */
export function checkPlanRestriction(
  currentPlan: string,
  currentType: string | null,
  targetPlan: string,
  targetType: string,
  validUntil: string
): boolean {
  // Check if current plan is valid (not expired)
  if (validUntil && new Date(validUntil).getTime() < Date.now()) {
    return false; // Not restricted if expired
  }

  const currentLevelScore = LEVEL_SCORE[currentPlan] || 0;
  const targetLevelScore = LEVEL_SCORE[targetPlan] || 0;

  // Block if target level is strictly lower than current level
  if (targetLevelScore < currentLevelScore) {
    return true;
  }

  const currentTimeScore = TIME_SCORE[currentType || ''] || 0;
  const targetTimeScore = TIME_SCORE[targetType] || 0;

  // If levels are equal, check time dimension
  if (targetLevelScore === currentLevelScore) {
    // Block if target time is lower than current time
    // "bought yearly -> not allow buy monthly"
    if (targetTimeScore < currentTimeScore) {
      return true;
    }
  } else {
    // If upgrading level (target > current), allow purchase regardless of time?
    // User said "bought yearly -> not allow buy monthly" generally.
    // But usually upgrades allow switching cycles.
    // If I enforce global time check:
    // Star Yearly -> Galaxy Monthly. (Level Up, Time Down).
    // If I block this, user cannot upgrade to monthly galaxy from yearly star.
    // Let's assume time restriction applies primarily to same-level or general logic.
    // Given the specific instruction "bought yearly -> not allow buy monthly",
    // I will keep it as a check if the user intent was global.
    // BUT, common sense suggests upgrading level overrides time restriction unless strictly forbidden.
    // However, the safest interpretation of "bought yearly -> not allow buy monthly" is global.
    // Let's stick to the previous implementation structure but just relax the level equality check.

    // Actually, if I just remove the equality check in level, and keep the time check global:
    // Star Yearly -> Galaxy Monthly.
    // Level: 3 > 1. OK.
    // Time: 1 < 2. Blocked.

    // Is this desired?
    // "bought yearly -> not allow buy monthly"
    // If I bought a Yearly plan, I am committed for a year.
    // Switching to Monthly might be seen as a downgrade in commitment/value even if level is higher.
    // So keeping it global is safer.

    if (targetTimeScore < currentTimeScore) {
      return true;
    }
  }

  return false;
}
