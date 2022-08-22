import styled from "@emotion/styled";
import { useCallback } from "react";

interface InputPopUpBoxProps {
    initValue: string;
    setValue: (val: string) => void;
    onCancel: () => void;
    onConfirm: () => void;
    onKeyDown: (e: any) => void;
}

export const InputPopUpBox: React.FC<InputPopUpBoxProps> = (props) => {
    const { initValue, setValue, onCancel, onConfirm, onKeyDown } = props;

    const onChangeHandle = useCallback(
        (event: any) => {
            console.log(event.target.value);
            setValue(event.target.value);
        },
        [setValue]
    );

    // useEffect(() => {
    //     document.addEventListener('keydown', onKeyDown);
    //     return () => {
    //         document.removeEventListener('keydown', onKeyDown);
    //     }
    // },[])

    return (
        <InputBox>
            <Input
                type='text'
                value={initValue}
                onChange={(e) => {
                    onChangeHandle(e);
                }}
                onKeyDown={onKeyDown}
                autoFocus
            />
            <Operation>
                <CancelBtn onClick={() => onCancel()}>取消</CancelBtn>
                <ConfirmBtn onClick={() => onConfirm()}>确认</ConfirmBtn>
            </Operation>
        </InputBox>
    );
};

const InputBox = styled.div({
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

const Input = styled.input({
    border: "none",
    outline: "none",
    flex: "1",
    fontSize: "16px",
    marginLeft: "12px",
    width: "90%",
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
