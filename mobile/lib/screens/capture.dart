import 'package:flutter/material.dart';
import '../api.dart';
import '../theme.dart';
import '../widgets.dart';

const _symptoms = {
  'bosh_ogrigi': "Bosh og'rig'i",
  'koz_parcha': "Ko'z oldida parcha",
  'kongil_aynishi': "Ko'ngil aynishi",
  'shish': "Shish (qo'l/yuz)",
  'qorin_ogrigi': "Qorin og'rig'i",
  'harakat_kamaygan': "Harakat kamaygan",
};

class CaptureScreen extends StatefulWidget {
  const CaptureScreen({super.key});
  @override
  State<CaptureScreen> createState() => _CaptureScreenState();
}

class _CaptureScreenState extends State<CaptureScreen> {
  List<PatientListItem> _patients = [];
  String? _pid;
  final _bpSys = TextEditingController();
  final _bpDia = TextEditingController();
  final _weight = TextEditingController();
  final _hb = TextEditingController();
  final _glu = TextEditingController();
  final _week = TextEditingController();
  final Set<String> _sel = {};
  bool _busy = false;
  String? _error;
  EncounterResult? _result;

  @override
  void initState() {
    super.initState();
    _loadPatients();
  }

  Future<void> _loadPatients() async {
    try {
      final p = await Api.patients();
      setState(() {
        _patients = p;
        if (p.isNotEmpty) _pid = p.first.id;
      });
    } catch (e) {
      setState(() => _error = 'Ulanish xatosi: $apiBase');
    }
  }

  @override
  void dispose() {
    for (final c in [_bpSys, _bpDia, _weight, _hb, _glu, _week]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    if (_pid == null) return;
    setState(() {
      _busy = true;
      _result = null;
      _error = null;
    });
    try {
      final vitals = {
        'bp_sys': int.tryParse(_bpSys.text),
        'bp_dia': int.tryParse(_bpDia.text),
        'weight': double.tryParse(_weight.text),
        'hemoglobin': int.tryParse(_hb.text),
        'glucose': double.tryParse(_glu.text),
        'gestational_week': int.tryParse(_week.text),
      };
      final res = await Api.addEncounter(_pid!, vitals, _sel.toList());
      setState(() => _result = res);
    } catch (e) {
      setState(() => _error = 'Xatolik: $e');
    } finally {
      setState(() => _busy = false);
    }
  }

  void _reset() => setState(() {
        for (final c in [_bpSys, _bpDia, _weight, _hb, _glu, _week]) {
          c.clear();
        }
        _sel.clear();
        _result = null;
      });

  Widget _field(String label, TextEditingController c,
          {bool decimal = false}) =>
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label,
            style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Theme.of(context).hintColor)),
        const SizedBox(height: 4),
        TextField(
          controller: c,
          keyboardType:
              TextInputType.numberWithOptions(decimal: decimal),
          decoration: const InputDecoration(
              isDense: true, border: OutlineInputBorder()),
        ),
      ]);

  @override
  Widget build(BuildContext ctx) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ko‘rik qo‘shish',
            style: TextStyle(fontWeight: FontWeight.w800)),
        actions: [
          IconButton(
              onPressed: () => Navigator.of(ctx).pop(),
              icon: const Icon(Icons.logout)),
        ],
      ),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
              color: zoneGreen.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12)),
          child: Row(children: [
            Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                    color: zoneGreen, shape: BoxShape.circle)),
            const SizedBox(width: 8),
            const Text('Sinxronlashtirildi · hozir',
                style: TextStyle(
                    color: zoneGreen, fontWeight: FontWeight.w600)),
          ]),
        ),
        const SizedBox(height: 14),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(_error!, style: const TextStyle(color: zoneRed)),
          ),
        SectionCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Bemorni tanlang',
                style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Theme.of(ctx).hintColor)),
            const SizedBox(height: 6),
            DropdownButton<String>(
              isExpanded: true,
              value: _pid,
              items: _patients
                  .map((p) => DropdownMenuItem(
                      value: p.id,
                      child: Text('${p.name} · ${p.gestationalWeek} hafta')))
                  .toList(),
              onChanged: (v) => setState(() => _pid = v),
            ),
          ]),
        ),
        const SizedBox(height: 12),
        SectionCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Asosiy ko‘rsatkichlar',
                style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: _field('Sistolik (BP)', _bpSys)),
              const SizedBox(width: 10),
              Expanded(child: _field('Diastolik (BP)', _bpDia)),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: _field('Gemoglobin', _hb)),
              const SizedBox(width: 10),
              Expanded(child: _field('Glyukoza', _glu, decimal: true)),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: _field('Vazn (kg)', _weight, decimal: true)),
              const SizedBox(width: 10),
              Expanded(child: _field('Homilalik haftasi', _week)),
            ]),
          ]),
        ),
        const SizedBox(height: 12),
        SectionCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Belgilar (${_sel.length})',
                style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _symptoms.entries.map((e) {
                final on = _sel.contains(e.key);
                return FilterChip(
                  label: Text(e.value),
                  selected: on,
                  onSelected: (_) => setState(() =>
                      on ? _sel.remove(e.key) : _sel.add(e.key)),
                );
              }).toList(),
            ),
          ]),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            style: FilledButton.styleFrom(
                backgroundColor: brand,
                padding: const EdgeInsets.symmetric(vertical: 14)),
            onPressed: _busy ? null : _submit,
            child: Text(_busy ? 'Tahlil qilinmoqda…' : 'Saqlash va tahlil qilish',
                style: const TextStyle(
                    fontSize: 16, fontWeight: FontWeight.w700)),
          ),
        ),
        if (_result != null) ...[
          const SizedBox(height: 16),
          SectionCard(
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('AI tahlil natijasi',
                            style: TextStyle(
                                fontWeight: FontWeight.w800, fontSize: 16)),
                        ZoneBadge(_result!.assessment.zone, large: true),
                      ]),
                  if (_result!.zoneChanged) ...[
                    const SizedBox(height: 8),
                    Text(
                        'Zona o‘zgardi: ${_result!.previousZone} → ${_result!.assessment.zone}',
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                  ],
                  const SizedBox(height: 14),
                  FactorList(_result!.assessment.factors),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                        color: Theme.of(ctx).dividerColor.withOpacity(0.4),
                        borderRadius: BorderRadius.circular(10)),
                    child: Text('Tavsiya: ${_result!.assessment.recommendation}'),
                  ),
                  if (_result!.alert != null) ...[
                    const SizedBox(height: 10),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                          color: zoneRed.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8)),
                      child: const Text('🔔 Mutaxassisga ogohlantirish yuborildi',
                          style: TextStyle(
                              color: zoneRed, fontWeight: FontWeight.w700)),
                    ),
                  ],
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                        onPressed: _reset,
                        child: const Text('Yangi ko‘rik')),
                  ),
                ]),
          ),
        ],
      ]),
    );
  }
}
