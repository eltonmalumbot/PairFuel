import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.eltonmalumbot.pairfuel",
  appName: "PairFuel",
  webDir: "public",
  server: {
    url: "https://pairfuel.vercel.app",
    cleartext: false,
    errorPath: "offline.html",
  },
  android: {
    backgroundColor: "#07130e",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
