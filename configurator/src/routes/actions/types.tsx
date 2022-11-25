// Follows the Action enum variants, plus None being specific to the UI
export enum ActionType {
  None,
  Single,
  Chain,
  If,
}

/*
 * Exact representation of the Action type coming from the Rust side
 */

// only a single possibility at present, tag="Delay" and content=number
export type GeneralAction = {
  tag: string;
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

// tag can be ToggleExpression, LoadModel, MoveModel, TriggerHotkey or CheckConnection
// content for most is just a single string, or nothing for CheckConnection
export type VTSAction = {
  tag: string;
  content?: VTSActionData;
};

// tag is ProgramSceneChange or CheckConnection
// content is just the target scene for ProgramSceneChange or nothing for CheckConnection
export type OBSAction = {
  tag: string;
  content?: string;
};

export type PluginAction = OBSAction | VTSAction | GeneralAction;

// tag is OBS, VTS or General
export type SingleAction = {
  tag: string;
  content: PluginAction;
};

export type OBSQuery = "CurrentProgramScene" | "Version";
export type VTSQuery = "ActiveModelId" | "Version";

export type PluginQueryContent = OBSQuery | VTSQuery;

// tag is OBS or VTS
export type PluginQuery = {
  tag: string;
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

// tag is Single, Chain or If
export type Action = {
  tag: string;
  content: ActionContent;
};
