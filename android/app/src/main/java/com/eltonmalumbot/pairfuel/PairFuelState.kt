package com.eltonmalumbot.pairfuel

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class PairFuelState(context: Context) {
    private val api = ApiClient(context)
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    var authenticated by mutableStateOf(api.hasSession)
        private set
    var loading by mutableStateOf(api.hasSession)
        private set
    var error by mutableStateOf<String?>(null)
        private set
    var dashboard by mutableStateOf<DashboardData?>(null)
        private set
    var selectedTab by mutableStateOf(AppTab.TODAY)
    var theme by mutableStateOf(PairFuelTheme.GREEN)

    init {
        if (api.hasSession) refresh()
    }

    fun signIn(email: String, password: String) = runAction {
        api.signIn(email, password)
        authenticated = true
        dashboard = api.dashboard()
    }

    fun signUp(name: String, email: String, password: String) = runAction {
        api.signUp(name, email, password)
        authenticated = true
        dashboard = api.dashboard()
    }

    fun refresh() = runAction(showLoading = dashboard == null) {
        dashboard = api.dashboard()
        authenticated = true
    }

    fun addFood(name: String, meal: String, calories: Int, protein: Float, carbs: Float, fat: Float, loggedAt: String) = runAction {
        api.addFood(name, meal, calories, protein, carbs, fat, loggedAt)
        dashboard = api.dashboard()
    }

    fun addWater(amount: Int) = runAction {
        api.addWater(amount)
        dashboard = api.dashboard()
    }

    fun addWeight(weight: Float, date: String) = runAction {
        api.addWeight(weight, date)
        dashboard = api.dashboard()
    }

    fun updateFast(action: String, target: Int = 16) = runAction {
        api.updateFast(action, target)
        dashboard = api.dashboard()
    }

    fun logout() {
        api.clearSession()
        authenticated = false
        dashboard = null
        error = null
    }

    fun dismissError() { error = null }

    private fun runAction(showLoading: Boolean = true, block: suspend () -> Unit) {
        if (loading) return
        scope.launch {
            if (showLoading) loading = true
            error = null
            try {
                withContext(Dispatchers.IO) { block() }
            } catch (exception: ApiException) {
                if (exception.status == 401) {
                    api.clearSession()
                    authenticated = false
                    dashboard = null
                }
                error = exception.message
            } catch (exception: Exception) {
                error = exception.message ?: "Could not connect to PairFuel."
            } finally {
                loading = false
            }
        }
    }
}
