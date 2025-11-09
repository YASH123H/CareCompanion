// craco.config.js
const path = require("path");
require("dotenv").config();

// Always disable Emergent Visual Editor & Health Check features
const config = {
  disableHotReload: process.env.DISABLE_HOT_RELOAD === "true",
  enableVisualEdits: false, 
  enableHealthCheck: false,
};

const webpackConfig = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {

      // Disable hot reload if needed
      if (config.disableHotReload) {
        webpackConfig.plugins = webpackConfig.plugins.filter(plugin => {
          return !(plugin.constructor.name === 'HotModuleReplacementPlugin');
        });

        webpackConfig.watch = false;
        webpackConfig.watchOptions = { ignored: /.*/ };
      }

      // ✅ Remove Emergent plugins if they slipped in somehow
      webpackConfig.plugins = webpackConfig.plugins.filter(plugin => {
        return !(plugin?.constructor?.name?.includes("Health") || plugin?.constructor?.name?.includes("Metadata"));
      });

      return webpackConfig;
    },
  },
};

module.exports = webpackConfig;
