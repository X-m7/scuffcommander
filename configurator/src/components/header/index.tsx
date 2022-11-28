import { h } from "preact";
import { Link } from "preact-router/match";
import style from "./style.css";

const Header = () => (
  <header class={style.header}>
    <h1>ScuffCommander Configurator</h1>
    <nav>
      <Link activeClassName={style.active} href="/">
        Home
      </Link>
      <Link activeClassName={style.active} href="/config">
        General
      </Link>
      <Link activeClassName={style.active} href="/actions">
        Actions
      </Link>
      <Link activeClassName={style.active} href="/pages">
        Pages
      </Link>
    </nav>
  </header>
);

export default Header;
