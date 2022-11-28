import { h, Fragment } from "preact";

interface SelectOptsGenProps {
  opts: string[];
}

const SelectOptsGen = ({ opts }: SelectOptsGenProps) => {
  return (
    <Fragment>
      {opts.map((opt) => {
        return (
          <option key={opt} value={`x-${opt}`}>
            {opt}
          </option>
        );
      })}
    </Fragment>
  );
};

export default SelectOptsGen;
