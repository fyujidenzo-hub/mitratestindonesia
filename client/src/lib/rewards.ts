export const rewardMilestones = [
  { task: 5, amount: 25_000 },
  { task: 7, amount: 50_000 },
  { task: 10, amount: 75_000 },
  { task: 12, amount: 150_000 },
  { task: 15, amount: 200_000 },
] as const;

export const rewardTaskGoal = rewardMilestones[rewardMilestones.length - 1].task;
