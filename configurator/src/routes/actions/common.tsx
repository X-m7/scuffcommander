import { h, Fragment } from "preact";

export const generateSelectOptions = (opts: string[]) => {
  return (
    <Fragment>
      {opts.map((opt) => {
        return (
          <option key={`x-${opt}`} value={`x-${opt}`}>
            {opt}
          </option>
        );
      })}
    </Fragment>
  );
};
