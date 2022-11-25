// Enum variant of ActionTag, plus None being specific to the UI
export enum ActionType {
  None,
  Single,
  Chain,
  If,
}

// Enum variant of SingleActionTag, plus None being specific to the UI
export enum PluginType {
  None,
  OBS,
  VTS,
  General,
}

/*
 * Exact representation of the Action type coming from the Rust side
 */

// only a single possibility at present, tag="Delay" and content=number
export type GeneralAction = {
  tag: "Delay";
  content: number;
};

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
  | "LoadModel"
  | "MoveModel"
  | "TriggerHotkey"
  | "CheckConnection";

// content for most is just a single string, or nothing for CheckConnection
export type VTSAction = {
  tag: string;
  content?: VTSActionData;
};

export type OBSActionTag = "ProgramSceneChange" | "CheckConnection";

// content is just the target scene for ProgramSceneChange or nothing for CheckConnection
export type OBSAction = {
  tag: string;
  content?: string;
};

export type PluginAction = OBSAction | VTSAction | GeneralAction;

export type SingleActionTag = "OBS" | "VTS" | "General";

export type SingleAction = {
  tag: SingleActionTag;
  content: PluginAction;
};

export type OBSQuery = "CurrentProgramScene" | "Version";
export type VTSQuery = "ActiveModelId" | "Version";

export type PluginQueryContent = OBSQuery | VTSQuery;

export type PluginQueryTag = "OBS" | "VTS";

export type PluginQuery = {
  tag: PluginQueryTag;
  content: PluginQueryContent;
};

export type Condition = {
  query: PluginQuery;
  target: string;
};

// single action, chain action, conditional
export type ActionContent =
  | SingleAction
  | Action[]
  | [Condition, Action, Action?];

export type ActionTag = "Single" | "Chain" | "If";

export type Action = {
  tag: ActionTag;
  content: ActionContent;
};
