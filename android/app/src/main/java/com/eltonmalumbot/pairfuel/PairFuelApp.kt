package com.eltonmalumbot.pairfuel

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import kotlin.math.roundToInt

@Composable
fun PairFuelApp(state: PairFuelState) {
    PairFuelTheme(state.theme) {
        val snackbar = remember { SnackbarHostState() }
        LaunchedEffect(state.error) {
            state.error?.let { snackbar.showSnackbar(it); state.dismissError() }
        }

        Box(Modifier.fillMaxSize()) {
            when {
                !state.authenticated -> AuthScreen(state)
                state.dashboard != null -> DashboardScreen(state, state.dashboard!!, snackbar)
                else -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
            }
            if (state.loading) Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
        }
    }
}

@Composable
private fun AuthScreen(state: PairFuelState) {
    var signUp by remember { mutableStateOf(false) }
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(28.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        item {
            Text("PairFuel", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
            Text(if (signUp) "Create account" else "Welcome back", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Black)
            Text("Diet, fasting, and progress—better together.", color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.height(24.dp))
            if (signUp) OutlinedTextField(name, { name = it }, Modifier.fillMaxWidth(), label = { Text("Name") }, singleLine = true)
            if (signUp) Spacer(Modifier.height(12.dp))
            OutlinedTextField(email, { email = it }, Modifier.fillMaxWidth(), label = { Text("Email") }, singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email))
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(password, { password = it }, Modifier.fillMaxWidth(), label = { Text("Password") }, singleLine = true, visualTransformation = PasswordVisualTransformation())
            Spacer(Modifier.height(18.dp))
            Button(
                onClick = { if (signUp) state.signUp(name, email, password) else state.signIn(email, password) },
                enabled = email.isNotBlank() && password.length >= 8 && (!signUp || name.isNotBlank()),
                modifier = Modifier.fillMaxWidth(),
            ) { Text(if (signUp) "Create account" else "Sign in") }
            TextButton(onClick = { signUp = !signUp }, modifier = Modifier.fillMaxWidth()) {
                Text(if (signUp) "Already have an account? Sign in" else "New here? Create account")
            }
        }
    }
}

@Composable
private fun DashboardScreen(state: PairFuelState, data: DashboardData, snackbar: SnackbarHostState) {
    Scaffold(
        snackbarHost = { SnackbarHost(snackbar) },
        bottomBar = {
            NavigationBar {
                AppTab.entries.forEach { tab ->
                    NavigationBarItem(
                        selected = state.selectedTab == tab,
                        onClick = { state.selectedTab = tab },
                        icon = { Text(when (tab) { AppTab.TODAY -> "♥"; AppTab.HISTORY -> "≡"; AppTab.FASTING -> "◷"; AppTab.PROFILE -> "●" }) },
                        label = { Text(tab.name.lowercase().replaceFirstChar { it.uppercase() }) },
                    )
                }
            }
        },
    ) { padding ->
        when (state.selectedTab) {
            AppTab.TODAY -> TodayScreen(state, data, Modifier.padding(padding))
            AppTab.HISTORY -> HistoryScreen(state, data, Modifier.padding(padding))
            AppTab.FASTING -> FastingScreen(state, data, Modifier.padding(padding))
            AppTab.PROFILE -> ProfileScreen(state, data, Modifier.padding(padding))
        }
    }
}

@Composable
private fun ScreenHeader(title: String, subtitle: String) {
    Text("PairFuel", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
    Text(title, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
    Text(subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant)
    Spacer(Modifier.height(18.dp))
}

@Composable
private fun TodayScreen(state: PairFuelState, data: DashboardData, modifier: Modifier) {
    var addFood by remember { mutableStateOf(false) }
    val today = data.today
    LazyColumn(modifier.fillMaxSize(), contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { ScreenHeader("Hi, ${data.profile.displayName}", "Your progress today") }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                MetricCard("Calories", "${today.calories}", "of ${data.profile.calorieTarget} kcal", Modifier.weight(1f))
                MetricCard("Protein", "${today.protein.roundToInt()}g", "of ${data.profile.proteinTarget.roundToInt()}g", Modifier.weight(1f))
            }
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                MetricCard("Water", "${today.water}ml", "of ${data.profile.waterTarget}ml", Modifier.weight(1f))
                MetricCard("Partner", if (data.connectedToPartner) "Connected" else "Solo", "Together mode", Modifier.weight(1f))
            }
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Button({ addFood = true }, Modifier.weight(1f)) { Text("Add food") }
                OutlinedButton({ state.addWater(250) }, Modifier.weight(1f)) { Text("+250 ml") }
            }
        }
        item { Text("Recent meals", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold) }
        items(data.food.take(6)) { FoodRow(it) }
    }
    if (addFood) FoodDialog(onDismiss = { addFood = false }) { name, meal, calories, protein, carbs, fat, time ->
        state.addFood(name, meal, calories, protein, carbs, fat, time)
        addFood = false
    }
}

