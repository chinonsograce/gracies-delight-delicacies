import React from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { BASE } from "../config";
import { groupProducts, money, type Product, type Variant } from "../types";
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
  const available = variants.filter((v) => v.is_available);
  const waitlist = variants.filter((v) => !v.is_available);
  const products = groupProducts([...available, ...waitlist]);

  return (
    <View style={styles.wrap}>
      <Notice text={error} />
      <FlatList
        data={products}
        keyExtractor={(product) => product.key}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.heading}>Today at Grace's Delight</Text>
        }
        renderItem={({ item }) => {
          const first = item.variants[0];
          const anyAvailable = item.variants.some((v) => v.is_available);
          const prices = item.variants.map((v) => v.price_minor);
          const lowest = Math.min(...prices);
          const manyPrices = Math.max(...prices) !== lowest;
          const optionLabel =
            item.variants.length > 1
              ? item.variants.length + " options: " + item.variants.map((v) => v.option).join(", ")
              : first.option;
          return (
            <Pressable style={styles.card} onPress={() => onOpen(item)}>
              {first.image_path ? (
                <Image source={{ uri: BASE + first.image_path }} style={styles.thumb} resizeMode="cover" />
              ) : (
                <View style={[styles.thumb, styles.thumbEmpty]} />
              )}
              <View style={styles.cardBody}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.option}>{optionLabel}</Text>
                <View style={styles.chips}>
                  <Chip label={(manyPrices ? "From " : "") + money(lowest, first.currency)} tone="accent" />
                  {!anyAvailable && <Chip label="waitlist" tone="warn" />}
                  {item.variants.some((v) => v.is_dev_price) && <Chip label="demo price" tone="muted" />}
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
  heading: { fontSize: 20, fontWeight: "800", color: palette.ink, marginBottom: 4 },
  card: {
    backgroundColor: palette.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.line,
    flexDirection: "row",
    overflow: "hidden",
  },
  thumb: { width: 96, height: 96, backgroundColor: palette.accentSoft },
  thumbEmpty: { backgroundColor: palette.accentSoft },
  cardBody: { flex: 1, padding: 10, gap: 4 },
  name: { fontSize: 16, fontWeight: "700", color: palette.ink },
  option: { fontSize: 13, color: palette.muted },
  chips: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
});
