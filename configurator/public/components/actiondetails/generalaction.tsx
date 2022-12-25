import { h, Fragment } from "preact";
import { useState } from "preact/hooks";

import { GeneralAction } from "/types";

interface GeneralActionDetailsProps {
  content: GeneralAction;
}

const GeneralActionDetails = (props: GeneralActionDetailsProps) => {
  const [expand, setExpand] = useState<boolean>(false);

  const toggleExpand = () => {
    setExpand(!expand);
  };

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
          <button type="button" onClick={toggleExpand}>
            {expand ? "Hide" : "Show"} arguments
          </button>
          {expand ? (
            <ol>
              {props.content.content[1].map((arg) => {
                return <li key={arg}>{arg}</li>;
              })}
            </ol>
          ) : (
            ""
          )}
        </Fragment>
      );
    default:
      return <Fragment />;
  }
};

export default GeneralActionDetails;
