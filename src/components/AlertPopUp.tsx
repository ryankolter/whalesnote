import styled from '@emotion/styled';
import { AlertPopUpBox } from './AlertPopUpBox';

export const AlertPopUp: React.FC<{
    popupState: boolean;
    maskState: boolean;
    content: string;
    onCancel?: () => void;
    onConfirm: () => void;
}> = ({ popupState, maskState, content, onCancel, onConfirm }) => {
    return (
        <AlertPopUpContainer>
            <div
                className={popupState ? 'show-alert-mask' : 'hide-alert-mask'}
                style={maskState ? { display: 'block' } : { display: 'none' }}
            ></div>
            {popupState ? (
                <AlertPopUpBox
                    content={content}
                    onCancel={onCancel}
                    onConfirm={onConfirm}
                ></AlertPopUpBox>
            ) : (
                <></>
            )}
        </AlertPopUpContainer>
    );
};

const AlertPopUpContainer = styled.div();
