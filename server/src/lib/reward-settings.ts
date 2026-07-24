export const rewardSettingKeys = {
  milestones: "rewardMilestones",
  terms: "rewardTerms",
} as const;

export const rewardMilestoneTasks = [5, 7, 10, 12, 15] as const;

export type RewardMilestone = {
  task: (typeof rewardMilestoneTasks)[number];
  amount: number;
};

export type RewardSettings = {
  milestones: RewardMilestone[];
  terms: string;
};

export const defaultRewardSettings: RewardSettings = {
  milestones: [
    { task: 5, amount: 25_000 },
    { task: 7, amount: 50_000 },
    { task: 10, amount: 75_000 },
    { task: 12, amount: 150_000 },
    { task: 15, amount: 200_000 },
  ],
  terms: "Rewards are credited automatically when the required number of completed tasks is reached. Each milestone reward can be earned once per account.",
};

export function parseRewardMilestones(value?: string | null): RewardMilestone[] {
  if (!value) return defaultRewardSettings.milestones.map((milestone) => ({ ...milestone }));

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return defaultRewardSettings.milestones.map((milestone) => ({ ...milestone }));
    }

    const amounts = parsed as Record<string, unknown>;
    return rewardMilestoneTasks.map((task) => {
      const amount = amounts[String(task)];
      return {
        task,
        amount: typeof amount === "number" && Number.isSafeInteger(amount) && amount >= 0
          ? amount
          : defaultRewardSettings.milestones.find((milestone) => milestone.task === task)!.amount,
      };
    });
  } catch {
    return defaultRewardSettings.milestones.map((milestone) => ({ ...milestone }));
  }
}

export function serializeRewardMilestones(milestones: RewardMilestone[]) {
  return JSON.stringify(Object.fromEntries(milestones.map((milestone) => [milestone.task, milestone.amount])));
}

export function rewardSettingsFromValues(values: Record<string, string | undefined>): RewardSettings {
  return {
    milestones: parseRewardMilestones(values[rewardSettingKeys.milestones]),
    terms: values[rewardSettingKeys.terms]?.trim() || defaultRewardSettings.terms,
  };
}
