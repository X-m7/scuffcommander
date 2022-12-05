import { h, Fragment } from "preact";

import { ServerConfig } from "/types/config";

/*
 * Server configuration component
 */

interface ServerFormProps {
  conf?: ServerConfig;
  onChange: (newConf: ServerConfig) => void;
}

const ServerForm = (props: ServerFormProps) => {
  const conf = props.conf ?? { addr: "localhost", port: 8070 };

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

  return (
    <Fragment>
      <h2>Server</h2>
      <label>
        Address:
        <input type="text" value={conf.addr} onInput={addrInput} />
      </label>
      <br />
      <label>
        Port:
        <input type="number" value={conf.port} onInput={portInput} />
      </label>
      <br />
    </Fragment>
  );
};

export default ServerForm;
