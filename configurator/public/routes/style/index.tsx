import { h, createRef } from "preact";
import { useEffect, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api";

import style from "./style.module.css";
import EditButtonStyle from "/components/editbuttonstyle";
import { ButtonStyle, UIStyle } from "/types";

const StyleConfig = () => {
  const [statusState, setStatusState] = useState<string>("");
  const [loadedButtonStyle, setLoadedButtonStyle] = useState<
    ButtonStyle | undefined
  >(undefined);
  const [bgColor, setBgColor] = useState<string>("");
  const [fgColor, setFgColor] = useState<string>("");

  useEffect(() => {
    invoke("get_ui_style").then((styleRaw) => {
      const styleData = styleRaw as UIStyle;
      setLoadedButtonStyle(styleData.default_button_style);
      setBgColor(styleData.bg_color);
      setFgColor(styleData.fg_color);
    });
  }, []);

  const clearStatusMsg = () => {
    setStatusState("");
  };

  const onBgColorInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    setBgColor((e.target as HTMLInputElement).value);
  };

  const onFgColorInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    setFgColor((e.target as HTMLInputElement).value);
  };

  const buttonStyleRef = createRef<EditButtonStyle>();

  const getUiStyleData = () => {
    if (!buttonStyleRef.current) {
      return undefined;
    }

    return {
      default_button_style: buttonStyleRef.current.getButtonStyleData(),
      bg_color: bgColor,
      fg_color: fgColor,
    } as UIStyle;
  };

  const saveUiConfig = async () => {
    await invoke("store_ui_style", { style: getUiStyleData() });
    try {
      await invoke("save_ui_config");
    } catch (err) {
      if (typeof err === "string") {
        setStatusState(`Error occurred: ${err}`);
      }
      return;
    }
    setStatusState("Style configuration saved");
  };

  return (
    <div class={style.styleConfig}>
      <h1>Style configuration</h1>
      <form>
        <p>
          {statusState}
          {statusState.length > 0 && (
            <button type="button" onClick={clearStatusMsg}>
              Clear
            </button>
          )}
        </p>
        <button type="button" onClick={saveUiConfig}>
          Save
        </button>
        <br />
        <label>
          Background color:
          <input type="color" value={bgColor} onInput={onBgColorInput} />
        </label>
        <br />
        <label>
          Foreground color:
          <input type="color" value={fgColor} onInput={onFgColorInput} />
        </label>
        <br />
        <EditButtonStyle
          ref={buttonStyleRef}
          key={loadedButtonStyle}
          initialData={loadedButtonStyle}
        />
      </form>
    </div>
  );
};

export default StyleConfig;
