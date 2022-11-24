type OBSConfigData = {
    addr: string;
    port: number;
    password: string;
};

type VTSConfigData = {
    addr: string;
    token_file: string;
}

export type OBSConfig = {
    OBS: OBSConfigData;
}

export type VTSConfig = {
    VTS: VTSConfigData;
}

// The string part here is for the "General" plugin, which has no configuration other than enable/disable
export type PluginConfig = OBSConfig | VTSConfig | string;

export type AppConfig = {
    addr: string;
    port: number;
    plugins: PluginConfig[];
}
