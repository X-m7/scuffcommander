import { ButtonStyle } from "/components/editbuttonstyle/types";

export type Base64Image = {
  format: string;
  data: string;
};

export type ButtonData = {
  target_id: string;
  style_override?: ButtonStyle;
  img?: Base64Image;
};

/*
 * ExecuteAction and OpenPage are the JSON forms exported by Serde from the Rust side
 * These are externally tagged enum representations
 */
export type ExecuteAction = {
  ExecuteAction: ButtonData;
};

export type OpenPage = {
  OpenPage: ButtonData;
};

export type UIButton = ExecuteAction | OpenPage;
