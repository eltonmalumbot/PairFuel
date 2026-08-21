import { db } from "@/lib/db";

export type DailyStoryData = {
  displayName: string;
  calories: number;
  calorieTarget: number;
  protein: number;
  proteinTarget: number;
  water: number;
  waterTarget: number;
  fastingLabel: string;
  weight: number | null;
  weightChange: number | null;
  dietPlanLabel: string;
  headline: string;
  onTrack: boolean;
};

export type TogetherStoryData = {
  hasPartner: boolean;
  me: DailyStoryData;
  partner: null | {
    displayName: string;
    calories?: number;
    calorieTarget?: number;
    protein?: number;
    proteinTarget?: number;
    water?: number;
    waterTarget?: number;
    fastingLabel?: string;
    weight?: number;
    weightChange?: number;
    onTrack: boolean | null;
    shareCalories: boolean;
    shareMacros: boolean;
    shareWater: boolean;
    shareFasting: boolean;
    shareWeight: boolean;
    shareWeightChange: boolean;
  };
  headline: string;
  sharedMessage: string;
};

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function headlineFor(calories: number, target: number) {
  if (!target) return "Progress Looks Good ✨";
  const ratio = calories / target;
  if (ratio <= 1) return "On Track Today 💚";
  if (ratio <= 1.15) return "Still Moving Forward ✨";
  return "Reset & Keep Going 🔥";
}

async function getUserMetrics(userId: string): Promise<DailyStoryData> {
  const sql = db();

  const [profileRows, foodRows, waterRows, fastRows, latestWeightRows, firstWeightRows] = await Promise.all([
    sql`
      SELECT display_name, calorie_target, protein_target, water_target,
             fasting_preset, diet_plans
      FROM pairfuel_profiles
      WHERE user_id = ${userId}
      LIMIT 1
    `,
    sql`
      SELECT COALESCE(SUM(calories),0)::int AS calories,
             COALESCE(SUM(protein),0)::numeric AS protein
      FROM pairfuel_food_logs
      WHERE user_id = ${userId}
        AND logged_at >= (date_trunc('day',now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta')
        AND logged_at < ((date_trunc('day',now() AT TIME ZONE 'Asia/Jakarta')+interval '1 day') AT TIME ZONE 'Asia/Jakarta')
    `,
    sql`
      SELECT COALESCE(amount_ml,0)::int AS amount_ml
      FROM pairfuel_water_logs
      WHERE user_id = ${userId}
        AND logged_on = (now() AT TIME ZONE 'Asia/Jakarta')::date
      LIMIT 1
    `,
    sql`
      SELECT started_at, ended_at, target_hours
      FROM pairfuel_fasting_sessions
      WHERE user_id = ${userId}
      ORDER BY started_at DESC
      LIMIT 1
    `,
    sql`
      SELECT weight
      FROM pairfuel_weight_logs
      WHERE user_id = ${userId}
      ORDER BY logged_on DESC
      LIMIT 1
    `,
    sql`
      SELECT weight
      FROM pairfuel_weight_logs
      WHERE user_id = ${userId}
      ORDER BY logged_on ASC
      LIMIT 1
    `,
  ]);
  const [profile] = profileRows;
  const [food] = foodRows;
  const [water] = waterRows;
  const [fast] = fastRows;
  const [latestWeight] = latestWeightRows;
  const [firstWeight] = firstWeightRows;

  const calorieTarget = Number(profile?.calorie_target ?? 1900);
  const calories = Number(food?.calories ?? 0);
  const protein = round1(Number(food?.protein ?? 0));
  const proteinTarget = Number(profile?.protein_target ?? 130);
  const waterAmount = Number(water?.amount_ml ?? 0);
  const waterTarget = Number(profile?.water_target ?? 2500);

  let fastingLabel = `${profile?.fasting_preset ?? "16:8"} plan`;
  if (fast) {
    const started = new Date(fast.started_at).getTime();
    const ended = fast.ended_at ? new Date(fast.ended_at).getTime() : Date.now();
    const hours = Math.max(0, round1((ended - started) / 3_600_000));
    fastingLabel = fast.ended_at
      ? `${hours}h completed`
      : `${hours}h / ${Number(fast.target_hours ?? 16)}h`;
  }

  const weight = latestWeight ? Number(latestWeight.weight) : null;
  const weightChange = latestWeight && firstWeight
    ? round1(Number(latestWeight.weight) - Number(firstWeight.weight))
    : null;

  const dietPlans = Array.isArray(profile?.diet_plans) ? profile.diet_plans : [];
  const dietPlanLabel = dietPlans.length
    ? dietPlans.slice(0, 2).join(" + ")
    : String(profile?.fasting_preset ?? "Flexible");

  return {
    displayName: String(profile?.display_name ?? "Friend"),
    calories,
    calorieTarget,
    protein,
    proteinTarget,
    water: waterAmount,
    waterTarget,
    fastingLabel,
    weight,
    weightChange,
    dietPlanLabel,
    headline: headlineFor(calories, calorieTarget),
    onTrack: calories <= calorieTarget,
  };
}

