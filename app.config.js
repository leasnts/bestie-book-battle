const IS_DEV = process.env.APP_VARIANT === "development";

export default {
  expo: {
    name: IS_DEV ? "BBB (Dev)" : "bestiebookbattle",
    slug: "bestie-book-battle",
    version: "1.1.0",
    orientation: "portrait",
    icon: "./assets/images/app_icon.png",
    scheme: "bestie-book-battle",
    // "light" et non "automatic" : l'app n'a aucune variante sombre. Déclarer
    // "automatic" laissait iOS passer ses propres surfaces en sombre — alertes,
    // clavier, barre de navigation en verre des sheets — au-dessus d'un contenu
    // resté clair. Tant qu'un vrai thème sombre n'existe pas, mieux vaut
    // l'assumer que servir un entre-deux incohérent.
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#fdfcfa",
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
            "./assets/fonts/FrauncesSoft_400Regular.ttf",
            "./assets/fonts/FrauncesSoft_600SemiBold.ttf",
            "./assets/fonts/FrauncesSoft_700Bold.ttf",
            "./assets/fonts/FrauncesSoftDisplay_600SemiBold.ttf",
            "./node_modules/@expo-google-fonts/nunito/400Regular/Nunito_400Regular.ttf",
            "./node_modules/@expo-google-fonts/nunito/500Medium/Nunito_500Medium.ttf",
            "./node_modules/@expo-google-fonts/nunito/600SemiBold/Nunito_600SemiBold.ttf",
            "./node_modules/@expo-google-fonts/nunito/700Bold/Nunito_700Bold.ttf",
            "./node_modules/@expo-google-fonts/nunito/800ExtraBold/Nunito_800ExtraBold.ttf",
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
