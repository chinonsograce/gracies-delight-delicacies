import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as AuthSession from "expo-auth-session";
import { api } from "./src/api";
import { auth } from "./src/auth";
import { SCHEME } from "./src/config";
import { subscribeCartChanges } from "./src/realtime";
import { CartScreen } from "./src/screens/CartScreen";
import { CheckoutScreen } from "./src/screens/CheckoutScreen";
import { OrderScreen } from "./src/screens/OrderScreen";
import { OrdersScreen } from "./src/screens/OrdersScreen";
import { ProductScreen } from "./src/screens/ProductScreen";
import { ShopScreen } from "./src/screens/ShopScreen";
import type { Line, Order, Product, Profile, Variant } from "./src/types";
import { normalizeCatalog } from "./src/types";
import { Busy, palette } from "./src/ui";

type Screen =
  | { name: "shop" }
  | { name: "product"; product: Product }
  | { name: "cart" }
  | { name: "checkout" }
  | { name: "order"; order: Order }
  | { name: "orders" };

export default function App() {
  const [booting, setBooting] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: "shop" });

  const [config, setConfig] = useState<{ url: string | null; key: string | null }>({ url: null, key: null });
  const [variants, setVariants] = useState<Variant[]>([]);
  const [catalogError, setCatalogError] = useState("");

  const [lines, setLines] = useState<Line[]>([]);
  const [cartBusy, setCartBusy] = useState(false);
  const [cartError, setCartError] = useState("");

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersError, setOrdersError] = useState("");

  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState("");

  const redirectUri = useMemo(() => {
    const uri = AuthSession.makeRedirectUri({ scheme: SCHEME, path: "oauth2redirect" });
    // Supabase only redirects back to an allowlisted URI; Expo Go uses exp://, a build uses the scheme.
    console.log("OAuth redirect URI to allowlist in Supabase:", uri);
    return uri;
  }, []);

  const refreshCart = useCallback(async (current?: string | null) => {
    const active = current === undefined ? token : current;
    if (!active) return;
    try {
      setLines(await api.cart(active));
    } catch {
      /* realtime refresh failures are non-fatal */
    }
  }, [token]);

  const refreshOrders = useCallback(async (current: string | null) => {
    if (!current) return;
    try {
      setOrders(await api.orders(current));
      setOrdersError("");
    } catch (e) {
      setOrdersError(e instanceof Error ? e.message : "Could not load orders.");
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [cfg, catalog] = await Promise.all([
        api.config().catch(() => ({ url: null, key: null })),
        api.catalog().catch(() => null),
      ]);
      if (!alive) return;
      setConfig(cfg);
      if (catalog) setVariants(normalizeCatalog(catalog.variants));
      else setCatalogError("Could not reach the shop. Check your connection.");

      const restored = await auth.restore().catch(() => null);
      if (!alive) return;
      if (restored) {
        setToken(restored);
        setProfile(await api.profile(restored).catch(() => null));
        setLines(await api.cart(restored).catch(() => []));
        setOrders(await api.orders(restored).catch(() => []));
      }
      setBooting(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    return subscribeCartChanges(config, token, () => {
      void refreshCart(token);
    });
  }, [token, config, refreshCart]);

  const signIn = async () => {
    setSigningIn(true);
    setAuthError("");
    try {
      const { token: fresh, profile: me } = await auth.signIn(redirectUri);
      setToken(fresh);
      setProfile(me);
      setLines(await api.cart(fresh).catch(() => []));
      setOrders(await api.orders(fresh).catch(() => []));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Sign-in failed.";
      setAuthError(message.includes("cancelled") ? message : message + "\nAllowlist this redirect URI in Supabase: " + redirectUri);
    } finally {
      setSigningIn(false);
    }
  };

  const signOut = async () => {
    await auth.clear();
    setToken(null);
    setProfile(null);
    setLines([]);
    setOrders([]);
    setScreen({ name: "shop" });
  };

  const setQty = async (variant_id: string, quantity: number) => {
    if (!token) return;
    setCartBusy(true);
    setCartError("");
    try {
      setLines(quantity === 0 ? await api.removeLine(token, variant_id) : await api.setLine(token, variant_id, quantity));
    } catch (e) {
      setCartError(e instanceof Error ? e.message : "Cart update failed.");
    } finally {
      setCartBusy(false);
    }
  };

  const clearBag = async () => {
    if (!token) return;
    setCartBusy(true);
    try {
      setLines(await api.clearCart(token));
    } catch (e) {
      setCartError(e instanceof Error ? e.message : "Could not clear the bag.");
    } finally {
      setCartBusy(false);
    }
  };

  const placeOrder = async (payload: Parameters<typeof api.createOrder>[1]) => {
    if (!token) return;
    const order = await api.createOrder(token, payload);
    setLines(await api.cart(token).catch(() => []));
    setOrders(await api.orders(token).catch(() => []));
    setScreen({ name: "order", order });
  };

  const payOrder = async (id: string) => {
    if (!token) throw new Error("Sign in first.");
    const order = await api.pay(token, id);
    setOrders(await api.orders(token).catch(() => []));
    return order;
  };

  const badge = lines.reduce((sum, line) => sum + line.quantity, 0);

  if (booting) {
    return (
      <View style={styles.boot}>
        <Busy label="Opening the bakery…" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.cream} />
      <View style={styles.header}>
        <Pressable onPress={() => setScreen({ name: "shop" })}>
          <Text style={styles.title}>{"Grace's Delight"}</Text>
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerBtn} onPress={() => (token ? setScreen({ name: "orders" }) : void signIn())}>
            <Text style={styles.headerLabel}>Orders</Text>
          </Pressable>
          <Pressable style={styles.headerBtn} onPress={() => setScreen({ name: "cart" })}>
            <Text style={styles.headerLabel}>Bag{badge > 0 ? " (" + badge + ")" : ""}</Text>
          </Pressable>
          <Pressable style={styles.headerBtn} onPress={() => (token ? void signOut() : void signIn())} disabled={signingIn}>
            <Text style={styles.headerLabel}>{signingIn ? "…" : token ? "Sign out" : "Sign in"}</Text>
          </Pressable>
        </View>
      </View>
      {authError ? (
        <View style={styles.authError}>
          <Text style={styles.authErrorText}>{authError}</Text>
        </View>
      ) : null}

      <View style={styles.body}>
        {screen.name === "shop" && (
          <ShopScreen variants={variants} error={catalogError} onOpen={(product) => setScreen({ name: "product", product })} />
        )}
        {screen.name === "product" && (
          <ProductScreen
            key={screen.product.key}
            product={screen.product}
            signedIn={Boolean(token)}
            onAdd={async (variant, quantity) => {
              if (!token) return;
              const existing = lines.find((line) => line.variant_id === variant.id)?.quantity || 0;
              setLines(await api.setLine(token, variant.id, existing + quantity));
            }}
            onBack={() => setScreen({ name: "shop" })}
          />
        )}
        {screen.name === "cart" && (
          <CartScreen
            lines={lines}
            variants={variants}
            signedIn={Boolean(token)}
            busy={cartBusy}
            error={cartError}
            onQty={setQty}
            onRemove={(variant_id) => setQty(variant_id, 0)}
            onClear={clearBag}
            onCheckout={() => setScreen({ name: "checkout" })}
            onSignIn={() => void signIn()}
            onBrowse={() => setScreen({ name: "shop" })}
          />
        )}
        {screen.name === "checkout" && profile && (
          <CheckoutScreen
            profile={profile}
            lines={lines.filter((l) => variants.some((v) => v.id === l.variant_id))}
            onSubmit={placeOrder}
            onBack={() => setScreen({ name: "cart" })}
          />
        )}
        {screen.name === "order" && (
          <OrderScreen order={screen.order} onPay={payOrder} onBack={() => setScreen({ name: "orders" })} />
        )}
        {screen.name === "orders" && (
          <OrdersScreen
            orders={orders}
            error={ordersError}
            onOpen={(order) => setScreen({ name: "order", order })}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.cream },
  boot: { flex: 1, backgroundColor: palette.cream, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
    backgroundColor: palette.cream,
  },
  title: { fontSize: 18, fontWeight: "800", color: palette.accent },
  headerActions: { flexDirection: "row", gap: 12 },
  headerBtn: { paddingVertical: 4 },
  headerLabel: { fontSize: 14, fontWeight: "600", color: palette.ink },
  authError: { backgroundColor: palette.accentSoft, paddingHorizontal: 14, paddingVertical: 8 },
  authErrorText: { color: palette.ink, fontSize: 13 },
  body: { flex: 1 },
});
