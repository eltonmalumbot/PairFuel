package com.eltonmalumbot.pairfuel

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val Green = darkColorScheme(
    primary = Color(0xFF7BF59F),
    onPrimary = Color(0xFF06220F),
    background = Color(0xFF07130E),
    surface = Color(0xFF102219),
    surfaceVariant = Color(0xFF173326),
    onBackground = Color(0xFFF5FFF8),
    onSurface = Color(0xFFF5FFF8),
)

private val Pink = darkColorScheme(
    primary = Color(0xFFFF8FB7),
    onPrimary = Color(0xFF3B071A),
    background = Color(0xFF1B0A12),
    surface = Color(0xFF32131F),
    surfaceVariant = Color(0xFF4A1D2D),
    onBackground = Color(0xFFFFF5F8),
    onSurface = Color(0xFFFFF5F8),
)

private val Blue = darkColorScheme(
    primary = Color(0xFF78C8FF),
    onPrimary = Color(0xFF001F33),
    background = Color(0xFF07131C),
    surface = Color(0xFF102735),
    surfaceVariant = Color(0xFF173A4D),
    onBackground = Color(0xFFF4FAFF),
    onSurface = Color(0xFFF4FAFF),
)

@Composable
fun PairFuelTheme(theme: PairFuelTheme, content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = when (theme) {
            PairFuelTheme.GREEN -> Green
            PairFuelTheme.PINK -> Pink
            PairFuelTheme.BLUE -> Blue
        },
        content = content,
    )
}