export async function getDailyStoryData(userId: string) {
  return getUserMetrics(userId);
}

export async function getTogetherStoryData(userId: string): Promise<TogetherStoryData> {
  const sql = db();
  const [me, partnershipRows] = await Promise.all([
    getUserMetrics(userId),
    sql`
      SELECT CASE WHEN user_a_id = ${userId} THEN user_b_id ELSE user_a_id END AS partner_id
      FROM pairfuel_partnerships
      WHERE user_a_id = ${userId} OR user_b_id = ${userId}
      LIMIT 1
    `,
  ]);
  const [partnership] = partnershipRows;

  if (!partnership?.partner_id) {
    return {
      hasPartner: false,
      me,
      partner: null,
      headline: "Better Together 💑",
      sharedMessage: "Connect a partner to unlock your Together Story.",
    };
  }

  const partnerId = String(partnership.partner_id);
  const [partnerMetrics, privacyRows] = await Promise.all([
    getUserMetrics(partnerId),
    sql`
      SELECT share_calories, share_macros, share_fasting, share_water,
             share_weight, share_weight_change
      FROM pairfuel_partner_privacy
      WHERE user_id = ${partnerId}
      LIMIT 1
    `,
  ]);
  const [privacy] = privacyRows;

  const shareCalories = Boolean(privacy?.share_calories);
  const shareMacros = Boolean(privacy?.share_macros);
  const shareWater = Boolean(privacy?.share_water);
  const shareFasting = Boolean(privacy?.share_fasting);
  const shareWeight = Boolean(privacy?.share_weight);
  const shareWeightChange = Boolean(privacy?.share_weight_change);
  const bothOnTrack = me.onTrack && (!shareCalories || partnerMetrics.onTrack);

  return {
    hasPartner: true,
    me,
    partner: {
      displayName: partnerMetrics.displayName,
      calories: shareCalories ? partnerMetrics.calories : undefined,
      calorieTarget: shareCalories ? partnerMetrics.calorieTarget : undefined,
      protein: shareMacros ? partnerMetrics.protein : undefined,
      proteinTarget: shareMacros ? partnerMetrics.proteinTarget : undefined,
      water: shareWater ? partnerMetrics.water : undefined,
      waterTarget: shareWater ? partnerMetrics.waterTarget : undefined,
      fastingLabel: shareFasting ? partnerMetrics.fastingLabel : undefined,
      weight: shareWeight && partnerMetrics.weight != null ? partnerMetrics.weight : undefined,
      weightChange: shareWeightChange && partnerMetrics.weightChange != null ? partnerMetrics.weightChange : undefined,
      onTrack: shareCalories ? partnerMetrics.onTrack : null,
      shareCalories,
      shareMacros,
      shareWater,
      shareFasting,
      shareWeight,
      shareWeightChange,
    },
    headline: bothOnTrack ? "Better Together 💚" : "Progress Together ✨",
    sharedMessage: bothOnTrack
      ? "You’re both building better habits today 🔥"
      : "Different pace, same team. Keep going together 💚",
  };
}
