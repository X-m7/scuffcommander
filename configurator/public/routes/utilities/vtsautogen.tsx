import { h, Fragment } from "preact";
import { useState, useEffect } from "preact/hooks";
import { invoke } from "@tauri-apps/api/core";

import sharedStyle from "/style.module.css";
import SelectOptsGen from "/components/selectoptsgen";

interface VTSAutoButtonGenProps {
  msgFunc: (msg: string) => void;
}

const VTSAutoButtonGen = ({ msgFunc }: VTSAutoButtonGenProps) => {
  const [pageId, setPageId] = useState<string>("");
  const [prefix, setPrefix] = useState<string>("");
  const [suffix, setSuffix] = useState<string>("");
  const [selectedModelName, setSelectedModelName] = useState<string>("current");

  const [modelNames, setModelNames] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      msgFunc(
        "Warning: Requesting the list of models from VTube Studio is taking an extended amount of time (there may be a pending authentication request that needs to be allowed)",
      );
    }, 1000);

    invoke("get_vts_model_names")
      .then((listRaw) => {
        clearTimeout(timer);
        setModelNames(listRaw as string[]);
      })
      .catch((err) => {
        clearTimeout(timer);
        msgFunc(`Error occurred: ${err.toString()}`);
      });
  }, [msgFunc]);

  const optionalGetVtsModelId = async () => {
    if (selectedModelName === "current") {
      return undefined;
    }

    try {
      return await invoke("get_vts_model_id_from_name", {
        name: selectedModelName.substring(2),
      });
    } catch (err) {
      // Connection issues should be known and fixed before getting here
      // since loading the model names requires the connection to work already
      throw new Error("Connection failure?");
    }
  };

  const generate = () => {
    if (pageId.length === 0) {
      msgFunc("Page ID cannot be empty");
      return;
    }

    optionalGetVtsModelId()
      .then((rawId) => {
        return invoke("generate_buttons_for_hotkeys", {
          modelId: rawId as string,
          pageId,
          prefix,
          suffix,
        });
      })
      .then(() => {
        return Promise.all([invoke("save_actions"), invoke("save_ui_config")]);
      })
      .then(() => {
        msgFunc(`New page with ID ${pageId} created`);
      })
      .catch((err) => {
        msgFunc(`Error occurred: ${err.toString()}`);
      });
  };

  const onSelectedModelNameChange = (e: Event) => {
    if (e.target) {
      setSelectedModelName((e.target as HTMLInputElement).value);
    }
  };

  const onPageIdInput = (e: Event) => {
    if (e.target) {
      setPageId((e.target as HTMLInputElement).value);
    }
  };

  const onPrefixInput = (e: Event) => {
    if (e.target) {
      setPrefix((e.target as HTMLInputElement).value);
    }
  };

  const onSuffixInput = (e: Event) => {
    if (e.target) {
      setSuffix((e.target as HTMLInputElement).value);
    }
  };

  return (
    <Fragment>
      <h2>Generate buttons for all hotkeys of a VTube Studio model</h2>
      <p>
        This will create a new page, with one button to return to the home page,{" "}
        as well as one button for every hotkey configured in the selected model.{" "}
        A button leading to the new page will also be added to the home page.{" "}
        All changes will be saved immediately.
      </p>
      <p>
        With the current settings a hotkey named "Hotkey X" will have an action
        called: "{`${prefix}Hotkey X${suffix}`}".
      </p>
      <form>
        <label>
          Model:
          <select
            value={selectedModelName}
            onChange={onSelectedModelNameChange}
          >
            <option value="current">Currently loaded model</option>
            <SelectOptsGen opts={modelNames} />
          </select>
        </label>
        <button type="button" onClick={generate}>
          Generate Buttons
        </button>
        <br />
        <label>
          New page ID:
          <input
            type="text"
            value={pageId}
            onInput={onPageIdInput}
            class={pageId.length === 0 ? sharedStyle.invalid : ""}
          />
        </label>
        <br />
        <label>
          Prefix:
          <input type="text" value={prefix} onInput={onPrefixInput} />
        </label>
        <br />
        <label>
          Suffix:
          <input type="text" value={suffix} onInput={onSuffixInput} />
        </label>
        <br />
      </form>
    </Fragment>
  );
};

export default VTSAutoButtonGen;
