const IS_DEV = process.env.APP_VARIANT === "development";

export default {
  expo: {
    name: IS_DEV ? "BBB (Dev)" : "bestiebookbattle",
    slug: "bestie-book-battle",
    version: "1.1.0",
    orientation: "portrait",
    icon: "./assets/images/app_icon.png",
    scheme: "bestie-book-battle",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      bundleIdentifier: IS_DEV
        ? "com.leasantos.bestiebookbattle.dev"
        : "com.leasantos.bestiebookbattle",
      buildNumber: "1",
      supportsTablet: false,
      usesAppleSignIn: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    plugins: [
      "expo-router",
      [
        "expo-font",
        {
          fonts: [
            "./assets/fonts/SpaceMono-Regular.ttf",
            "./node_modules/@expo-google-fonts/rokkitt/400Regular/Rokkitt_400Regular.ttf",
            "./node_modules/@expo-google-fonts/rokkitt/500Medium/Rokkitt_500Medium.ttf",
            "./node_modules/@expo-google-fonts/rokkitt/600SemiBold/Rokkitt_600SemiBold.ttf",
            "./node_modules/@expo-google-fonts/rokkitt/700Bold/Rokkitt_700Bold.ttf",
            "./node_modules/@expo-google-fonts/work-sans/400Regular/WorkSans_400Regular.ttf",
            "./node_modules/@expo-google-fonts/work-sans/500Medium/WorkSans_500Medium.ttf",
            "./node_modules/@expo-google-fonts/work-sans/600SemiBold/WorkSans_600SemiBold.ttf",
            "./node_modules/@expo-google-fonts/work-sans/700Bold/WorkSans_700Bold.ttf",
          ],
        },
      ],
      "expo-web-browser",
      "expo-apple-authentication",
      "expo-notifications",
      [
        "expo-image-picker",
        {
          photosPermission:
            "bestiebookbattle a besoin d'accéder à tes photos pour ta photo de profil et les couvertures de livres.",
          cameraPermission:
            "bestiebookbattle a besoin d'accéder à ton appareil photo pour photographier les couvertures de livres.",
        },
      ],
      "@react-native-community/datetimepicker",
      "expo-image",
    ],
    updates: {
      url: "https://u.expo.dev/47b87edb-68d3-47d9-8b2b-a46859cc2ea1",
    },
    runtimeVersion: "1.0.0",
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "47b87edb-68d3-47d9-8b2b-a46859cc2ea1",
      },
    },
    android: {
      permissions: ["android.permission.RECORD_AUDIO"],
      package: IS_DEV
        ? "com.leasantos.bestiebookbattle.dev"
        : "com.leasantos.bestiebookbattle",
    },
  },
};
