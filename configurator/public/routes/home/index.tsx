import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api";

import style from "./style.module.css";
import {
  UIStyle,
  UIButton,
  ButtonStyle,
  ExecuteAction,
  OpenPage,
} from "/types";

type ButtonStyleCss = {
  width: string;
  height: string;
  backgroundColor: string;
  color: string;
};

const getCssFromButtonStyle = (style: ButtonStyle) => {
  return {
    width: style.width,
    height: style.height,
    backgroundColor: style.bg_color,
    color: style.fg_color,
  } as ButtonStyleCss;
};

const getButtonData = (button: UIButton) => {
  if ((button as ExecuteAction).ExecuteAction) {
    return (button as ExecuteAction).ExecuteAction;
  }

  return (button as OpenPage).OpenPage;
};

const Home = () => {
  const [statusState, setStatusState] = useState<string>("");
  const [uiStyle, setUiStyle] = useState<UIStyle | undefined>(undefined);
  const [buttons, setButtons] = useState<UIButton[]>([]);
  const [currentPage, setCurrentPage] = useState<string>("home");

  useEffect(() => {
    invoke("get_page_buttons", { id: currentPage })
      .then((buttonsRaw) => {
        setButtons(buttonsRaw as UIButton[]);
      })
      .catch((err) => {
        if (currentPage === "home") {
          setStatusState(
            'Error occurred: The page with ID "home" appears to be missing.'
          );
        } else {
          setStatusState(`Error occurred: ${err.toString()}`);
        }
      });
  }, [currentPage]);

  useEffect(() => {
    invoke("get_ui_style").then((styleRaw) => {
      setUiStyle(styleRaw as UIStyle);
    });

    invoke("is_config_default").then((raw) => {
      const isConfigDefault = raw as boolean;
      if (isConfigDefault) {
        setStatusState(
          "This appears to the first time this app has been started, please go to the General section, update the settings if required and save the configuration there before proceeding further."
        );
      }
    });
  }, []);

  const onButtonClick = async (button: UIButton) => {
    if ((button as ExecuteAction).ExecuteAction) {
      try {
        const action = await invoke("load_action_details", {
          id: (button as ExecuteAction).ExecuteAction.target_id,
        });
        await invoke("run_action", { action });
      } catch (err) {
        if (typeof err === "string") {
          setStatusState(`Error occurred: ${err}`);
        }
        return;
      }
    } else {
      setCurrentPage((button as OpenPage).OpenPage.target_id);
    }
  };

  const clearStatusMsg = () => {
    setStatusState("");
  };

  const returnToHomePage = () => {
    setCurrentPage("home");
  };

  return (
    <div class={style.home}>
      <p hidden={statusState.length === 0}>
        {statusState}
        <button type="button" onClick={clearStatusMsg}>
          Clear
        </button>
      </p>
      {uiStyle !== undefined && (
        <div
          class={style.previewContainer}
          style={{ backgroundColor: uiStyle.bg_color, color: uiStyle.fg_color }}
        >
          <div hidden={buttons.length !== 0}>
            No buttons are present in the page with ID {currentPage}.
            <button type="button" onClick={returnToHomePage}>
              Return to home page
            </button>
          </div>
          {buttons.map((button) => {
            const buttonData = getButtonData(button);
            return (
              <button
                type="button"
                class={style.coreButton}
                key={button}
                onClick={async () => await onButtonClick(button)}
                style={
                  buttonData.style_override
                    ? getCssFromButtonStyle(buttonData.style_override)
                    : getCssFromButtonStyle(uiStyle.default_button_style)
                }
              >
                {buttonData.img ? (
                  <img
                    class={style.buttonImg}
                    src={`data:${buttonData.img.format};base64,${buttonData.img.data}`}
                  />
                ) : (
                  buttonData.target_id
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Home;
