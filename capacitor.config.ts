import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.idkmanlool9.nfcmanager",
  appName: "NFC Card Manager",
  webDir: "out",
  bundledWebRuntime: false,
  android: {
    allowMixedContent: false,
  },
  server: {
    androidScheme: "https",
  },
};

export default config;
