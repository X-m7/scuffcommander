import { h } from "preact";
import {
  Route,
  Router,
  LocationProvider,
  lazy,
  ErrorBoundary,
} from "preact-iso";

import Header from "./header";

const Home = lazy(() => import("/routes/home"));
const Config = lazy(() => import("/routes/config"));
const Actions = lazy(() => import("/routes/actions"));
const Pages = lazy(() => import("/routes/pages"));
const StyleConfig = lazy(() => import("/routes/style"));

const App = () => (
  <LocationProvider>
    <div class="app">
      <Header />
      <ErrorBoundary>
        <Router>
          <Route path="/" component={Home} />
          <Route path="/config/" component={Config} />
          <Route path="/actions/" component={Actions} />
          <Route path="/pages/" component={Pages} />
          <Route path="/style/" component={StyleConfig} />
        </Router>
      </ErrorBoundary>
    </div>
  </LocationProvider>
);

export default App;
