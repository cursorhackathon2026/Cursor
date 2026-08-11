import 'package:flutter/material.dart';
import '../api.dart';
import '../theme.dart';
import '../widgets.dart';

class PatientDetailScreen extends StatelessWidget {
  final String id;
  const PatientDetailScreen(this.id, {super.key});

  String _initials(String n) =>
      n.split(' ').where((x) => x.isNotEmpty).map((x) => x[0]).take(2).join();

  @override
  Widget build(BuildContext c) {
    return Scaffold(
      appBar: AppBar(title: const Text('Bemor')),
      body: FutureBuilder<Patient>(
        future: Api.patient(id),
        builder: (c, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError || !snap.hasData) {
            return Center(child: Text('Xatolik: ${snap.error}'));
          }
          final p = snap.data!;
          final a = p.encounters.last.assessment;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              SectionCard(
                child: Row(children: [
                  CircleAvatar(
                    radius: 26,
                    backgroundColor: brand.withOpacity(0.12),
                    child: Text(_initials(p.name),
                        style: const TextStyle(
                            fontWeight: FontWeight.w800, color: brand)),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(p.name,
                              style: const TextStyle(
                                  fontSize: 18, fontWeight: FontWeight.w800)),
                          Text('${p.age} yosh · ${p.gestationalWeek} hafta',
                              style: TextStyle(color: Theme.of(c).hintColor)),
                        ]),
                  ),
                  Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                    ZoneBadge(p.currentZone, large: true),
                    const SizedBox(height: 4),
                    Text('Ball: ${a.score}',
                        style:
                            TextStyle(fontSize: 12, color: Theme.of(c).hintColor)),
                  ]),
                ]),
              ),
              const SizedBox(height: 12),
              SectionCard(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Xavf omillari — nega «${p.currentZone}»',
                          style: const TextStyle(fontWeight: FontWeight.w800)),
                      const SizedBox(height: 14),
                      FactorList(a.factors),
                    ]),
              ),
              const SizedBox(height: 12),
              SectionCard(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: const [
                        Text('✦ ', style: TextStyle(color: brand)),
                        Text('AI xavf xulosasi va tavsiya',
                            style: TextStyle(fontWeight: FontWeight.w800)),
                      ]),
                      const SizedBox(height: 10),
                      Text(a.recommendation,
                          style: const TextStyle(height: 1.4)),
                      if (a.urgent) ...[
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 8),
                          decoration: BoxDecoration(
                              color: zoneRed.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8)),
                          child: const Text('⚠ Shoshilinch — kechiktirmang',
                              style: TextStyle(
                                  color: zoneRed,
                                  fontWeight: FontWeight.w700)),
                        ),
                      ],
                      const SizedBox(height: 10),
                      Text('* Qaror qo‘llab-quvvatlash. Yakuniy qaror shifokorda.',
                          style: TextStyle(
                              fontSize: 11, color: Theme.of(c).hintColor)),
                    ]),
              ),
              const SizedBox(height: 12),
              SectionCard(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Ko‘riklar tarixi',
                          style: TextStyle(fontWeight: FontWeight.w800)),
                      const SizedBox(height: 8),
                      ...p.encounters.reversed.map((e) {
                        final v = e.vitals;
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Row(children: [
                            Expanded(
                              child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(e.ts.replaceFirst('T', ' '),
                                        style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                            fontSize: 13)),
                                    Text(
                                        'BP ${v['bp_sys']}/${v['bp_dia']} · Hb ${v['hemoglobin']} · Glu ${v['glucose']}',
                                        style: TextStyle(
                                            fontSize: 12,
                                            color: Theme.of(c).hintColor)),
                                  ]),
                            ),
                            ZoneBadge(e.assessment.zone),
                          ]),
                        );
                      }),
                    ]),
              ),
            ],
          );
        },
      ),
    );
  }
}
