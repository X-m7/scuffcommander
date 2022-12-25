import { h, Fragment } from "preact";

import { GeneralAction } from "/types";

interface GeneralActionDetailsProps {
  content: GeneralAction;
}

const GeneralActionDetails = (props: GeneralActionDetailsProps) => {
  switch (props.content.tag) {
    case "Delay":
      return <Fragment>Delay for {props.content.content} seconds</Fragment>;
    case "RunCommand":
      return (
        <Fragment>
          Run the command "{props.content.content[0]}" with{" "}
          {props.content.content[1].length} argument
          {props.content.content[1].length > 1 && "s"}{" "}
          {props.content.content[2] &&
            `and with the current directory set to "${props.content.content[2]}"`}
        </Fragment>
      );
    default:
      return <Fragment />;
  }
};

export default GeneralActionDetails;
