import { h, Fragment } from "preact";
import { useState, useEffect } from "preact/hooks";
import { invoke } from "@tauri-apps/api";

import { Condition, VTSQuery } from "/types";

interface VTSConditionDetailsProps {
  cond: Condition;
  msgFunc: (msg: string) => void;
}

const VTSConditionDetails = ({ cond, msgFunc }: VTSConditionDetailsProps) => {
  const [target, setTarget] = useState<string>(cond.target);

  const tagToStringMap = new Map<string, string>();

  tagToStringMap.set("ActiveModelId", "the current VTube Studio model is");
  tagToStringMap.set(
    "StoredModelPositionExists",
    'the statement "There exists a stored VTube Studio model position" is',
  );

  useEffect(() => {
    switch (cond.query.content as VTSQuery) {
      case "ActiveModelId":
        invoke("get_vts_model_name_from_id", { id: cond.target })
          .then((nameRaw) => {
            setTarget(nameRaw as string);
          })
          .catch((err) => {
            msgFunc(
              `Error occurred when displaying VTS query: ${err.toString()}`,
            );
          });
        break;
      default:
        break;
    }
  }, [cond, msgFunc]);

  return (
    <Fragment>
      If {tagToStringMap.get(cond.query.content)}: {target}
    </Fragment>
  );
};

export default VTSConditionDetails;
