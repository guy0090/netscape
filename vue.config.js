const { defineConfig } = require("@vue/cli-service");

module.exports = defineConfig({
  transpileDependencies: true,

  pluginOptions: {
    electronBuilder: {
      chainWebpackMainProcess: (config) => {
        config.module
          .rule("node")
          .test(/\.node$/)
          .use("node-loader")
          .loader("node-loader");

        config.module
          .rule("compile")
          .test(/\.(js|ts|vue)$/)
          .use("babel")
          .loader("babel-loader")
          .options({
            presets: ["@vue/cli-plugin-babel/preset"],
            plugins: [
              "@babel/plugin-transform-typescript",
              "@babel/plugin-proposal-optional-chaining",
              "@babel/plugin-proposal-nullish-coalescing-operator",
              "@babel/plugin-proposal-class-properties",
              "@babel/plugin-proposal-private-methods",
            ],
          });

        config.module
          .rule("babel")
          .test(/\.(js|ts|vue)$/)
          .before("ts")
          .use("babel")
          .loader("babel-loader")
          .options({
            presets: ["@vue/cli-plugin-babel/preset"],
            plugins: [
              "@babel/plugin-transform-typescript",
              "@babel/plugin-proposal-optional-chaining",
              "@babel/plugin-proposal-nullish-coalescing-operator",
              "@babel/plugin-proposal-class-properties",
              "@babel/plugin-proposal-private-methods",
            ],
          });
      },
      customFileProtocol: "./",
      builderOptions: {
        productName: "Netscape Navigator",
        appId: "netscape.app",
        publish: ["github"],
        extraFiles: ["meter-data/"],
        fileAssociations: [
          {
            ext: "enc",
            name: "LOA Encounter",
            description: "LOA Encounter File",
          },
        ],
        nsis: {
          perMachine: false,
        },
        win: {
          target: ["nsis"],
          icon: "public/icons/netscape.png",
          requestedExecutionLevel: "requireAdministrator",
        },
      },
      preload: "src/preload.js",
    },
  },
});
