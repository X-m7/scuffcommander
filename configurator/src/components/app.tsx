import { h } from "preact";
import { Route, Router } from "preact-router";

import Header from "./header";

// Code-splitting is automated for `routes` directory
import Home from "/routes/home";
import Config from "/routes/config";
import Actions from "/routes/actions";
import Pages from "/routes/pages";
import StyleConfig from "/routes/style";

const App = () => (
  <div id="app">
    <Header />
    <Router>
      <Route path="/" component={Home} />
      <Route path="/config/" component={Config} />
      <Route path="/actions/" component={Actions} />
      <Route path="/pages/" component={Pages} />
      <Route path="/style/" component={StyleConfig} />
    </Router>
  </div>
);

export default App;
