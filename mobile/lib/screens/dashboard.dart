import 'package:flutter/material.dart';
import '../api.dart';
import '../theme.dart';
import '../widgets.dart';
import 'patient_detail.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Stats? _stats;
  List<PatientListItem> _patients = [];
  String _filter = 'Barchasi';
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
      final s = await Api.stats();
      final p = await Api.patients();
      setState(() {
        _stats = s;
        _patients = p;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Serverga ulanib bo‘lmadi.\n$apiBase\n\n$e';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext c) {
    final shown = _filter == 'Barchasi'
        ? _patients
        : _patients.where((p) => p.zone == _filter).toList();
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Bosh sahifa',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
            Text(_stats?.region ?? 'Navoiy viloyati',
                style: TextStyle(fontSize: 12, color: Theme.of(c).hintColor)),
          ],
        ),
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
              ? _ErrorView(_error!, _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Row(children: [
                        Expanded(
                            child: StatTile(
                                'Jami bemorlar', '${_stats!.total}')),
                        const SizedBox(width: 12),
                        Expanded(
                            child: StatTile('Qizil zona', '${_stats!.qizil}',
                                accent: zoneRed)),
                      ]),
                      const SizedBox(height: 12),
                      Row(children: [
                        Expanded(
                            child: StatTile('Sariq zona', '${_stats!.sariq}',
                                accent: zoneAmber)),
                        const SizedBox(width: 12),
                        Expanded(
                            child: StatTile('Ogohlantirishlar',
                                '${_stats!.openAlerts}',
                                accent: brand)),
                      ]),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 8,
                        children: ['Barchasi', 'Qizil', 'Sariq', 'Yashil']
                            .map((f) => ChoiceChip(
                                  label: Text(f),
                                  selected: _filter == f,
                                  onSelected: (_) =>
                                      setState(() => _filter = f),
                                ))
                            .toList(),
                      ),
                      const SizedBox(height: 8),
                      ...shown.map((p) => _PatientCard(p)),
                      if (shown.isEmpty)
                        Padding(
                          padding: const EdgeInsets.all(24),
                          child: Center(
                              child: Text('Bemor topilmadi',
                                  style: TextStyle(
                                      color: Theme.of(c).hintColor))),
                        ),
                    ],
                  ),
                ),
    );
  }
}

class _PatientCard extends StatelessWidget {
  final PatientListItem p;
  const _PatientCard(this.p);
  @override
  Widget build(BuildContext c) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => Navigator.of(c).push(
            MaterialPageRoute(builder: (_) => PatientDetailScreen(p.id))),
        child: SectionCard(
          child: Row(children: [
            Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(p.name,
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 2),
                    Text('${p.age} yosh · ${p.gestationalWeek} hafta · ${p.reason}',
                        style: TextStyle(
                            fontSize: 12, color: Theme.of(c).hintColor)),
                  ]),
            ),
            ZoneBadge(p.zone),
          ]),
        ),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  final String msg;
  final VoidCallback retry;
  const _ErrorView(this.msg, this.retry);
  @override
  Widget build(BuildContext c) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.wifi_off, size: 40, color: zoneAmber),
            const SizedBox(height: 12),
            Text(msg, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            FilledButton(onPressed: retry, child: const Text('Qayta urinish')),
          ]),
        ),
      );
}
