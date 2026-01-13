import { app as e } from "../../scripts/app.js";
const n = {
  name: "ComfyUI-Data-Manager",
  version: "1.0.0",
  setup: () => {
    console.log("[DataManager] Extension setup");
  },
  cleanup: () => {
    console.log("[DataManager] Extension cleanup");
  }
};
e.registerExtension(n);
export {
  n as extensionConfig
};
//# sourceMappingURL=extension.js.map
