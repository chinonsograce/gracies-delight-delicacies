import React, { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BASE } from "../config";
import { money, type Product, type Variant } from "../types";
import { Btn, Chip, Notice, palette } from "../ui";

export function ProductScreen({
  product,
  signedIn,
  onAdd,
  onBack,
}: {
  product: Product;
  signedIn: boolean;
  onAdd: (variant: Variant, quantity: number) => Promise<void>;
  onBack: () => void;
}) {
  const [selectedId, setSelectedId] = useState(
    () => (product.variants.find((v) => v.is_available && v.launch_blockers.length === 0) || product.variants[0]).id,
  );
  const variant = product.variants.find((v) => v.id === selectedId) || product.variants[0];
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const add = async () => {
    setAdding(true);
    setError("");
    try {
      await onAdd(variant, quantity);
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add to cart.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.body}>
      {variant.image_path ? (
        <Image source={{ uri: BASE + variant.image_path }} style={styles.hero} resizeMode="cover" />
      ) : (
        <View style={[styles.hero, styles.heroEmpty]} />
      )}
      <Text style={styles.name}>{variant.name}</Text>
      <Text style={styles.option}>{variant.collection}</Text>

      {product.variants.length > 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose a {product.variants[0].sell_unit === "pack" ? "pack" : "size"}</Text>
          <View style={styles.options}>
            {product.variants.map((option) => (
              <Pressable
                key={option.id}
                style={[styles.optionBtn, option.id === variant.id && styles.optionBtnActive]}
                onPress={() => {
                  setSelectedId(option.id);
                  setQuantity(1);
                }}
              >
                <Text style={[styles.optionLabel, option.id === variant.id && styles.optionLabelActive]}>
                  {option.option}
                </Text>
                <Text style={[styles.optionPrice, option.id === variant.id && styles.optionLabelActive]}>
                  {money(option.price_minor, option.currency)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View style={styles.chips}>
        <Chip label={money(variant.price_minor, variant.currency)} tone="accent" />
        <Chip label={variant.sell_unit} />
        {variant.pieces_per_unit ? <Chip label={variant.pieces_per_unit + " pieces"} /> : null}
        {variant.is_dev_price && <Chip label="demo price" tone="muted" />}
      </View>

      {variant.preset_contents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>In this box</Text>
          {variant.preset_contents.map((line) => (
            <Text key={line} style={styles.bullet}>
              • {line}
            </Text>
          ))}
        </View>
      )}

      {variant.allergen_text ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergens</Text>
          <Text style={styles.plain}>{variant.allergen_text}</Text>
        </View>
      ) : null}

      {variant.launch_blockers.length > 0 && (
        <Notice text={"Not orderable yet: " + variant.launch_blockers.join(", ")} />
      )}

      <Notice text={error} />

      {!signedIn ? (
        <Notice text="Sign in with Google to add items to your cart." />
      ) : (
        <View style={styles.stepperRow}>
          <Btn label="−" tone="ghost" onPress={() => setQuantity((q) => Math.max(1, q - 1))} />
          <Text style={styles.qty}>{quantity}</Text>
          <Btn label="+" tone="ghost" onPress={() => setQuantity((q) => Math.min(99, q + 1))} />
          <View style={styles.addWrap}>
            <Btn
              label={adding ? "Adding…" : "Add to cart"}
              onPress={add}
              disabled={adding || !variant.is_available || variant.launch_blockers.length > 0}
            />
          </View>
        </View>
      )}
      <Btn label="Back to shop" tone="ghost" onPress={onBack} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: palette.cream },
  body: { padding: 14, gap: 10 },
  hero: { width: "100%", height: 220, borderRadius: 14, backgroundColor: palette.accentSoft },
  heroEmpty: { backgroundColor: palette.accentSoft },
  name: { fontSize: 22, fontWeight: "800", color: palette.ink },
  option: { fontSize: 14, color: palette.muted },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionBtn: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  optionBtnActive: { borderColor: palette.accent, backgroundColor: palette.accentSoft },
  optionLabel: { fontSize: 14, fontWeight: "700", color: palette.ink },
  optionLabelActive: { color: palette.accent },
  optionPrice: { fontSize: 12, color: palette.muted },
  section: { gap: 4 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: palette.ink },
  bullet: { color: palette.ink, fontSize: 14 },
  plain: { color: palette.ink, fontSize: 14 },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  qty: { fontSize: 17, fontWeight: "700", color: palette.ink, minWidth: 28, textAlign: "center" },
  addWrap: { flex: 1 },
});
