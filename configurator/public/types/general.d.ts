export type GeneralAction = GeneralActionDelay | GeneralActionRunCmd;

export type GeneralActionDelay = {
  tag: "Delay";
  content: number;
};

export type GeneralActionCommand = [string, string[], string | null];

export type GeneralActionRunCmd = {
  tag: "RunCommand";
  content: GeneralActionCommand;
};
