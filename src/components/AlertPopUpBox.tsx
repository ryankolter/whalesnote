import styled from "@emotion/styled";
import { useEffect } from "react";

interface AlertPopUpBoxProps {
  title: string;
  content: string;
  onCancel: () => void;
  onConfirm: () => void;
  onKeyDown: (e: any) => void;
}

export const AlertPopUpBox: React.FC<AlertPopUpBoxProps> = (props) => {
  const { title, content, onCancel, onConfirm, onKeyDown } = props;

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <AlertBox>
      <AlertContent>{content}</AlertContent>
      <Operation>
        <CancelBtn onClick={() => onCancel()}>取消</CancelBtn>
        <ConfirmBtn onClick={() => onConfirm()}>确认</ConfirmBtn>
      </Operation>
    </AlertBox>
  );
};

const AlertBox = styled.div({
  position: "fixed",
  boxSizing: "border-box",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "290px",
  padding: "30px 20px",
  borderRadius: "5px",
  fontSize: "14px",
  color: "#C8C8C8",
  backgroundColor: "#2C3033",
  zIndex: "999999",
});

const AlertContent = styled.div({
  textAlign: "center",
});

const Operation = styled.div({
  display: "flex",
  justifyContent: "space-around",
});

const CancelBtn = styled.div({
  width: "40%",
  fontSize: "16px",
  marginTop: "20px",
  padding: "4px 0",
  borderRadius: "5px",
  textAlign: "center",
  backgroundColor: "#464646",
  cursor: "pointer",
});

const ConfirmBtn = styled.div({
  width: "40%",
  fontSize: "16px",
  marginTop: "20px",
  padding: "4px 0",
  borderRadius: "5px",
  textAlign: "center",
  backgroundColor: "#464646",
  cursor: "pointer",
});
