import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { money, type Order } from "../types";
import { Chip, Notice, palette } from "../ui";
import { pickupLabel, statusTone } from "./OrderScreen";

export function OrdersScreen({
  orders,
  error,
  onOpen,
}: {
  orders: Order[];
  error: string;
  onOpen: (order: Order) => void;
}) {
  return (
    <View style={styles.wrap}>
      <Notice text={error} />
      {orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.centerTitle}>No orders yet.</Text>
          <Text style={styles.centerText}>Your placed orders will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(order) => order.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => onOpen(item)}>
              <View style={styles.cardTop}>
                <Text style={styles.ref}>{item.reference}</Text>
                <Text style={styles.total}>{money(item.total_minor, item.currency)}</Text>
              </View>
              <Text style={styles.pickup}>Pickup: {pickupLabel(item.pickup_at)}</Text>
              <View style={styles.chips}>
                <Chip label={item.payment_status} tone={statusTone(item.payment_status)} />
                <Chip label={item.approval_status} tone={statusTone(item.approval_status)} />
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: palette.cream },
  list: { padding: 14, gap: 10 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  centerTitle: { fontSize: 17, fontWeight: "700", color: palette.ink },
  centerText: { fontSize: 14, color: palette.muted },
  card: {
    backgroundColor: palette.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 12,
    gap: 6,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ref: { fontSize: 15, fontWeight: "700", color: palette.ink },
  total: { fontSize: 15, fontWeight: "800", color: palette.accent },
  pickup: { fontSize: 13, color: palette.muted },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
});
