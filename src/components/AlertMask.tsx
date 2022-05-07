import { NONAME } from "dns";
import { Transition } from "react-transition-group";

let duration = 3000;

const defaultStyle = {
  display: "none",
  position: "fixed",
  top: "0",
  left: "0",
  width: "100vw",
  height: "100vh",
  transition: `background-color ${duration}ms ease-in-out`,
  backgroundColor: "rgba(0,0,0,0)",
  zIndex: "9999",
};

const transitionStyles = {
  entering: { backgroundColor: "rgba(0,0,0,0.6)", display: "block" },
  entered: { backgroundColor: "rgba(0,0,0,0.6)", display: "block" },
  exiting: { backgroundColor: "rgba(0,0,0,0)", display: "none" },
  exited: { backgroundColor: "rgba(0,0,0,0)", display: "none" },
};

interface AlertMaskProps {
  in: boolean;
  timeout: number;
}

export const AlertMask: React.FC<AlertMaskProps> = ({
  in: inProp,
  timeout: timeout,
}) => {
  return (
    <Transition in={inProp} timeout={timeout}>
      {(state) => (
        <div
          style={{
            ...defaultStyle,
            ...transitionStyles[state],
          }}
        ></div>
      )}
    </Transition>
  );
};
