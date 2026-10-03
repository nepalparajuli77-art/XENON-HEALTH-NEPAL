package com.example.telemednepal.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFFFFB4AB),
    onPrimary = Color(0xFF690005),
    primaryContainer = NepalCrimsonDark,
    onPrimaryContainer = Color(0xFFFFDAD6),
    secondary = Color(0xFFAEC6FF),
    onSecondary = Color(0xFF002E69),
    secondaryContainer = NepalRoyalBlueDark,
    onSecondaryContainer = Color(0xFFD8E2FF),
    background = Slate950,
    surface = Slate900,
    onBackground = Slate50,
    onSurface = Slate50,
    surfaceVariant = Slate800,
    onSurfaceVariant = Slate200
)

private val LightColorScheme = lightColorScheme(
    primary = NepalCrimson,
    onPrimary = Color.White,
    primaryContainer = NepalCrimsonContainer,
    onPrimaryContainer = OnNepalCrimsonContainer,
    secondary = NepalRoyalBlue,
    onSecondary = Color.White,
    secondaryContainer = NepalRoyalBlueContainer,
    onSecondaryContainer = OnNepalRoyalBlueContainer,
    background = Slate50,
    surface = Color.White,
    onBackground = Slate900,
    onSurface = Slate900,
    surfaceVariant = Slate100,
    onSurfaceVariant = Slate700
)

@Composable
fun TelemedNepalTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
