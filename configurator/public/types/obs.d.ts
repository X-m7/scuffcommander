export type OBSActionTag =
  | "ProgramSceneChange"
  | "StartStream"
  | "StopStream"
  | "StartRecord"
  | "StopRecord"
  | "CheckConnection";

// content is just the target scene for ProgramSceneChange or nothing for the rest
export type OBSAction = {
  tag: OBSActionTag;
  content?: string;
};

// IsStreaming and IsRecording both returh "true" and "false" as strings
export type OBSQuery =
  | "CurrentProgramScene"
  | "IsStreaming"
  | "IsRecording"
  | "Version";
