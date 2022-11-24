import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import style from "./style.css";
import { invoke } from "@tauri-apps/api";

import VTSForm from "./vts";
import OBSForm from "./obs";
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

  // blank array param means only run on component mount (once)
  useEffect(() => {
    invoke("get_config").then((conf) => {
      const loadedAppConfig = conf as AppConfig;
      setServerConfig({
        addr: loadedAppConfig.addr,
        port: loadedAppConfig.port,
      });

      for (const plugin of loadedAppConfig.plugins) {
        if (typeof plugin === "string") {
          continue;
        }

        if ("OBS" in plugin) {
          setObsConfig(plugin.OBS);
        } else if ("VTS" in plugin) {
          setVtsConfig(plugin.VTS);
        }
      }
    });
  }, []);

  const onServerConfChange = (newData: ServerConfig) => {
    setServerConfig(newData);
  };

  const onObsConfChange = (newData: OBSConfigData) => {
    setObsConfig(newData);
  };

  const onVtsConfChange = (newData: VTSConfigData) => {
    setVtsConfig(newData);
  };

  const saveConfig = (e: Event) => {
    e.preventDefault();

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

      <form onSubmit={saveConfig}>
        <p>{statusState}</p>
        <ServerForm conf={serverConfig} onChange={onServerConfChange} />
        <OBSForm conf={obsConfig} onChange={onObsConfChange} />
        <VTSForm conf={vtsConfig} onChange={onVtsConfChange} />
        <button type="submit">Save</button>
      </form>
    </div>
  );
};

export default Config;
