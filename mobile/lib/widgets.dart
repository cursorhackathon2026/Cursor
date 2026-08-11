import 'package:flutter/material.dart';
import 'api.dart';
import 'theme.dart';

class ZoneBadge extends StatelessWidget {
  final String zone;
  final bool large;
  const ZoneBadge(this.zone, {super.key, this.large = false});
  @override
  Widget build(BuildContext c) {
    final col = zoneColor(zone);
    return Container(
      padding: EdgeInsets.symmetric(
          horizontal: large ? 12 : 10, vertical: large ? 6 : 4),
      decoration: BoxDecoration(
        color: col.withOpacity(0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: col.withOpacity(0.4)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: col, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Text(zone,
            style: TextStyle(
                color: col,
                fontWeight: FontWeight.w700,
                fontSize: large ? 14 : 12)),
      ]),
    );
  }
}

class StatTile extends StatelessWidget {
  final String label, value;
  final Color? accent;
  const StatTile(this.label, this.value, {super.key, this.accent});
  @override
  Widget build(BuildContext c) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(c).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(c).dividerColor),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label,
            style: TextStyle(
                fontSize: 11,
                color: Theme.of(c).hintColor,
                fontWeight: FontWeight.w600)),
        const SizedBox(height: 6),
        Text(value,
            style: TextStyle(
                fontSize: 26, fontWeight: FontWeight.w800, color: accent)),
      ]),
    );
  }
}

class FactorList extends StatelessWidget {
  final List<Factor> factors;
  const FactorList(this.factors, {super.key});
  @override
  Widget build(BuildContext c) {
    if (factors.isEmpty) {
      return Text("Xavf omili aniqlanmadi — ko‘rsatkichlar me’yorda.",
          style: TextStyle(color: Theme.of(c).hintColor));
    }
    final maxP =
        factors.map((f) => f.points).fold<int>(60, (a, b) => b > a ? b : a);
    return Column(
      children: factors.map<Widget>((f) {
        final col = f.severity == 'red' ? zoneRed : zoneAmber;
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(
                  child: Text("${f.severity == 'red' ? '⚠ ' : '◆ '}${f.label}",
                      style: const TextStyle(fontWeight: FontWeight.w600))),
              Text(f.detail,
                  style:
                      TextStyle(fontSize: 11, color: Theme.of(c).hintColor)),
            ]),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: LinearProgressIndicator(
                value: f.points / maxP,
                minHeight: 8,
                backgroundColor: Theme.of(c).dividerColor,
                color: col,
              ),
            ),
          ]),
        );
      }).toList(),
    );
  }
}

class SectionCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  const SectionCard({super.key, required this.child, this.padding});
  @override
  Widget build(BuildContext c) => Container(
        width: double.infinity,
        padding: padding ?? const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(c).cardColor,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Theme.of(c).dividerColor),
        ),
        child: child,
      );
}
