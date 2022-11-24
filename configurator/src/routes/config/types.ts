export type OBSConfigData = {
  addr: string;
  port: number;
  password: string;
};

export type VTSConfigData = {
  addr: string;
  token_file: string;
};

/*
 * OBSConfig and VTSConfig are the JSON forms exported by Serde from the Rust side
 * These are externally tagged enum representations
 */
export type OBSConfig = {
  OBS: OBSConfigData;
};

export type VTSConfig = {
  VTS: VTSConfigData;
};

// The string part here is for the "General" plugin, which has no configuration other than enable/disable
export type PluginConfig = OBSConfig | VTSConfig | string;

// Equivalent of the AppConfig struct in the Rust side
export type AppConfig = {
  addr: string;
  port: number;
  plugins: PluginConfig[];
};

export type ServerConfig = {
  addr: string;
  port: number;
};
