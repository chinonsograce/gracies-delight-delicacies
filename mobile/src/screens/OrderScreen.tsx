import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { money, type Order } from "../types";
import { Btn, Chip, Notice, palette } from "../ui";

export function statusTone(status: string): "ok" | "warn" | "muted" {
  if (status === "paid" || status === "approved" || status === "ready" || status === "sent") return "ok";
  if (status === "pending") return "warn";
  return "muted";
}

/** Hermes formats dates without full Intl support; show the raw value when parsing fails. */
export function pickupLabel(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

export function OrderScreen({
  order,
  onPay,
  onBack,
}: {
  order: Order;
  onPay: (id: string) => Promise<Order>;
  onBack: () => void;
}) {
  const [current, setCurrent] = useState(order);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const items = current.items || current.order_items || [];
  const canPay =
    current.payment_status === "pending" &&
    (current.approval_status === "approved" || current.approval_status === "not_required");

  const pay = async () => {
    setBusy(true);
    setError("");
    try {
      setCurrent(await onPay(current.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.body}>
      <Text style={styles.heading}>Order {current.reference}</Text>
      <View style={styles.chips}>
        <Chip label={"payment: " + current.payment_status} tone={statusTone(current.payment_status)} />
        <Chip label={"approval: " + current.approval_status} tone={statusTone(current.approval_status)} />
        {current.fulfilment_status && (
          <Chip label={"fulfilment: " + current.fulfilment_status} tone={statusTone(current.fulfilment_status)} />
        )}
      </View>
      <Text style={styles.total}>{money(current.total_minor, current.currency)}</Text>
      <Text style={styles.pickup}>Pickup: {pickupLabel(current.pickup_at)}</Text>

      {items.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {items.map((item, index) => (
            <Text key={index} style={styles.bullet}>
              • {item.quantity} {item.sell_unit}(s) — {item.name} ({item.option})
              {item.pieces_per_unit ? " · " + item.quantity * item.pieces_per_unit + " pieces" : ""}
              {item.preset_contents?.length ? "\n  " + item.preset_contents.join(", ") : ""}
            </Text>
          ))}
        </View>
      )}

      <Notice text={error} />
      {canPay && <Btn label={busy ? "Paying…" : "Simulate payment (demo)"} tone="ok" onPress={pay} disabled={busy} />}
      {current.payment_status === "paid" && <Notice text="Paid. We will have it ready for pickup." />}
      {current.email_status ? (
        <Text style={styles.pickup}>Confirmation email: {current.email_status.split("_").join(" ")}</Text>
      ) : null}
      <Btn label="Back" tone="ghost" onPress={onBack} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: palette.cream },
  body: { padding: 14, gap: 10 },
  heading: { fontSize: 20, fontWeight: "800", color: palette.ink },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  total: { fontSize: 22, fontWeight: "800", color: palette.accent },
  pickup: { fontSize: 14, color: palette.muted },
  section: { gap: 4 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: palette.ink },
  bullet: { color: palette.ink, fontSize: 14 },
});
