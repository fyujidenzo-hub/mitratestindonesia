import { UserLevel } from "@prisma/client";

export const commissionPercentByLevel: Record<UserLevel, bigint> = {
  [UserLevel.STARTER]: 15n,
  [UserLevel.SILVER]: 15n,
  [UserLevel.GOLD]: 25n,
  [UserLevel.VIP]: 25n,
  [UserLevel.VVIP]: 30n,
};

export function calculateCommission(price: bigint, level: UserLevel) {
  return (price * commissionPercentByLevel[level]) / 100n;
}
