import { h } from "preact";
import { useState } from "preact/hooks";

import style from "./style.module.css";
import HeaderEntry from "./headerentry";

const Header = () => {
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  return (
    <header class={style.header}>
      <h1 class={style.appTitle}>ScuffCommander</h1>
      <button
        type="button"
        id="navHamburger"
        class={showMobileMenu ? style.active : ""}
        onClick={toggleMobileMenu}
      >
        &#8801;
      </button>
      <nav class={`${style.navMenu} ${showMobileMenu ? style.expanded : ""}`}>
        <ul>
          <li>
            <HeaderEntry
              className={style.navLink}
              activeClassName={style.active}
              onClick={closeMobileMenu}
              href="/"
            >
              Home
            </HeaderEntry>
          </li>
          <li>
            <HeaderEntry
              className={style.navLink}
              activeClassName={style.active}
              onClick={closeMobileMenu}
              href="/config"
            >
              General
            </HeaderEntry>
          </li>
          <li>
            <HeaderEntry
              className={style.navLink}
              activeClassName={style.active}
              onClick={closeMobileMenu}
              href="/actions"
            >
              Actions
            </HeaderEntry>
          </li>
          <li>
            <HeaderEntry
              className={style.navLink}
              activeClassName={style.active}
              onClick={closeMobileMenu}
              href="/pages"
            >
              Pages
            </HeaderEntry>
          </li>
          <li>
            <HeaderEntry
              className={style.navLink}
              activeClassName={style.active}
              onClick={closeMobileMenu}
              href="/style"
            >
              Style
            </HeaderEntry>
          </li>
          <li>
            <HeaderEntry
              className={style.navLink}
              activeClassName={style.active}
              onClick={closeMobileMenu}
              href="/utilities"
            >
              Utilities
            </HeaderEntry>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
