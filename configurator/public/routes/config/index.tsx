import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import style from "./style.module.css";
import { invoke } from "@tauri-apps/api";

import { VTSForm, getVtsDefaults } from "./vts";
import { OBSForm, getObsDefaults } from "./obs";
import ServerForm from "./server";
import {
  AppConfig,
  OBSConfigData,
  VTSConfigData,
  ServerConfig,
  PluginConfig,
} from "./types";

/*
 * Main component
 */

const Config = () => {
  const [obsConfig, setObsConfig] = useState<OBSConfigData | undefined>(
    undefined
  );
  const [vtsConfig, setVtsConfig] = useState<VTSConfigData | undefined>(
    undefined
  );
  const [serverConfig, setServerConfig] = useState<ServerConfig | undefined>(
    undefined
  );
  const [statusState, setStatusState] = useState<string>("");
  const [configFolder, setConfigFolder] = useState<string>("");

  // blank array param means only run on component mount (once)
  useEffect(() => {
    invoke("get_config_folder").then((confRaw) => {
      setConfigFolder(confRaw as string);
    });
  }, []);

  useEffect(() => {
    if (configFolder.length === 0) {
      return;
    }

    invoke("get_config").then((conf) => {
      const loadedAppConfig = conf as AppConfig;
      setServerConfig({
        addr: loadedAppConfig.addr,
        port: loadedAppConfig.port,
      });

      let obsLoaded = false;
      let vtsLoaded = false;

      for (const plugin of loadedAppConfig.plugins) {
        if (typeof plugin === "string") {
          continue;
        }

        if ("OBS" in plugin) {
          setObsConfig(plugin.OBS);
          obsLoaded = true;
        } else if ("VTS" in plugin) {
          setVtsConfig(plugin.VTS);
          vtsLoaded = true;
        }
      }

      if (!obsLoaded) {
        setObsConfig(getObsDefaults());
      }
      if (!vtsLoaded) {
        setVtsConfig(getVtsDefaults(configFolder));
      }
    });
  }, [configFolder]);

  const onServerConfChange = (newData: ServerConfig) => {
    setServerConfig(newData);
  };

  const onObsConfChange = (newData: OBSConfigData) => {
    setObsConfig(newData);
  };

  const onVtsConfChange = (newData: VTSConfigData) => {
    setVtsConfig(newData);
  };

  const clearStatusMsg = () => {
    setStatusState("");
  };

  const saveConfig = () => {
    if (
      typeof serverConfig === "undefined" ||
      typeof obsConfig === "undefined" ||
      typeof vtsConfig === "undefined"
    ) {
      setStatusState("Error occurred: Configuration has not finished loading");
      return;
    }

    const plugins: PluginConfig[] = [
      { OBS: obsConfig },
      { VTS: vtsConfig },
      "General",
    ];
    const appConfig: AppConfig = {
      addr: serverConfig.addr,
      port: serverConfig.port,
      plugins,
    };
    invoke("save_config", { conf: appConfig })
      .then(() => {
        setStatusState("Configuration saved, please restart the app to apply");
      })
      .catch((err) => {
        setStatusState(`Error occurred: ${err.toString()}`);
      });
  };

  return (
    <div class={style.config}>
      <h1>General Configuration</h1>

      <form>
        <button type="button" onClick={saveConfig}>
          Save
        </button>
        <p>
          {statusState}
          {statusState.length > 0 && (
            <button type="button" onClick={clearStatusMsg}>
              Clear
            </button>
          )}
        </p>
        <ServerForm conf={serverConfig} onChange={onServerConfChange} />
        <OBSForm
          conf={obsConfig}
          onChange={onObsConfChange}
          msgFunc={setStatusState}
        />
        <VTSForm
          conf={vtsConfig}
          configFolder={configFolder}
          onChange={onVtsConfChange}
          msgFunc={setStatusState}
        />
      </form>
    </div>
  );
};

export default Config;
