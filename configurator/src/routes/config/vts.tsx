import { h, Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api";

import { VTSConfigData } from "./types";

/*
 * VTS configuration component
 */

interface VTSFormProps {
  conf?: VTSConfigData;
  configFolder: string;
  onChange: (newConf: VTSConfigData) => void;
  msgFunc: (msg: string) => void;
}

const getVtsDefaults = (configFolder: string) => {
  return {
    addr: "ws://localhost:8001",
    token_file: `${configFolder}/vts_token.txt`,
  } as VTSConfigData;
};

const VTSForm = ({
  conf: confProp,
  configFolder,
  onChange,
  msgFunc,
}: VTSFormProps) => {
  const [conf, setConf] = useState<VTSConfigData>(getVtsDefaults(configFolder));

  useEffect(() => {
    setConf(confProp ? confProp : getVtsDefaults(configFolder));
  }, [configFolder, confProp]);

  const addrInput = (e: Event) => {
    if (e.target) {
      onChange({ ...conf, addr: (e.target as HTMLInputElement).value });
    }
  };

  const testConnection = () => {
    invoke("test_vts_connection", { conf }).then((res) => {
      const result = res as boolean;
      msgFunc(
        `VTube Studio connection test ${result ? "successful" : "failed"}`
      );
    });
  };

  return (
    <Fragment>
      <h2>VTube Studio</h2>
      <label>
        WebSocket Full Address:{" "}
        <input type="text" value={conf.addr} onInput={addrInput} />
      </label>
      <br />
      <button type="button" onClick={testConnection}>
        Test connection
      </button>
    </Fragment>
  );
};

export { VTSForm, getVtsDefaults };
