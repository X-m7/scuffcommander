import { h, Fragment } from "preact";

import { OBSAction } from "/types";

interface OBSActionDetailsProps {
  content: OBSAction;
}

const OBSActionDetails = (props: OBSActionDetailsProps) => {
  switch (props.content.tag) {
    case "ProgramSceneChange":
      return (
        <Fragment>
          Change OBS Program Scene to: {props.content.content}
        </Fragment>
      );
    case "StartStream":
      return <Fragment>Start OBS Stream</Fragment>;
    case "StopStream":
      return <Fragment>Stop OBS Stream</Fragment>;
    case "StartRecord":
      return <Fragment>Start OBS Recording</Fragment>;
    case "StopRecord":
      return <Fragment>Stop OBS Recording</Fragment>;
    default:
      return <Fragment />;
  }
};

export default OBSActionDetails;
