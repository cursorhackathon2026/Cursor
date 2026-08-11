import 'dart:convert';
import 'package:http/http.dart' as http;

/// Backend manzili. Build vaqtida almashtirish mumkin:
///   flutter build apk --dart-define=API_BASE=http://<IP>:8000
/// Emulator uchun: http://10.0.2.2:8000
const apiBase = String.fromEnvironment(
  'API_BASE',
  defaultValue: 'http://192.168.43.157:8000',
);

class Factor {
  final String label, severity, detail;
  final int points;
  Factor(this.label, this.points, this.severity, this.detail);
  factory Factor.j(Map m) =>
      Factor(m['label'], m['points'], m['severity'], m['detail']);
}

class Assessment {
  final String zone, recommendation;
  final int score;
  final bool urgent;
  final List<Factor> factors;
  Assessment(this.zone, this.score, this.urgent, this.factors, this.recommendation);
  factory Assessment.j(Map m) => Assessment(
        m['zone'],
        m['score'],
        m['urgent'],
        (m['factors'] as List).map((f) => Factor.j(f)).toList(),
        m['recommendation'],
      );
}

class PatientListItem {
  final String id, name, zone, updatedAt, reason;
  final int age, gestationalWeek;
  PatientListItem(this.id, this.name, this.age, this.gestationalWeek, this.zone,
      this.reason, this.updatedAt);
  factory PatientListItem.j(Map m) {
    final r = (m['reason'] as List);
    return PatientListItem(m['id'], m['name'], m['age'], m['gestational_week'],
        m['zone'], r.isNotEmpty ? r[0]['label'] : '—', m['updated_at']);
  }
}

class Encounter {
  final String ts;
  final Map vitals;
  final List symptoms;
  final Assessment assessment;
  Encounter(this.ts, this.vitals, this.symptoms, this.assessment);
  factory Encounter.j(Map m) => Encounter(m['ts'], m['vitals'] ?? {},
      m['symptoms'] ?? [], Assessment.j(m['assessment']));
}

class Patient {
  final String id, name, phone, region, currentZone;
  final int age, gestationalWeek;
  final List<Encounter> encounters;
  Patient(this.id, this.name, this.age, this.gestationalWeek, this.phone,
      this.region, this.currentZone, this.encounters);
  factory Patient.j(Map m) => Patient(
        m['id'], m['name'], m['age'], m['gestational_week'], m['phone'],
        m['region'], m['current_zone'],
        (m['encounters'] as List).map((e) => Encounter.j(e)).toList(),
      );
}

class Alert {
  final String id, patientName, zone, reason, recommendation, createdAt, status;
  final bool urgent;
  Alert(this.id, this.patientName, this.zone, this.reason, this.recommendation,
      this.createdAt, this.status, this.urgent);
  factory Alert.j(Map m) => Alert(m['id'], m['patient_name'], m['zone'],
      m['reason'], m['recommendation'], m['created_at'], m['status'], m['urgent']);
}

class Stats {
  final int total, qizil, sariq, yashil, openAlerts;
  final String region;
  Stats(this.total, this.qizil, this.sariq, this.yashil, this.openAlerts, this.region);
  factory Stats.j(Map m) => Stats(m['total'], m['qizil'], m['sariq'],
      m['yashil'], m['open_alerts'], m['region']);
}

class EncounterResult {
  final Assessment assessment;
  final String previousZone;
  final bool zoneChanged;
  final Alert? alert;
  EncounterResult(this.assessment, this.previousZone, this.zoneChanged, this.alert);
  factory EncounterResult.j(Map m) => EncounterResult(
        Assessment.j(m['assessment']),
        m['previous_zone'],
        m['zone_changed'],
        m['alert'] != null ? Alert.j(m['alert']) : null,
      );
}

class Api {
  static Future<dynamic> _get(String p) async {
    final r = await http.get(Uri.parse('$apiBase$p'));
    if (r.statusCode != 200) throw Exception('GET $p → ${r.statusCode}');
    return jsonDecode(utf8.decode(r.bodyBytes));
  }

  static Future<Stats> stats() async => Stats.j(await _get('/api/stats'));

  static Future<List<PatientListItem>> patients([String? zone]) async {
    final d = await _get('/api/patients${zone != null ? '?zone=$zone' : ''}');
    return (d as List).map((m) => PatientListItem.j(m)).toList();
  }

  static Future<Patient> patient(String id) async =>
      Patient.j(await _get('/api/patients/$id'));

  static Future<List<Alert>> alerts() async {
    final d = await _get('/api/alerts');
    return (d as List).map((m) => Alert.j(m)).toList();
  }

  static Future<EncounterResult> addEncounter(
      String pid, Map vitals, List<String> symptoms) async {
    final r = await http.post(
      Uri.parse('$apiBase/api/encounters'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'patient_id': pid,
        'vitals': vitals,
        'symptoms': symptoms,
        'use_llm': true,
      }),
    );
    if (r.statusCode != 200) throw Exception('POST → ${r.statusCode}');
    return EncounterResult.j(jsonDecode(utf8.decode(r.bodyBytes)));
  }

  static Future<void> ackAlert(String id) async {
    await http.post(Uri.parse('$apiBase/api/alerts/$id/ack'));
  }
}
