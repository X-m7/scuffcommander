import { h, Fragment, Component } from "preact";
import { useEffect, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api";

import { Action } from "./types";

interface EditChainActionProps {
  data?: Action[];
  msgFunc: (msg: string) => void;
}

interface EditChainActionState {
  chain: Action[];
}

interface ChainElementProps {
  data: Action;
  msgFunc: (msg: string) => void;
}

const ChainElement = ({ data, msgFunc }: ChainElementProps) => {
  const [actionStr, setActionStr] = useState<string | undefined>(undefined);

  useEffect(() => {
    invoke("convert_action_to_string", { action: data })
      .then((inp) => {
        setActionStr(inp as string);
      })
      .catch((err) => {
        msgFunc(`Error occurred: ${err.toString()}`);
      });
  }, [data, msgFunc]);

  if (actionStr === undefined) {
    return <Fragment />;
  }

  return <li>{actionStr}</li>;
};

class EditChainAction extends Component<
  EditChainActionProps,
  EditChainActionState
> {
  constructor(props: EditChainActionProps) {
    super(props);

    this.state = {
      chain: this.props.data ?? [],
    };
  }

  render() {
    return (
      <Fragment>
        <ol>
          {this.state.chain.map((act) => {
            return (
              <ChainElement key={act} data={act} msgFunc={this.props.msgFunc} />
            );
          })}
        </ol>
      </Fragment>
    );
  }
}

export default EditChainAction;
