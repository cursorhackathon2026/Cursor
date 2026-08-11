import 'package:flutter/material.dart';

const brand = Color(0xFF0D9488);
const zoneRed = Color(0xFFDC2626);
const zoneAmber = Color(0xFFD97706);
const zoneGreen = Color(0xFF16A34A);

Color zoneColor(String z) =>
    z == 'Qizil' ? zoneRed : (z == 'Sariq' ? zoneAmber : zoneGreen);

ThemeData appTheme(Brightness b) {
  final light = b == Brightness.light;
  return ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(seedColor: brand, brightness: b),
    scaffoldBackgroundColor:
        light ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A),
    cardColor: light ? Colors.white : const Color(0xFF1E293B),
    dividerColor: light ? const Color(0xFFE2E8F0) : const Color(0xFF334155),
    fontFamily: 'Roboto',
  );
}
