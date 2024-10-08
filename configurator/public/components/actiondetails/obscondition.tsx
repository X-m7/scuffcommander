import { h, Fragment } from "preact";

import { Condition, OBSQuery } from "/types";

interface OBSConditionDetailsProps {
  cond: Condition;
}

const OBSConditionDetails = (props: OBSConditionDetailsProps) => {
  switch (props.cond.query.content as OBSQuery) {
    case "CurrentProgramScene":
      return (
        <Fragment>
          If the OBS current program scene is {props.cond.target}
        </Fragment>
      );
    case "IsStreaming":
      return (
        <Fragment>
          If OBS is {props.cond.target === "false" ? "not" : ""} streaming
        </Fragment>
      );
    case "IsRecording":
      return (
        <Fragment>
          If OBS is {props.cond.target === "false" ? "not" : ""} recording
        </Fragment>
      );
    default:
      return <Fragment />;
  }
};

export default OBSConditionDetails;
