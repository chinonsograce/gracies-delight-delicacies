import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export const palette = {
  cream: "#FBF7F0",
  ink: "#2E2318",
  muted: "#7A6A58",
  accent: "#8A4B2A",
  accentSoft: "#F3E4D7",
  ok: "#2F7D4F",
  warn: "#B4690E",
  line: "#E5D9C9",
  white: "#FFFFFF",
};

export function Btn({
  label,
  onPress,
  disabled,
  tone = "accent",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "accent" | "ghost" | "ok";
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, tone === "ghost" && styles.btnGhost, tone === "ok" && styles.btnOk, disabled && styles.btnDisabled]}
    >
      <Text style={[styles.btnLabel, tone === "ghost" && styles.btnLabelGhost]}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize="none"
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  );
}

export function Chip({ label, tone = "muted" }: { label: string; tone?: "muted" | "ok" | "warn" | "accent" }) {
  const color = tone === "ok" ? palette.ok : tone === "warn" ? palette.warn : tone === "accent" ? palette.accent : palette.muted;
  return (
    <View style={[styles.chip, { borderColor: color }]}>
      <Text style={[styles.chipLabel, { color }]}>{label}</Text>
    </View>
  );
}

export function Busy({ label }: { label: string }) {
  return (
    <View style={styles.busy}>
      <ActivityIndicator color={palette.accent} />
      <Text style={styles.busyLabel}>{label}</Text>
    </View>
  );
}

export function Notice({ text }: { text: string }) {
  if (!text) return null;
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: palette.accent,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  btnGhost: { backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line },
  btnOk: { backgroundColor: palette.ok },
  btnDisabled: { opacity: 0.5 },
  btnLabel: { color: palette.white, fontWeight: "700", fontSize: 15 },
  btnLabelGhost: { color: palette.ink },
  field: { marginBottom: 12 },
  fieldLabel: { color: palette.muted, fontSize: 13, marginBottom: 4 },
  input: {
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: palette.ink,
    fontSize: 15,
  },
  inputMultiline: { minHeight: 70, textAlignVertical: "top" },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginRight: 6 },
  chipLabel: { fontSize: 12, fontWeight: "600" },
  busy: { alignItems: "center", paddingVertical: 40, gap: 10 },
  busyLabel: { color: palette.muted },
  notice: {
    backgroundColor: palette.accentSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  noticeText: { color: palette.ink, fontSize: 14 },
});
