import { h, Fragment } from "preact";

import { GeneralAction } from "/types";

interface GeneralActionDetailsProps {
  content: GeneralAction;
}

const GeneralActionDetails = (props: GeneralActionDetailsProps) => {
  switch (props.content.tag) {
    case "Delay":
      return <Fragment>Delay for {props.content.content} seconds</Fragment>;
    default:
      return <Fragment />;
  }
};

export default GeneralActionDetails;
