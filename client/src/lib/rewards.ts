export type RewardMilestone = {
  task: number;
  amount: number;
};

export type RewardSettings = {
  milestones: RewardMilestone[];
  terms: string;
};

export const rewardMilestones: RewardMilestone[] = [
  { task: 5, amount: 25_000 },
  { task: 7, amount: 50_000 },
  { task: 10, amount: 75_000 },
  { task: 12, amount: 150_000 },
  { task: 15, amount: 200_000 },
];

export const rewardTaskGoal = rewardMilestones[rewardMilestones.length - 1].task;

export const defaultRewardTerms = "Rewards are credited automatically when the required number of completed tasks is reached. Each milestone reward can be earned once per account.";

export const defaultRewardSettings: RewardSettings = {
  milestones: rewardMilestones,
  terms: defaultRewardTerms,
};

export function normalizeRewardSettings(settings?: Partial<RewardSettings> | null): RewardSettings {
  const byTask = new Map(settings?.milestones?.map((milestone) => [milestone.task, milestone.amount]) ?? []);
  return {
    milestones: rewardMilestones.map((milestone) => ({
      task: milestone.task,
      amount: Number.isSafeInteger(byTask.get(milestone.task)) && (byTask.get(milestone.task) ?? -1) >= 0
        ? byTask.get(milestone.task)!
        : milestone.amount,
    })),
    terms: settings?.terms?.trim() || defaultRewardTerms,
  };
}

export function rewardSettingsFromSiteValues(values?: Record<string, string> | null): RewardSettings {
  let milestones: RewardMilestone[] | undefined;
  try {
    const parsed = JSON.parse(values?.rewardMilestones || "{}") as Record<string, unknown>;
    milestones = rewardMilestones.map((milestone) => ({
      task: milestone.task,
      amount: typeof parsed[String(milestone.task)] === "number" ? parsed[String(milestone.task)] as number : milestone.amount,
    }));
  } catch {
    milestones = undefined;
  }

  return normalizeRewardSettings({
    milestones,
    terms: values?.rewardTerms,
  });
}
