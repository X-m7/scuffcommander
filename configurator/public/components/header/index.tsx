import { h } from "preact";
import style from "./style.module.css";

const Header = () => (
  <header class={style.header}>
    <h1>ScuffCommander Configurator</h1>
    <nav>
      <a href="/">Home</a>
      <a href="/config">General</a>
      <a href="/actions">Actions</a>
      <a href="/pages">Pages</a>
      <a href="/style">Style</a>
    </nav>
  </header>
);

export default Header;
