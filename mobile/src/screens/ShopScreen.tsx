import React, { useState } from "react";
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BASE } from "../config";
import { CATEGORY_ORDER, groupProducts, money, type Product, type Variant } from "../types";
import { Chip, Notice, palette } from "../ui";

export function ShopScreen({
  variants,
  error,
  onOpen,
}: {
  variants: Variant[];
  error: string;
  onOpen: (product: Product) => void;
}) {
  const [category, setCategory] = useState("All bakes");
  const inCategory = category === "All bakes" ? variants : variants.filter((v) => v.collection === category);
  const available = inCategory.filter((v) => v.is_available);
  const waitlist = inCategory.filter((v) => !v.is_available);
  const products = groupProducts([...available, ...waitlist]);

  return (
    <View style={styles.wrap}>
      <Notice text={error} />
      <FlatList
        data={products}
        keyExtractor={(product) => product.key}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Text style={styles.heading}>{"Today at Grace's Delight"}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rail}
              accessibilityRole="tablist"
            >
              {CATEGORY_ORDER.map((c) => {
                const active = c === category;
                return (
                  <Pressable
                    key={c}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    style={[styles.railChip, active && styles.railChipActive]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={[styles.railLabel, active && styles.railLabelActive]}>{c}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Nothing in this category right now.</Text>
        }
        renderItem={({ item }) => {
          const first = item.variants[0];
          const anyAvailable = item.variants.some((v) => v.is_available);
          const prices = item.variants.map((v) => v.price_minor);
          const lowest = Math.min(...prices);
          const manyPrices = Math.max(...prices) !== lowest;
          return (
            <Pressable style={styles.card} onPress={() => onOpen(item)}>
              {first.image_path ? (
                <Image source={{ uri: BASE + first.image_path }} style={styles.thumb} resizeMode="cover" />
              ) : (
                <View style={[styles.thumb, styles.thumbEmpty]} />
              )}
              <View style={styles.cardBody}>
                <Text style={styles.collection}>{item.collection}</Text>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.chips}>
                  <Chip label={(manyPrices ? "From " : "") + money(lowest, first.currency)} tone="accent" />
                  {!anyAvailable && <Chip label="waitlist" tone="warn" />}
                  {item.variants.some((v) => v.is_dev_price) && <Chip label="demo price" tone="muted" />}
                </View>
                <View style={styles.choose}>
                  <Text style={styles.chooseLabel}>
                    {anyAvailable ? "Choose options" : "View details"}
                    {item.variants.length > 1 ? " · " + item.variants.length + " available" : ""}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: palette.cream },
  list: { padding: 14, gap: 12 },
  heading: { fontSize: 20, fontWeight: "800", color: palette.ink, marginBottom: 10 },
  rail: { gap: 8, paddingRight: 8, marginBottom: 4 },
  railChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.white,
  },
  railChipActive: { backgroundColor: palette.accent, borderColor: palette.accent },
  railLabel: { fontSize: 13, fontWeight: "600", color: palette.muted },
  railLabelActive: { color: palette.white },
  empty: { color: palette.muted, fontSize: 14, paddingVertical: 20, textAlign: "center" },
  card: {
    backgroundColor: palette.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.line,
    flexDirection: "row",
    overflow: "hidden",
  },
  thumb: { width: 104, height: 104, backgroundColor: palette.accentSoft },
  thumbEmpty: { backgroundColor: palette.accentSoft },
  cardBody: { flex: 1, padding: 10, gap: 4 },
  collection: { fontSize: 11, fontWeight: "700", color: palette.muted, letterSpacing: 0.6, textTransform: "uppercase" },
  name: { fontSize: 16, fontWeight: "700", color: palette.ink },
  chips: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  choose: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.accent,
  },
  chooseLabel: { fontSize: 12, fontWeight: "700", color: palette.accent },
});
