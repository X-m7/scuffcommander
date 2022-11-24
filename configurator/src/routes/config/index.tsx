import { h, Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";
import style from "./style.css";
import { invoke } from "@tauri-apps/api";
import { AppConfig, PluginConfig } from "./types";

interface AppConfigViewProps {
  conf?: AppConfig;
}

const renderPluginConfig = (conf: PluginConfig) => {
  if (typeof conf === "string") {
    return undefined;
  }
  if ("OBS" in conf) {
    return (
      <Fragment>
        <h2>OBS Studio Plugin</h2>
        WebSocket address: {conf.OBS.addr} <br />
        WebSocket port: {conf.OBS.port} <br />
        WebSocket password: {conf.OBS.password}
      </Fragment>
    );
  }
  if ("VTS" in conf) {
    return (
      <Fragment>
        <h2>VTube Studio Plugin Configuration</h2>
        WebSocket address: {conf.VTS.addr} <br />
        Token file: {conf.VTS.token_file}
      </Fragment>
    );
  }

  return undefined;
};

const AppConfigView = ({ conf }: AppConfigViewProps) => {
  if (typeof conf === "undefined") {
    return <div />;
  }
  return (
    <Fragment>
      <h2>Server</h2>
      Address: {conf.addr}
      <br />
      Port: {conf.port}
      <br />
      {conf.plugins.map(renderPluginConfig)}
    </Fragment>
  );
};

const Config = () => {
  const [appConfig, setAppConfig] = useState<AppConfig | undefined>(undefined);

  const loadAppConfig = async () => {
    const conf = await invoke("get_config");
    setAppConfig(conf as AppConfig);
  };

  useEffect(() => {
    loadAppConfig().then();
  }, []);

  return (
    <div class={style.config}>
      <h1>General Configuration</h1>

      <AppConfigView conf={appConfig} />
    </div>
  );
};

export default Config;
