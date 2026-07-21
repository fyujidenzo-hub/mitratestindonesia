import type { UserLevel } from "../types";

export const commissionPercentByLevel: Record<UserLevel, number> = {
  STARTER: 15,
  SILVER: 15,
  GOLD: 25,
  VIP: 25,
  VVIP: 30,
};

export const levelLabelByLevel: Record<UserLevel, string> = {
  STARTER: "Classic",
  SILVER: "Classic",
  GOLD: "VIP",
  VIP: "VIP",
  VVIP: "VVIP",
};

export function normalizeMembershipLevel(level: UserLevel | string): UserLevel {
  if (level === "VVIP") return "VVIP";
  if (level === "VIP" || level === "GOLD") return "VIP";
  return "STARTER";
}

export function calculateCommission(price: number, level: UserLevel | string) {
  return Math.floor((price * commissionPercent(level)) / 100);
}

export function commissionPercent(level: UserLevel | string) {
  return commissionPercentByLevel[normalizeMembershipLevel(level)];
}

export function membershipLabel(level: UserLevel | string) {
  const normalized = normalizeMembershipLevel(level);
  return `${levelLabelByLevel[normalized]} · ${commissionPercentByLevel[normalized]}%`;
}
