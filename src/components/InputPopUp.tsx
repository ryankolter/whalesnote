import styled from "@emotion/styled";
import { InputPopUpBox } from "./InputPopUpBox";

interface InputPopUpProps {
  popupState: boolean;
  maskState: boolean;
  initValue: string;
  setValue: (val: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  onKeyDown: (e: any) => void;
}

export const InputPopUp: React.FC<InputPopUpProps> = (props) => {
  const {
    popupState,
    maskState,
    initValue,
    setValue,
    onCancel,
    onConfirm,
    onKeyDown,
  } = props;

  return (
    <InputPopUpContainer>
      <div
        className={popupState ? "show-alert-mask" : "hide-alert-mask"}
        style={maskState ? { display: "block" } : { display: "none" }}
      ></div>
      {popupState ? (
        <InputPopUpBox
          initValue={initValue}
          setValue={setValue}
          onKeyDown={onKeyDown}
          onCancel={onCancel}
          onConfirm={onConfirm}
        ></InputPopUpBox>
      ) : (
        <></>
      )}
    </InputPopUpContainer>
  );
};

const InputPopUpContainer = styled.div();
