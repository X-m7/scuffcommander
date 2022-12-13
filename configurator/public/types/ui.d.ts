/*
 * UI/styling related types
 */

export type ButtonStyle = {
  width: string;
  height: string;
  bg_color: string;
  fg_color: string;
};

export type UIStyle = {
  default_button_style: ButtonStyle;
  bg_color: string;
  fg_color: string;
};

export type Base64Image = {
  format: string;
  data: string;
};

export type ButtonData = {
  target_id: string;
  style_override: ButtonStyle | null;
  img: Base64Image | null;
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
