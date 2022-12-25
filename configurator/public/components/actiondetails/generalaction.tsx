import { h, Fragment } from "preact";
import { useState } from "preact/hooks";

import { GeneralAction } from "/types";

interface GeneralActionDetailsProps {
  content: GeneralAction;
}

const GeneralActionDetails = ({ content: prop }: GeneralActionDetailsProps) => {
  const [expand, setExpand] = useState<boolean>(false);

  const { tag, content } = prop;

  const toggleExpand = () => {
    setExpand(!expand);
  };

  switch (tag) {
    case "Delay":
      return <Fragment>Delay for {content} seconds</Fragment>;
    case "RunCommand":
      return (
        <Fragment>
          Run the command "{content[0]}" with{" "}
          {content[1].length === 0 ? "no" : content[1].length} argument
          {content[1].length !== 1 && "s"}{" "}
          {content[2] &&
            `and with the current directory set to "${content[2]}"`}
          <button
            hidden={content[1].length === 0}
            type="button"
            onClick={toggleExpand}
          >
            {expand ? "Hide" : "Show"} arguments
          </button>
          {expand ? (
            <ol>
              {content[1].map((arg) => {
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
