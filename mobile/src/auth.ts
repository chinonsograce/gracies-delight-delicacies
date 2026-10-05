import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { api } from "./api";
import type { Profile } from "./types";

const TOKEN_KEY = "sb_access_token";
const REFRESH_KEY = "sb_refresh_token";

export type Session = { access_token: string; refresh_token?: string };

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/** base64url without btoa: Hermes has no reliable global base64 encoder. */
function base64url(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += ALPHABET[b0 >> 2];
    out += ALPHABET[((b0 & 3) << 4) | (b1 >> 4)];
    if (i + 1 < bytes.length) out += ALPHABET[((b1 & 15) << 2) | (b2 >> 6)];
    if (i + 2 < bytes.length) out += ALPHABET[b2 & 63];
  }
  return out;
}

/** Query/hash param lookup; React Native's URL does not expose searchParams. */
function param(url: string, name: string): string | null {
  const search = url.includes("?") ? url.slice(url.indexOf("?") + 1) : url.includes("#") ? url.slice(url.indexOf("#") + 1) : "";
  for (const pair of search.split("&")) {
    const [key, value = ""] = pair.split("=");
    if (decodeURIComponent(key) === name) return decodeURIComponent(value.replace(/\+/g, " "));
  }
  return null;
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export const auth = {
  async storedToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },

  async save(session: Session): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, session.access_token);
    if (session.refresh_token) await SecureStore.setItemAsync(REFRESH_KEY, session.refresh_token);
  },

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },

  /** Validate a stored token; on failure try one refresh. Returns a usable token or null. */
  async restore(): Promise<string | null> {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) return null;
    try {
      await api.profile(token);
      return token;
    } catch {
      /* fall through to refresh */
    }
    const refresh = await SecureStore.getItemAsync(REFRESH_KEY);
    if (!refresh) {
      await auth.clear();
      return null;
    }
    const config = await api.config();
    if (!config.url || !config.key) return null;
    const response = await fetch(config.url + "/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: config.key },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    const data = (await response.json().catch(() => ({}))) as Session & { error?: string };
    if (!response.ok || !data.access_token) {
      await auth.clear();
      return null;
    }
    await auth.save(data);
    return data.access_token;
  },

  /** Google sign-in through Supabase PKCE in an in-app browser. Returns the fresh token. */
  async signIn(redirectUri: string): Promise<{ token: string; profile: Profile }> {
    const config = await api.config();
    if (!config.url || !config.key) throw new Error("Auth config unavailable.");

    const verifier = base64url(Crypto.getRandomBytes(32));
    const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier);
    const challenge = base64url(hexToBytes(digest));

    const authorize =
      config.url +
      "/auth/v1/authorize?provider=google&scopes=openid%20email%20profile" +
      "&redirect_to=" + encodeURIComponent(redirectUri) +
      "&code_challenge=" + encodeURIComponent(challenge) +
      "&code_challenge_method=s256";

    const result = await WebBrowser.openAuthSessionAsync(authorize, redirectUri);
    if (result.type !== "success" || !result.url) throw new Error("Sign-in was cancelled.");

    const code = param(result.url, "code");
    if (!code) throw new Error(param(result.url, "error_description") || "Sign-in failed.");

    const response = await fetch(config.url + "/auth/v1/token?grant_type=pkce", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: config.key },
      body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
    });
    const session = (await response.json().catch(() => ({}))) as Session & { error?: string };
    if (!response.ok || !session.access_token) throw new Error(session.error || "Token exchange failed.");

    await auth.save(session);
    const profile = await api.profile(session.access_token);
    return { token: session.access_token, profile };
  },
};
