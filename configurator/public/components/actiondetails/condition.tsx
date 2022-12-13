import { h, Fragment } from "preact";

import { Condition } from "/types";
import OBSConditionDetails from "./obscondition";
import VTSConditionDetails from "./vtscondition";

interface ConditionDetailsProps {
  cond: Condition;
  msgFunc: (msg: string) => void;
}

const ConditionDetails = (props: ConditionDetailsProps) => {
  switch (props.cond.query.tag) {
    case "OBS":
      return <OBSConditionDetails cond={props.cond} />;
    case "VTS":
      return <VTSConditionDetails cond={props.cond} msgFunc={props.msgFunc} />;
    default:
      return <Fragment />;
  }
};

export default ConditionDetails;
