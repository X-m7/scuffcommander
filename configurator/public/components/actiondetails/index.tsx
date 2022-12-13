import { h, Fragment } from "preact";
import { useState } from "preact/hooks";

import style from "./style.module.css";
import { Action, SingleAction, IfAction } from "/types";
import SingleActionDetails from "./singleaction";
import ConditionDetails from "./condition";

interface ConditionActionDetailsProps {
  action: IfAction;
  msgFunc: (msg: string) => void;
}

const ConditionActionDetails = (props: ConditionActionDetailsProps) => {
  return (
    <ul class={style.bulletlessList}>
      <li>
        <ConditionDetails cond={props.action[0]} msgFunc={props.msgFunc} />
      </li>
      <li>
        Then: <ActionDetails action={props.action[1]} msgFunc={props.msgFunc} />
      </li>
      <li>
        Else:{" "}
        {props.action[2] !== null ? (
          <ActionDetails action={props.action[2]} msgFunc={props.msgFunc} />
        ) : (
          "Do nothing"
        )}
      </li>
    </ul>
  );
};

interface ChainActionDetailsProps {
  chain: Action[];
  msgFunc: (msg: string) => void;
}

const ChainActionDetails = (props: ChainActionDetailsProps) => {
  const [expand, setExpand] = useState<boolean>(false);

  const toggleExpand = () => {
    setExpand(!expand);
  };

  if (expand) {
    return (
      <Fragment>
        <ol>
          {props.chain.map((act) => {
            return (
              <li key={act}>
                <ActionDetails action={act} msgFunc={props.msgFunc} />
              </li>
            );
          })}
        </ol>
        <button type="button" onClick={toggleExpand}>
          Hide details
        </button>
      </Fragment>
    );
  }

  return (
    <Fragment>
      Chain with {props.chain.length} actions
      <button type="button" onClick={toggleExpand}>
        Show details
      </button>
    </Fragment>
  );
};

interface ActionDetailsProps {
  action: Action;
  msgFunc: (msg: string) => void;
}

const ActionDetails = (props: ActionDetailsProps) => {
  switch (props.action.tag) {
    case "Single":
      return (
        <SingleActionDetails
          content={props.action.content as SingleAction}
          msgFunc={props.msgFunc}
        />
      );
    case "Chain":
      return (
        <ChainActionDetails
          chain={props.action.content as Action[]}
          msgFunc={props.msgFunc}
        />
      );
    case "If":
      return (
        <ConditionActionDetails
          action={props.action.content as IfAction}
          msgFunc={props.msgFunc}
        />
      );
    default:
      return <Fragment />;
  }
};

export default ActionDetails;
