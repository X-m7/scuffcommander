import { h, Fragment } from "preact";

import { SingleAction, OBSAction, VTSAction, GeneralAction } from "/types";
import OBSActionDetails from "./obsaction";
import VTSActionDetails from "./vtsaction";
import GeneralActionDetails from "./generalaction";

interface SingleActionDetailsProps {
  content: SingleAction;
  msgFunc: (msg: string) => void;
}

const SingleActionDetails = (props: SingleActionDetailsProps) => {
  switch (props.content.tag) {
    case "OBS":
      return <OBSActionDetails content={props.content.content as OBSAction} />;
      break;
    case "VTS":
      return (
        <VTSActionDetails
          content={props.content.content as VTSAction}
          msgFunc={props.msgFunc}
        />
      );
    case "General":
      return (
        <GeneralActionDetails
          content={props.content.content as GeneralAction}
        />
      );
    default:
      return <Fragment />;
  }
};

export default SingleActionDetails;
