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
        extraFiles: [
          {
            from: "binary/oo2net_9_win64.dll",
            to: "oo2net_9_win64.dll",
          },
          {
            from: "binary/49ee656f-9dfa-452f-be9b-ec6c698a20e7.exe",
            to: "49ee656f-9dfa-452f-be9b-ec6c698a20e7.exe",
          },
          {
            from: "binary/49ee656f-9dfa-452f-be9b-ec6c698a20e7.exe.ini",
            to: "49ee656f-9dfa-452f-be9b-ec6c698a20e7.exe.ini",
          },
        ],
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
