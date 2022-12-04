import { h } from "preact";

import style from "./style.module.css";
import HeaderEntry from "./headerentry";

const Header = () => (
  <header class={style.header}>
    <h1>ScuffCommander Configurator</h1>
    <nav>
      <HeaderEntry activeClassName={style.active} href="/">
        Home
      </HeaderEntry>
      <HeaderEntry activeClassName={style.active} href="/config">
        General
      </HeaderEntry>
      <HeaderEntry activeClassName={style.active} href="/actions">
        Actions
      </HeaderEntry>
      <HeaderEntry activeClassName={style.active} href="/pages">
        Pages
      </HeaderEntry>
      <HeaderEntry activeClassName={style.active} href="/style">
        Style
      </HeaderEntry>
    </nav>
  </header>
);

export default Header;
