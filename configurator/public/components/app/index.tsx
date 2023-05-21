import { h } from "preact";
import {
  Route,
  Router,
  LocationProvider,
  lazy,
  ErrorBoundary,
} from "preact-iso";

import style from "./style.module.css";
import Header from "../header";

const Home = lazy(() => import("/routes/home"));
const Config = lazy(() => import("/routes/config"));
const Actions = lazy(() => import("/routes/actions"));
const Pages = lazy(() => import("/routes/pages"));
const StyleConfig = lazy(() => import("/routes/style"));
const Utilities = lazy(() => import("/routes/utilities"));

const App = () => {
  return (
    <LocationProvider>
      <div
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
