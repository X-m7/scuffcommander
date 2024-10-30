import { h, Fragment } from "preact";
import { invoke } from "@tauri-apps/api/core";

import { OBSConfigData } from "/types/config";

/*
 * OBS configuration component
 */

interface OBSFormProps {
  conf?: OBSConfigData;
  onChange: (newConf: OBSConfigData) => void;
  msgFunc: (msg: string) => void;
}

const getObsDefaults = () => {
  return {
    addr: "localhost",
    port: 4455,
    password: undefined,
  } as OBSConfigData;
};

const OBSForm = ({ conf: confProp, onChange, msgFunc }: OBSFormProps) => {
  const conf = confProp ?? getObsDefaults();

  const addrInput = (e: Event) => {
    if (e.target) {
      onChange({ ...conf, addr: (e.target as HTMLInputElement).value });
    }
  };

  const portInput = (e: Event) => {
    if (e.target) {
      onChange({
        ...conf,
        port: parseInt((e.target as HTMLInputElement).value, 10),
      });
    }
  };

  const pwInput = (e: Event) => {
    if (e.target) {
      const pwVal = (e.target as HTMLInputElement).value;

      onChange({
        ...conf,
        password: pwVal.length === 0 ? undefined : pwVal,
      });
    }
  };

  const testConnection = () => {
    invoke("test_obs_connection", { conf }).then((res) => {
      const result = res as boolean;
      msgFunc(`OBS Studio connection test ${result ? "successful" : "failed"}`);
    });
  };

  return (
    <Fragment>
      <h2>OBS Studio</h2>
      <label>
        WebSocket Address:
        <input type="text" value={conf.addr} onInput={addrInput} />
      </label>
      <br />
      <label>
        WebSocket Port:
        <input type="number" value={conf.port} onInput={portInput} />
      </label>
      <br />
      <label>
        Password:
        <input type="password" value={conf.password} onInput={pwInput} />
      </label>
      <br />
      <button type="button" onClick={testConnection}>
        Test connection
      </button>
    </Fragment>
  );
};

export { OBSForm, getObsDefaults };
