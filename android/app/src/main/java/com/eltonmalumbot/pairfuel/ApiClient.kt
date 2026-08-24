package com.eltonmalumbot.pairfuel

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class ApiException(message: String, val status: Int) : Exception(message)

class ApiClient(context: Context) {
    private val preferences = context.getSharedPreferences("pairfuel_native", Context.MODE_PRIVATE)

    val hasSession: Boolean get() = preferences.getString("cookies", "").orEmpty().isNotBlank()

    fun clearSession() {
        preferences.edit().remove("cookies").apply()
    }

    fun signIn(email: String, password: String) {
        request(
            "/api/auth/sign-in/email",
            "POST",
            JSONObject().put("email", email.trim()).put("password", password).put("rememberMe", true),
        )
    }

    fun signUp(name: String, email: String, password: String) {
        request(
            "/api/auth/sign-up/email",
            "POST",
            JSONObject().put("name", name.trim()).put("email", email.trim()).put("password", password),
        )
    }

    fun dashboard(): DashboardData {
        val root = request("/api/mobile/dashboard")
        val profileJson = root.getJSONObject("profile")
        val todayJson = root.getJSONObject("today")
        val waterJson = root.getJSONObject("water")
        val userJson = root.getJSONObject("user")
        val fasts = root.getJSONArray("fasts").mapObjects(::fastLog)

        return DashboardData(
            email = userJson.optString("email"),
            profile = Profile(
                displayName = profileJson.optString("display_name", "Friend"),
                calorieTarget = profileJson.number("calorie_target", 1900).toInt(),
                proteinTarget = profileJson.number("protein_target", 130).toFloat(),
                carbTarget = profileJson.number("carb_target", 190).toFloat(),
                fatTarget = profileJson.number("fat_target", 65).toFloat(),
                waterTarget = profileJson.number("water_target", 2500).toInt(),
                goalWeight = profileJson.nullableNumber("goal_weight")?.toFloat(),
                fastingPreset = profileJson.optString("fasting_preset", "16:8"),
            ),
            today = TodayStats(
                calories = todayJson.number("calories").toInt(),
                protein = todayJson.number("protein").toFloat(),
                carbs = todayJson.number("carbs").toFloat(),
                fat = todayJson.number("fat").toFloat(),
                water = waterJson.number("amount_ml").toInt(),
            ),
            food = root.getJSONArray("food").mapObjects {
                FoodLog(
                    id = it.getString("id"),
                    loggedAt = it.getString("logged_at"),
                    meal = it.getString("meal"),
                    name = it.getString("food_name"),
                    calories = it.number("calories").toInt(),
                    protein = it.number("protein").toFloat(),
                    carbs = it.number("carbs").toFloat(),
                    fat = it.number("fat").toFloat(),
                )
            },
            weights = root.getJSONArray("weights").mapObjects {
                WeightLog(it.getString("id"), it.getString("logged_on"), it.number("weight").toFloat())
            },
            fasts = fasts,
            activeFast = root.optJSONObject("activeFast")?.let(::fastLog),
            connectedToPartner = root.optBoolean("connectedToPartner"),
        )
    }

    fun addFood(name: String, meal: String, calories: Int, protein: Float, carbs: Float, fat: Float, loggedAt: String) {
        request("/api/mobile/logs", "POST", JSONObject()
            .put("type", "food").put("food", name).put("meal", meal).put("calories", calories)
            .put("protein", protein).put("carbs", carbs).put("fat", fat).put("loggedAt", loggedAt))
    }

    fun addWater(amount: Int) {
        request("/api/mobile/logs", "POST", JSONObject().put("type", "water").put("amount", amount))
    }

    fun addWeight(weight: Float, date: String) {
        request("/api/mobile/logs", "POST", JSONObject().put("type", "weight").put("weight", weight).put("date", date))
    }

    fun updateFast(action: String, target: Int = 16) {
        request("/api/mobile/fasting", "POST", JSONObject().put("action", action).put("target", target))
    }

    private fun fastLog(json: JSONObject) = FastLog(
        id = json.getString("id"),
        startedAt = json.getString("started_at"),
        endedAt = json.optString("ended_at").takeIf { it.isNotBlank() && it != "null" },
        targetHours = json.number("target_hours", 16).toInt(),
    )

    private fun request(path: String, method: String = "GET", body: JSONObject? = null): JSONObject {
        val connection = URL(BuildConfig.PAIRFUEL_API_URL + path).openConnection() as HttpURLConnection
        try {
            connection.requestMethod = method
            connection.connectTimeout = 15_000
            connection.readTimeout = 20_000
            connection.setRequestProperty("Accept", "application/json")
            preferences.getString("cookies", null)?.takeIf { it.isNotBlank() }?.let {
                connection.setRequestProperty("Cookie", it)
            }
            if (body != null) {
                connection.doOutput = true
                connection.setRequestProperty("Content-Type", "application/json")
                connection.outputStream.bufferedWriter().use { it.write(body.toString()) }
            }

            val status = connection.responseCode
            saveCookies(connection)
            val stream = if (status in 200..299) connection.inputStream else connection.errorStream
            val text = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
            val json = runCatching { JSONObject(text) }.getOrElse { JSONObject() }
            if (status !in 200..299) {
                val message = json.optString("error").ifBlank { json.optString("message", "Request failed.") }
                throw ApiException(message, status)
            }
            return json
        } finally {
            connection.disconnect()
        }
    }

    private fun saveCookies(connection: HttpURLConnection) {
        val cookies = linkedMapOf<String, String>()
        preferences.getString("cookies", "").orEmpty().split("; ").filter { it.contains('=') }.forEach {
            cookies[it.substringBefore('=')] = it
        }
        connection.headerFields.entries
            .filter { it.key?.equals("Set-Cookie", ignoreCase = true) == true }
            .flatMap { it.value }
            .map { it.substringBefore(';') }
            .filter { it.contains('=') }
            .forEach { cookies[it.substringBefore('=')] = it }
        if (cookies.isNotEmpty()) preferences.edit().putString("cookies", cookies.values.joinToString("; ")).apply()
    }
}

private fun JSONObject.number(key: String, default: Number = 0): Number {
    val value = opt(key)
    return when (value) {
        is Number -> value
        is String -> value.toDoubleOrNull() ?: default
        else -> default
    }
}

private fun JSONObject.nullableNumber(key: String): Number? = if (isNull(key)) null else number(key)

private fun <T> JSONArray.mapObjects(transform: (JSONObject) -> T): List<T> =
    (0 until length()).map { transform(getJSONObject(it)) }
