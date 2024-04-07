import { h, Fragment } from "preact";
import { useState, useEffect, useCallback } from "preact/hooks";
import { invoke } from "@tauri-apps/api";

import { VTSAction, VTSActionData } from "/types";

interface VTSActionDetailsProps {
  content: VTSAction;
  msgFunc: (msg: string) => void;
}

const VTSActionDetails = ({ content, msgFunc }: VTSActionDetailsProps) => {
  const [actionData, setActionData] = useState<VTSActionData | undefined>(
    content.content
  );

  const tagToStringMap = new Map<string, string>();

  tagToStringMap.set("ToggleExpression", "Toggle VTube Studio expression:");
  tagToStringMap.set("EnableExpression", "Enable VTube Studio expression:");
  tagToStringMap.set("DisableExpression", "Disable VTube Studio expression:");
  tagToStringMap.set("LoadModel", "Load VTube Studio model:");
  tagToStringMap.set("MoveModel", "Move VTube Studio model to:");
  tagToStringMap.set("TriggerHotkey", "Trigger VTube Studio hotkey:");
  tagToStringMap.set("SaveCurrentModelPosition", "Save VTube Studio model position as:");
  tagToStringMap.set("RestoreModelPosition", "Restore VTube Studio model position from:");

  const convertIdToStr = useCallback(
    (id: string, invokeCmd: string) => {
      invoke(invokeCmd, { id })
        .then((rawResult) => {
          setActionData(rawResult as string);
        })
        .catch((err) => {
          msgFunc(
            `Error occurred while displaying VTS action: ${err.toString()}`
          );
        });
    },
    [msgFunc]
  );

  useEffect(() => {
    switch (content.tag) {
      case "ToggleExpression":
      case "EnableExpression":
      case "DisableExpression":
        convertIdToStr(
          content.content as string,
          "get_vts_expression_name_from_id"
        );
        break;
      case "TriggerHotkey":
        convertIdToStr(
          content.content as string,
          "get_vts_hotkey_name_from_id"
        );
        break;
      case "LoadModel":
        convertIdToStr(content.content as string, "get_vts_model_name_from_id");
        break;
    }
  }, [convertIdToStr, content]);

  const convertActionDataToStr = (data: VTSActionData | undefined) => {
    if (typeof data === "string" || typeof data === "undefined") {
      return data;
    }

    if ("x" in data) {
      return `(${data.x}, ${data.y}), with rotation ${data.rotation}, size ${data.size}, with duration ${data.time_sec}`;
    }

    return `"${data.var_id}" with duration ${data.time_sec}`;

  };

  return (
    <Fragment>
      {tagToStringMap.get(content.tag)} {convertActionDataToStr(actionData)}
    </Fragment>
  );
};

export default VTSActionDetails;
