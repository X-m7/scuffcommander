import { h, Fragment } from "preact";

import { VTSConfigData } from "./types";

/*
 * VTS configuration component
 */

interface VTSFormProps {
  conf?: VTSConfigData;
  onChange: (newConf: VTSConfigData) => void;
}

const VTSForm = (props: VTSFormProps) => {
  const conf = props.conf ?? {
    addr: "ws://localhost:8001",
    token_file: "vts_token.txt",
  };

  const addrInput = (e: Event) => {
    if (e.target) {
      props.onChange({ ...conf, addr: (e.target as HTMLInputElement).value });
    }
  };

  const tokenFileInput = (e: Event) => {
    if (e.target) {
      props.onChange({
        ...conf,
        token_file: (e.target as HTMLInputElement).value,
      });
    }
  };

  return (
    <Fragment>
      <h2>VTube Studio</h2>
      <label>
        WebSocket Full Address:{" "}
        <input type="text" value={conf.addr} onInput={addrInput} />
      </label>
      <br />
      <label>
        Token file:{" "}
        <input type="text" value={conf.token_file} onInput={tokenFileInput} />
      </label>
      <br />
    </Fragment>
  );
};

export default VTSForm;
