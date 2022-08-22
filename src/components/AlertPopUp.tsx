import styled from "@emotion/styled";
import { AlertPopUpBox } from "./AlertPopUpBox";

interface AlertPopUpProps {
    popupState: boolean;
    maskState: boolean;
    title: string;
    content: string;
    onCancel: () => void;
    onConfirm: () => void;
    onKeyDown: (e: any) => void;
}

export const AlertPopUp: React.FC<AlertPopUpProps> = (props) => {
    const { popupState, maskState, title, content, onCancel, onConfirm, onKeyDown } = props;

    return (
        <AlertPopUpContainer>
            <div
                className={popupState ? "show-alert-mask" : "hide-alert-mask"}
                style={maskState ? { display: "block" } : { display: "none" }}
            ></div>
            {popupState ? (
                <AlertPopUpBox
                    title={title}
                    content={content}
                    onCancel={onCancel}
                    onConfirm={onConfirm}
                    onKeyDown={onKeyDown}
                ></AlertPopUpBox>
            ) : (
                <></>
            )}
        </AlertPopUpContainer>
    );
};

const AlertPopUpContainer = styled.div();
