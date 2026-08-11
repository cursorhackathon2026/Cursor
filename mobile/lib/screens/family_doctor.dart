import 'package:flutter/material.dart';
import '../api.dart';
import '../theme.dart';
import '../widgets.dart';

class FamilyDoctorScreen extends StatefulWidget {
  const FamilyDoctorScreen({super.key});
  @override
  State<FamilyDoctorScreen> createState() => _FamilyDoctorScreenState();
}

class _FamilyDoctorScreenState extends State<FamilyDoctorScreen> {
  List<Alert> _tasks = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final a = await Api.alerts();
      setState(() {
        _tasks = a;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Serverga ulanib bo‘lmadi: $apiBase';
        _loading = false;
      });
    }
  }

  Future<void> _done(String id) async {
    await Api.ackAlert(id);
    setState(() {
      _tasks = _tasks
          .map((t) => t.id == id
              ? Alert(t.id, t.patientName, t.zone, t.reason, t.recommendation,
                  t.createdAt, 'bajarildi', t.urgent)
              : t)
          .toList();
    });
  }

  @override
  Widget build(BuildContext c) {
    final active = _tasks.where((t) => t.status == 'ochiq').toList();
    final red = active.where((t) => t.zone == 'Qizil').length;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Aktiv chaqiruv',
            style: TextStyle(fontWeight: FontWeight.w800)),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
          IconButton(
              onPressed: () => Navigator.of(c).pop(),
              icon: const Icon(Icons.logout)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(padding: const EdgeInsets.all(16), children: [
                    Row(children: [
                      Expanded(
                          child: StatTile('Aktiv chaqiruv', '${active.length}',
                              accent: brand)),
                      const SizedBox(width: 12),
                      Expanded(
                          child: StatTile('Shoshilinch', '$red',
                              accent: zoneRed)),
                    ]),
                    const SizedBox(height: 14),
                    ..._tasks.map((t) {
                      final done = t.status != 'ochiq';
                      return Opacity(
                        opacity: done ? 0.55 : 1,
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: SectionCard(
                            child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(children: [
                                    Expanded(
                                      child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(t.patientName,
                                                style: const TextStyle(
                                                    fontWeight:
                                                        FontWeight.w700)),
                                            Text(t.reason,
                                                style: TextStyle(
                                                    fontSize: 12,
                                                    color: Theme.of(c)
                                                        .hintColor)),
                                          ]),
                                    ),
                                    ZoneBadge(t.zone),
                                  ]),
                                  const SizedBox(height: 10),
                                  Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                        color: Theme.of(c)
                                            .dividerColor
                                            .withOpacity(0.4),
                                        borderRadius:
                                            BorderRadius.circular(10)),
                                    child: Text('Tavsiya: ${t.recommendation}',
                                        style: const TextStyle(fontSize: 13)),
                                  ),
                                  const SizedBox(height: 10),
                                  if (!done)
                                    Row(children: [
                                      Expanded(
                                        child: FilledButton.icon(
                                          style: FilledButton.styleFrom(
                                              backgroundColor: brand),
                                          onPressed: () {},
                                          icon: const Icon(Icons.call,
                                              size: 18),
                                          label: const Text('Qo‘ng‘iroq'),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: OutlinedButton.icon(
                                          onPressed: () => _done(t.id),
                                          icon: const Icon(Icons.check,
                                              size: 18),
                                          label: const Text('Bajarildi'),
                                        ),
                                      ),
                                    ])
                                  else
                                    const Text('✓ Bajarildi',
                                        style: TextStyle(
                                            color: zoneGreen,
                                            fontWeight: FontWeight.w700)),
                                ]),
                          ),
                        ),
                      );
                    }),
                  ]),
                ),
    );
  }
}
