import { h, ComponentChildren } from "preact";
import { useLocation } from "preact-iso";

interface HeaderEntryProps {
  href: string;
  activeClassName: string;
  children: ComponentChildren;
}

const HeaderEntry = (props: HeaderEntryProps) => {
  const { url } = useLocation();

  return (
    <a
      href={props.href}
      class={url === props.href ? props.activeClassName : ""}
    >
      {props.children}
    </a>
  );
};

export default HeaderEntry;
