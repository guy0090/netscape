const { defineConfig } = require("@vue/cli-service");

module.exports = defineConfig({
  transpileDependencies: true,

  pluginOptions: {
    electronBuilder: {
      // chainWebpackMainProcess: (config) => {
      //   config.module
      //     .rule("babel")
      //     .before("ts")
      //     .use("babel")
      //     .loader("babel-loader")
      //     .options({
      //       presets: [["@babel/preset-env", { modules: "commonjs" }]],
      //       plugins: ["@babel/plugin-proposal-class-properties"],
      //     });
      // },
      customFileProtocol: "./",
      builderOptions: {
        productName: "Netscape Navigator",
        appId: "netscape.app",
        publish: ["github"],
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
