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
