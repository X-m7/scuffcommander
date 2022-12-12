import { h, ComponentChildren } from "preact";
import { useLocation } from "preact-iso";

interface HeaderEntryProps {
  href: string;
  className: string;
  activeClassName: string;
  onClick: () => void;
  children: ComponentChildren;
}

const HeaderEntry = (props: HeaderEntryProps) => {
  const { url } = useLocation();

  return (
    <a
      href={props.href}
      class={`${props.className} ${
        url === props.href ? props.activeClassName : ""
      }`}
      onClick={props.onClick}
    >
      {props.children}
    </a>
  );
};

export default HeaderEntry;
