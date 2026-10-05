import React, { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import * as Crypto from "expo-crypto";
import type { Line, Profile } from "../types";
import { Btn, Field, Notice, palette } from "../ui";

/** "2026-10-07T14:00" (device-local) → RFC 3339 with offset. Built from parts: Hermes cannot parse that string. */
function toIso(local: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local.trim());
  if (!m) return null;
  const [year, month, day, hour, minute] = m.slice(1).map(Number);
  const date = new Date(year, month - 1, day, hour, minute);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const pad = (n: number) => String(Math.abs(n)).padStart(2, "0");
  return (
    local.trim().slice(0, 16) +
    ":00" +
    sign +
    pad(Math.floor(offset / 60)) +
    ":" +
    pad(offset % 60)
  );
}

export function CheckoutScreen({
  profile,
  lines,
  onSubmit,
  onBack,
}: {
  profile: Profile;
  lines: Line[];
  onSubmit: (payload: {
    name: string;
    email: string;
    phone: string;
    pickup_at: string;
    notes: string;
    bulk: boolean;
    lines: Line[];
    idempotency_key: string;
  }) => Promise<void>;
  onBack: () => void;
}) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [pickup, setPickup] = useState("");
  const [notes, setNotes] = useState("");
  const [bulk, setBulk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(() => Crypto.randomUUID());

  const submit = async () => {
    const pickup_at = toIso(pickup.trim());
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Name, email and phone are required.");
      return;
    }
    if (!pickup_at) {
      setError("Pickup time looks like: 2026-10-07T14:00");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        pickup_at,
        notes: notes.trim(),
        bulk,
        lines,
        idempotency_key: idempotencyKey,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not place the order.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.body}>
      <Text style={styles.heading}>Checkout</Text>
      <Notice text={error} />
      <Field label="Name" value={name} onChange={setName} placeholder="Your name" />
      <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" keyboardType="email-address" />
      <Field label="Phone" value={phone} onChange={setPhone} placeholder="+234…" keyboardType="phone-pad" />
      <Field label="Pickup time" value={pickup} onChange={setPickup} placeholder="2026-10-07T14:00" />
      <Field label="Notes (optional)" value={notes} onChange={setNotes} multiline placeholder="Gate code, message on the box…" />
      <View style={styles.bulkRow}>
        <Text style={styles.bulkLabel}>Bulk / event order</Text>
        <Switch value={bulk} onValueChange={setBulk} trackColor={{ true: palette.accent }} />
      </View>
      <Btn label={busy ? "Placing order…" : "Place order"} onPress={submit} disabled={busy || lines.length === 0} />
      <Btn label="Back to bag" tone="ghost" onPress={onBack} disabled={busy} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: palette.cream },
  body: { padding: 14, gap: 4 },
  heading: { fontSize: 20, fontWeight: "800", color: palette.ink, marginBottom: 8 },
  bulkRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  bulkLabel: { fontSize: 15, color: palette.ink, fontWeight: "600" },
});
