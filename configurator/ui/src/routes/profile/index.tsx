import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import style from './style.css';
import { invoke } from '@tauri-apps/api';
import { AppConfig, PluginConfig } from '../../types';

interface Props {
    user: string;
}

interface AppConfigViewProps {
    conf?: AppConfig;
}

const renderPluginConfig = (conf: PluginConfig) => {
    if (typeof conf === "string") {
        return conf;
    }
    if ("OBS" in conf) {
        return (
            <div>
                OBS WebSocket address: {conf.OBS.addr} <br />
                OBS WebSocket port: {conf.OBS.port} <br />
                OBS WebSocket password: {conf.OBS.password}
            </div>
        );
    }
    if ("VTS" in conf) {
        return (
            <div>
                VTS WebSocket address: {conf.VTS.addr} <br />
                VTS token file: {conf.VTS.token_file}
            </div>
        );
    }

    return undefined;
};

const AppConfigView = ({ conf }: AppConfigViewProps) => {
    if (typeof conf === "undefined") {
        return (<div />);
    }
    return (
        <div>
            Server address: {conf.addr}
            <br />
            Server port: {conf.port}
            <br />
            {conf.plugins.map(renderPluginConfig)}
        </div>
    );
}

// Note: `user` comes from the URL, courtesy of our router
const Profile = ({ user }: Props) => {
    const [time, setTime] = useState<number>(Date.now());
    const [count, setCount] = useState<number>(0);
    const [appConfig, setAppConfig] = useState<AppConfig | undefined>(undefined);

    useEffect(() => {
		const timer = setInterval(() => setTime(Date.now()), 1000);
		return () => clearInterval(timer);
	}, []);

	const loadAppConfig = async () => {
	    const conf = await invoke("get_config");
        setAppConfig(conf as AppConfig);
	};

    return (
		<div class={style.profile}>
			<h1>Profile: {user}</h1>
			<p>This is the user profile for a user named { user }.</p>

			<div>Current time: {new Date(time).toLocaleString()}</div>

			<p>
				<button onClick={() => setCount((count) => count + 1)}>Click Me</button>
				{' '}
				Clicked {count} times.
			</p>

			<div>
			    <button onClick={loadAppConfig}>Load Config Test</button>
			    {' '}
			    <AppConfigView conf={appConfig} />
			</div>
		</div>
	);
};

export default Profile;
