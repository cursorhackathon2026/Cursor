import 'package:flutter/material.dart';
import 'theme.dart';
import 'screens/dashboard.dart';
import 'screens/capture.dart';
import 'screens/family_doctor.dart';

void main() => runApp(const PerinatalApp());

class PerinatalApp extends StatelessWidget {
  const PerinatalApp({super.key});
  @override
  Widget build(BuildContext c) => MaterialApp(
        title: 'Perinatal Monitoring',
        debugShowCheckedModeBanner: false,
        theme: appTheme(Brightness.light),
        darkTheme: appTheme(Brightness.dark),
        themeMode: ThemeMode.system,
        home: const LoginScreen(),
      );
}

class _Role {
  final String id, title, sub, icon;
  const _Role(this.id, this.title, this.sub, this.icon);
}

const _roles = [
  _Role('hamshira', 'Hamshira', "Ma'lumot kiritish va kuzatuv", '🩺'),
  _Role('mutaxassis', 'Mutaxassis / Shifokor', 'Monitoring va tahlil paneli', '📊'),
  _Role('oilaviy', 'Oilaviy shifokor', 'Kuzatuv va chaqiruv topshiriqlari', '🏠'),
];

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  String _role = 'mutaxassis';

  void _enter() {
    Widget home;
    switch (_role) {
      case 'hamshira':
        home = const CaptureScreen();
        break;
      case 'oilaviy':
        home = const FamilyDoctorScreen();
        break;
      default:
        home = const DashboardScreen();
    }
    Navigator.of(context)
        .pushReplacement(MaterialPageRoute(builder: (_) => home));
  }

  @override
  Widget build(BuildContext c) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                      color: brand, borderRadius: BorderRadius.circular(16)),
                  alignment: Alignment.center,
                  child: const Text('P',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 26,
                          fontWeight: FontWeight.w800)),
                ),
                const SizedBox(height: 14),
                const Text('Perinatal Monitoring',
                    style:
                        TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                const SizedBox(height: 4),
                Text("Ona va chaqaloq sog‘ligini kuzatish tizimi",
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Theme.of(c).hintColor)),
                const SizedBox(height: 24),
                ..._roles.map((r) {
                  final sel = _role == r.id;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(14),
                      onTap: () => setState(() => _role = r.id),
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: sel ? brand.withOpacity(0.06) : null,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                              color: sel ? brand : Theme.of(c).dividerColor,
                              width: sel ? 2 : 1),
                        ),
                        child: Row(children: [
                          Text(r.icon, style: const TextStyle(fontSize: 22)),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(r.title,
                                      style: TextStyle(
                                          fontWeight: FontWeight.w700,
                                          color: sel ? brand : null)),
                                  Text(r.sub,
                                      style: TextStyle(
                                          fontSize: 12,
                                          color: Theme.of(c).hintColor)),
                                ]),
                          ),
                          Icon(
                              sel
                                  ? Icons.radio_button_checked
                                  : Icons.radio_button_unchecked,
                              color: sel ? brand : Theme.of(c).hintColor),
                        ]),
                      ),
                    ),
                  );
                }),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                        backgroundColor: brand,
                        padding: const EdgeInsets.symmetric(vertical: 14)),
                    onPressed: _enter,
                    child: const Text('Kirish',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w700)),
                  ),
                ),
                const SizedBox(height: 10),
                Text("Demo rejimi · sintetik ma'lumot",
                    style: TextStyle(
                        fontSize: 12, color: Theme.of(c).hintColor)),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}
