import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { money, type Line, type Variant } from "../types";
import { Btn, Notice, palette } from "../ui";

export function CartScreen({
  lines,
  variants,
  signedIn,
  busy,
  error,
  onQty,
  onRemove,
  onClear,
  onCheckout,
  onSignIn,
  onBrowse,
}: {
  lines: Line[];
  variants: Variant[];
  signedIn: boolean;
  busy: boolean;
  error: string;
  onQty: (variant_id: string, quantity: number) => Promise<void>;
  onRemove: (variant_id: string) => Promise<void>;
  onClear: () => Promise<void>;
  onCheckout: () => void;
  onSignIn: () => void;
  onBrowse: () => void;
}) {
  if (!signedIn) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerTitle}>Your cart is private to your account.</Text>
        <Text style={styles.centerText}>Sign in with Google to see and edit your bag.</Text>
        <Btn label="Sign in with Google" onPress={onSignIn} />
      </View>
    );
  }

  const byId = new Map(variants.map((v) => [v.id, v]));
  const rows = lines
    .map((line) => ({ line, variant: byId.get(line.variant_id) }))
    .filter((row): row is { line: Line; variant: Variant } => Boolean(row.variant));
  const total = rows.reduce((sum, row) => sum + row.variant.price_minor * row.line.quantity, 0);

  return (
    <View style={styles.wrap}>
      <Notice text={error} />
      {rows.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.centerTitle}>Your bag is empty.</Text>
          <Btn label="Browse the shop" tone="ghost" onPress={onBrowse} />
        </View>
      ) : (
        <>
          <ScrollView style={styles.rows} contentContainerStyle={styles.rowsContent}>
            {rows.map(({ line, variant }) => (
              <View key={line.variant_id} style={styles.row}>
                <View style={styles.rowBody}>
                  <Text style={styles.rowName}>{variant.name}</Text>
                  <Text style={styles.rowOption}>
                    {variant.option} • {money(variant.price_minor, variant.currency)}
                  </Text>
                </View>
                <View style={styles.stepper}>
                  <Pressable style={styles.stepBtn} disabled={busy} onPress={() => onQty(line.variant_id, Math.max(0, line.quantity - 1))}>
                    <Text style={styles.stepLabel}>−</Text>
                  </Pressable>
                  <Text style={styles.qty}>{line.quantity}</Text>
                  <Pressable style={styles.stepBtn} disabled={busy} onPress={() => onQty(line.variant_id, Math.min(99, line.quantity + 1))}>
                    <Text style={styles.stepLabel}>+</Text>
                  </Pressable>
                  <Pressable style={styles.stepBtn} disabled={busy} onPress={() => onRemove(line.variant_id)}>
                    <Text style={[styles.stepLabel, styles.removeLabel]}>✕</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{money(total)}</Text>
            </View>
            <Btn label="Checkout" onPress={onCheckout} disabled={busy} />
            <Btn label="Clear bag" tone="ghost" onPress={onClear} disabled={busy} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: palette.cream, padding: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 20 },
  centerTitle: { fontSize: 17, fontWeight: "700", color: palette.ink, textAlign: "center" },
  centerText: { fontSize: 14, color: palette.muted, textAlign: "center" },
  rows: { flex: 1 },
  rowsContent: { gap: 10, paddingBottom: 8 },
  row: {
    backgroundColor: palette.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowBody: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: "700", color: palette.ink },
  rowOption: { fontSize: 13, color: palette.muted },
  stepper: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.cream,
  },
  stepLabel: { fontSize: 16, color: palette.ink },
  removeLabel: { color: palette.warn, fontSize: 13 },
  qty: { fontSize: 15, fontWeight: "700", color: palette.ink, minWidth: 22, textAlign: "center" },
  footer: { marginTop: 16, gap: 10 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 15, color: palette.muted },
  totalValue: { fontSize: 19, fontWeight: "800", color: palette.ink },
});
