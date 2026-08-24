package com.eltonmalumbot.pairfuel

data class Profile(
    val displayName: String = "Friend",
    val calorieTarget: Int = 1900,
    val proteinTarget: Float = 130f,
    val carbTarget: Float = 190f,
    val fatTarget: Float = 65f,
    val waterTarget: Int = 2500,
    val goalWeight: Float? = null,
    val fastingPreset: String = "16:8",
)

data class TodayStats(
    val calories: Int = 0,
    val protein: Float = 0f,
    val carbs: Float = 0f,
    val fat: Float = 0f,
    val water: Int = 0,
)

data class FoodLog(
    val id: String,
    val loggedAt: String,
    val meal: String,
    val name: String,
    val calories: Int,
    val protein: Float,
    val carbs: Float,
    val fat: Float,
)

data class WeightLog(val id: String, val loggedOn: String, val weight: Float)

data class FastLog(
    val id: String,
    val startedAt: String,
    val endedAt: String?,
    val targetHours: Int,
)

data class DashboardData(
    val email: String,
    val profile: Profile,
    val today: TodayStats,
    val food: List<FoodLog>,
    val weights: List<WeightLog>,
    val fasts: List<FastLog>,
    val activeFast: FastLog?,
    val connectedToPartner: Boolean,
)

enum class PairFuelTheme { GREEN, PINK, BLUE }
enum class AppTab { TODAY, HISTORY, FASTING, PROFILE }
