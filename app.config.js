export default {
  expo: {
    name: "살려드림",
    slug: "SaveDream",
    version: "1.0.0",

    // 현재 UI가 가로형이므로 landscape
    orientation: "landscape",

    // 앱 아이콘
    //icon: "./src/assets/image/icon.png",

    scheme: "savedream",
    userInterfaceStyle: "light",
    newArchEnabled: true,

    androidStatusBar: {
      hidden: true,
    },

    ios: {
      supportsTablet: true,
      // 앱 식별자 (Xcode 서명 시 다른 팀과 겹치면 바꿔서 사용)
      bundleIdentifier: "com.savedream.app",
    },

    android: {
      package: "com.savedream.app",
    },

    // android: {
    //   adaptiveIcon: {
    //     foregroundImage: "./src/assets/image/icon.png",
    //     backgroundColor: "#FFFFFF",
    //   },
    //   edgeToEdgeEnabled: true,
    //   predictiveBackGestureEnabled: false,
    // },

    // web: {
    //   favicon: "./src/assets/image/icon.png",
    // },

    plugins: [
      [
        "expo-font",
        {
          fonts: [
            "./src/assets/fonts/NotoSansKR-Light.ttf",
            "./src/assets/fonts/NotoSansKR-Regular.ttf",
            "./src/assets/fonts/NotoSansKR-Medium.ttf",
            "./src/assets/fonts/NotoSansKR-SemiBold.ttf",
            "./src/assets/fonts/NotoSansKR-Bold.ttf",
          ],
        },
      ],

      [
        "expo-splash-screen",
        {
          //image: "./src/assets/image/splash.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#FFFFFF",
        },
      ],
    ],
  },
};
