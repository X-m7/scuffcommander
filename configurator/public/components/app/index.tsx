import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import {
  Route,
  Router,
  LocationProvider,
  lazy,
  ErrorBoundary,
} from "preact-iso";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { UnlistenFn } from "@tauri-apps/api/event";

import style from "./style.module.css";
import Header from "../header";
const appWindow = getCurrentWebviewWindow()

const Home = lazy(() => import("/routes/home"));
const Config = lazy(() => import("/routes/config"));
const Actions = lazy(() => import("/routes/actions"));
const Pages = lazy(() => import("/routes/pages"));
const StyleConfig = lazy(() => import("/routes/style"));
const Utilities = lazy(() => import("/routes/utilities"));

const App = () => {
  const [darkTheme, setDarkTheme] = useState<boolean>(false);

  useEffect(() => {
    appWindow.theme().then((theme) => {
      setDarkTheme(theme === "dark");
    });

    let cleanupListener: UnlistenFn | undefined;

    appWindow
      .onThemeChanged(({ payload: theme }) => {
        setDarkTheme(theme === "dark");
      })
      .then((unlisten) => {
        cleanupListener = unlisten;
      });

    return () => {
      if (cleanupListener !== undefined) {
        cleanupListener();
      }
    };
  }, []);

  return (
    <LocationProvider>
      <div
        class={`${style.app} ${darkTheme ? style.darkTheme : style.lightTheme}`}
        onContextMenu={(e: Event) => e.preventDefault()}
      >
        <Header />
        <div class={style.pageContents}>
          <ErrorBoundary>
            <Router>
              <Route path="/" component={Home} />
              <Route path="/config/" component={Config} />
              <Route path="/actions/" component={Actions} />
              <Route path="/pages/" component={Pages} />
              <Route path="/style/" component={StyleConfig} />
              <Route path="/utilities/" component={Utilities} />
            </Router>
          </ErrorBoundary>
        </div>
      </div>
    </LocationProvider>
  );
};

export default App;
