import { h, Fragment } from "preact";

import { OBSConfigData } from "./types";

/*
 * OBS configuration component
 */

interface OBSFormProps {
  conf?: OBSConfigData;
  onChange: (newConf: OBSConfigData) => void;
}

const OBSForm = (props: OBSFormProps) => {
  const conf = props.conf ?? { addr: "localhost", port: 4455, password: "" };

  const addrInput = (e: Event) => {
    if (e.target) {
      props.onChange({ ...conf, addr: (e.target as HTMLInputElement).value });
    }
  };

  const portInput = (e: Event) => {
    if (e.target) {
      props.onChange({
        ...conf,
        port: parseInt((e.target as HTMLInputElement).value, 10),
      });
    }
  };

  const pwInput = (e: Event) => {
    if (e.target) {
      props.onChange({
        ...conf,
        password: (e.target as HTMLInputElement).value,
      });
    }
  };

  return (
    <Fragment>
      <h2>OBS Studio</h2>
      <label>
        WebSocket Address:{" "}
        <input type="text" value={conf.addr} onInput={addrInput} />
      </label>
      <br />
      <label>
        WebSocket Port:{" "}
        <input type="number" value={conf.port} onInput={portInput} />
      </label>
      <br />
      <label>
        Password: <input type="text" value={conf.password} onInput={pwInput} />
      </label>
      <br />
    </Fragment>
  );
};

export default OBSForm;
