export type VTSMoveModelData = {
  x: number;
  y: number;
  rotation: number;
  size: number;
  time_sec: number;
};

export type VTSActionData = string | VTSMoveModelData;

export type VTSActionTag =
  | "ToggleExpression"
  | "EnableExpression"
  | "DisableExpression"
  | "LoadModel"
  | "MoveModel"
  | "TriggerHotkey"
  | "CheckConnection";

// content for most is just a single string, or nothing for CheckConnection
export type VTSAction = {
  tag: VTSActionTag;
  content?: VTSActionData;
};

export type VTSQuery = "ActiveModelId" | "Version";
