import { h } from "preact";
import { useState } from "preact/hooks";

import VTSAutoButtonGen from "./vtsautogen";

const Utilities = () => {
  const [statusState, setStatusState] = useState<string>("");

  const clearStatusMsg = () => {
    setStatusState("");
  };

  return (
    <div>
      <h1>Utilities</h1>
      <p>
        {statusState}
        {statusState.length > 0 && (
          <button type="button" onClick={clearStatusMsg}>
            Clear
          </button>
        )}
      </p>
      <VTSAutoButtonGen msgFunc={setStatusState} />
    </div>
  );
};

export default Utilities;
