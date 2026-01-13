/**
 * ComfyUI Data Manager - Extension Entry Point
 *
 * Temporary placeholder file for build verification.
 * Full implementation will be migrated from web/extension.js
 */

// @ts-ignore - ComfyUI provides this module at runtime
import { app } from "../../scripts/app.js";

// Extension configuration
const extensionConfig = {
  name: "ComfyUI-Data-Manager",
  version: "1.0.0",
  setup: () => {
    console.log("[DataManager] Extension setup");
  },
  cleanup: () => {
    console.log("[DataManager] Extension cleanup");
  }
};

// Register extension
app.registerExtension(extensionConfig);

export { extensionConfig };
