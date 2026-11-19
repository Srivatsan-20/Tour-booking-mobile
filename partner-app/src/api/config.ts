import { Linking, NativeModules, Platform } from 'react-native';

const DEFAULT_API_PORT = 5115;

let cachedApiBaseUrl: string | null = null;

function trimTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, '');
}

function isLocalhost(host: string): boolean {
  const h = host.toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '::1';
}

function extractHost(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Common forms:
  // - "192.168.1.18:8081"
  // - "exp://192.168.1.18:8081/--/"
  // - "http://192.168.1.18:8081/index.bundle?..."
  const schemeMatch = /^[a-z]+:\/\/([^\/:?#]+)(?::[0-9]+)?/i.exec(trimmed);
  if (schemeMatch?.[1]) return schemeMatch[1];

  const firstSegment = (trimmed.split('/')[0] ?? '').trim();
  const hostPortMatch = /^([^\/:?#]+)(?::[0-9]+)?$/.exec(firstSegment);
  if (hostPortMatch?.[1]) return hostPortMatch[1];

  return null;
}

function tryReadExpoGoHostFromExponentConstants(): string | null {
  try {
    const exponentConstants: any = (NativeModules as any)?.ExponentConstants;
    if (!exponentConstants) return null;

    const candidates: unknown[] = [
      exponentConstants?.debuggerHost,
      exponentConstants?.hostUri,
      exponentConstants?.experienceUrl,
      exponentConstants?.linkingUri,
    ];

    const manifestRaw: any = exponentConstants?.manifest ?? exponentConstants?.manifestString;
    const manifest: any =
      typeof manifestRaw === 'string' && manifestRaw ? JSON.parse(manifestRaw) : manifestRaw;

    candidates.push(
      manifest?.debuggerHost,
      manifest?.hostUri,
      manifest?.extra?.expoGo?.debuggerHost,
      manifest?.bundleUrl,
      manifest?.launchAsset?.url,
    );

    for (const c of candidates) {
      if (typeof c !== 'string') continue;
      const host = extractHost(c);
      if (host) return host;
    }
  } catch {
    // ignore
  }

  return null;
}

function inferDevMachineHostSync(): string | null {
  // Only attempt inference in dev; in production `scriptURL` may be `file://...`.
  if (!__DEV__) return null;

  // Web: use the current page host.
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
  }

  // Expo Go: ExponentConstants is the most reliable place to get the LAN host.
  const expoGoHost = tryReadExpoGoHostFromExponentConstants();
  if (expoGoHost) return expoGoHost;

  // Native: infer from the Metro bundle URL (usually points at the dev machine).
  const scriptURL: unknown = (NativeModules as any)?.SourceCode?.scriptURL;
  if (typeof scriptURL === 'string' && scriptURL) {
    const host = extractHost(scriptURL);
    if (host) return host;
  }

  return null;
}

function isExpoTunnelHost(host: string): boolean {
  const h = host.toLowerCase();
  return h === 'u.expo.dev' || h.endsWith('.exp.direct') || h.endsWith('.expo.dev');
}

function resolveApiBaseUrlSync(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv.trim();
  }

  // Default behavior: assume API is running on the same machine as Metro (dev only).
  const inferredHost = inferDevMachineHostSync();
  const host =
    inferredHost && !isExpoTunnelHost(inferredHost) && !isLocalhost(inferredHost)
      ? inferredHost
      : 'localhost';
  return `http://${host}:${DEFAULT_API_PORT}`;
}

/**
 * Preferred: resolves at runtime and can use async sources (e.g. Linking initial URL on Android).
 */
export async function getApiBaseUrl(): Promise<string> {
  if (cachedApiBaseUrl) return cachedApiBaseUrl;

  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv && fromEnv.trim()) {
    cachedApiBaseUrl = trimTrailingSlashes(fromEnv.trim());
    return cachedApiBaseUrl;
  }

  // First attempt: sync inference (ExponentConstants/scriptURL/window).
  const inferredHost = inferDevMachineHostSync();
  if (inferredHost && !isExpoTunnelHost(inferredHost) && !isLocalhost(inferredHost)) {
    cachedApiBaseUrl = `http://${inferredHost}:${DEFAULT_API_PORT}`;
    return cachedApiBaseUrl;
  }

  // Second attempt (Android/Expo Go): Linking initial URL often contains the LAN host.
  if (__DEV__ && Platform.OS !== 'web') {
    const initialUrl = await Linking.getInitialURL().catch(() => null);
    if (typeof initialUrl === 'string' && initialUrl) {
      const hostFromUrl = extractHost(initialUrl);
      if (hostFromUrl && !isExpoTunnelHost(hostFromUrl) && !isLocalhost(hostFromUrl)) {
        cachedApiBaseUrl = `http://${hostFromUrl}:${DEFAULT_API_PORT}`;
        return cachedApiBaseUrl;
      }
    }
  }

  cachedApiBaseUrl = `http://localhost:${DEFAULT_API_PORT}`;
  return cachedApiBaseUrl;
}

// Backwards-compatible constant (sync). Prefer `getApiBaseUrl()` for Android devices.
export const API_BASE_URL = trimTrailingSlashes(resolveApiBaseUrlSync());
