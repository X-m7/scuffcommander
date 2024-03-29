/*
 * Action related types
 */

export * from "./obs";
export * from "./vts";
export * from "./general";

export type PluginAction = OBSAction | VTSAction | GeneralAction;

export type SingleActionTag = "OBS" | "VTS" | "General";

export type SingleAction = {
  tag: SingleActionTag;
  content: PluginAction;
};

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

export type IfAction = [Condition, Action, Action | null];

// single action, chain action, conditional
export type ActionContent = SingleAction | Action[] | IfAction;

export type ActionTag = "Single" | "Chain" | "If";

export type Action = {
  tag: ActionTag;
  content: ActionContent;
};