@Composable
private fun MetricCard(label: String, value: String, caption: String, modifier: Modifier = Modifier) {
    Card(modifier) {
        Column(Modifier.padding(16.dp)) {
            Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(value, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
            Text(caption, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun FoodRow(food: FoodLog) {
    Card(Modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
            Column(Modifier.weight(1f)) {
                Text(food.name, fontWeight = FontWeight.Bold)
                Text("${food.meal} · ${food.loggedAt.take(10)}", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Text("${food.calories} kcal", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun HistoryScreen(state: PairFuelState, data: DashboardData, modifier: Modifier) {
    var addWeight by remember { mutableStateOf(false) }
    LazyColumn(modifier.fillMaxSize(), contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        item { ScreenHeader("History", "Meals and body progress") }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Weight", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                OutlinedButton({ addWeight = true }) { Text("Add weight") }
            }
        }
        items(data.weights.take(5)) { Card(Modifier.fillMaxWidth()) { Text("${it.loggedOn}  ·  ${it.weight} kg", Modifier.padding(16.dp), fontWeight = FontWeight.Bold) } }
        item { HorizontalDivider(Modifier.padding(vertical = 8.dp)); Text("Food logs", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold) }
        items(data.food) { FoodRow(it) }
    }
    if (addWeight) WeightDialog({ addWeight = false }) { weight, date -> state.addWeight(weight, date); addWeight = false }
}

@Composable
private fun FastingScreen(state: PairFuelState, data: DashboardData, modifier: Modifier) {
    val active = data.activeFast
    val preset = data.profile.fastingPreset.substringBefore(':').toIntOrNull() ?: 16
    LazyColumn(modifier.fillMaxSize(), contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { ScreenHeader("Fasting", if (active == null) "Ready when you are" else "Your fast is running") }
        item {
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(22.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(if (active == null) "${data.profile.fastingPreset} plan" else "${active.targetHours}-hour fast", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
                    Text(if (active == null) "Start a new fasting session" else "Started ${active.startedAt.replace('T', ' ').take(16)}", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.height(20.dp))
                    Button({ state.updateFast(if (active == null) "start" else "end", preset) }, Modifier.fillMaxWidth()) {
                        Text(if (active == null) "Start fasting" else "End fast")
                    }
                }
            }
        }
        item { Text("Recent sessions", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold) }
        items(data.fasts.take(10)) {
            Card(Modifier.fillMaxWidth()) { Text("${it.targetHours} hours · ${it.startedAt.take(10)} · ${if (it.endedAt == null) "Active" else "Completed"}", Modifier.padding(16.dp)) }
        }
    }
}

@Composable
private fun ProfileScreen(state: PairFuelState, data: DashboardData, modifier: Modifier) {
    LazyColumn(modifier.fillMaxSize(), contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { ScreenHeader("Profile", data.email) }
        item { MetricCard("Goal weight", data.profile.goalWeight?.let { "$it kg" } ?: "Not set", "Current PairFuel target", Modifier.fillMaxWidth()) }
        item { Text("App theme", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold) }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                PairFuelTheme.entries.forEach { theme ->
                    OutlinedButton({ state.theme = theme }, Modifier.weight(1f), enabled = state.theme != theme) { Text(theme.name.lowercase().replaceFirstChar { it.uppercase() }) }
                }
            }
        }
        item { OutlinedButton(state::refresh, Modifier.fillMaxWidth()) { Text("Sync now") } }
        item { Button(state::logout, Modifier.fillMaxWidth()) { Text("Sign out") } }
        item { Text("Native Android · No WebView", Modifier.fillMaxWidth(), color = MaterialTheme.colorScheme.onSurfaceVariant) }
    }
}

@Composable
private fun FoodDialog(onDismiss: () -> Unit, onSave: (String, String, Int, Float, Float, Float, String) -> Unit) {
    var name by remember { mutableStateOf("") }; var meal by remember { mutableStateOf("Lunch") }
    var calories by remember { mutableStateOf("") }; var protein by remember { mutableStateOf("0") }
    var carbs by remember { mutableStateOf("0") }; var fat by remember { mutableStateOf("0") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add food") },
        text = { Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(name, { name = it }, label = { Text("Food") }, singleLine = true)
            OutlinedTextField(meal, { meal = it }, label = { Text("Meal") }, singleLine = true)
            OutlinedTextField(calories, { calories = it }, label = { Text("Calories") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), singleLine = true)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(protein, { protein = it }, Modifier.weight(1f), label = { Text("Protein") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), singleLine = true)
                OutlinedTextField(carbs, { carbs = it }, Modifier.weight(1f), label = { Text("Carbs") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), singleLine = true)
            }
            OutlinedTextField(fat, { fat = it }, label = { Text("Fat") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), singleLine = true)
        } },
        confirmButton = { TextButton(onClick = {
            onSave(name, meal, calories.toIntOrNull() ?: 0, protein.toFloatOrNull() ?: 0f, carbs.toFloatOrNull() ?: 0f, fat.toFloatOrNull() ?: 0f, LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm")))
        }, enabled = name.isNotBlank() && calories.toIntOrNull() != null) { Text("Save") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}

@Composable
private fun WeightDialog(onDismiss: () -> Unit, onSave: (Float, String) -> Unit) {
    var weight by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add weight") },
        text = { OutlinedTextField(weight, { weight = it }, label = { Text("Weight (kg)") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), singleLine = true) },
        confirmButton = { TextButton(onClick = { onSave(weight.toFloatOrNull() ?: 0f, LocalDate.now().toString()) }, enabled = (weight.toFloatOrNull() ?: 0f) > 0f) { Text("Save") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}
