import { useEffect } from 'react';
import styled from '@emotion/styled';

export const AlertPopUpBox: React.FC<{
    title: string;
    content: string;
    onCancel: () => void;
    onConfirm: () => void;
    onKeyDown: (e: Event) => void;
}> = ({ title, content, onCancel, onConfirm, onKeyDown }) => {
    useEffect(() => {
        document.addEventListener('keydown', onKeyDown, true);
        return () => {
            document.removeEventListener('keydown', onKeyDown, true);
        };
    }, [onKeyDown]);

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
    position: 'fixed',
    boxSizing: 'border-box',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '290px',
    padding: '30px 20px',
    borderRadius: '5px',
    fontSize: '14px',
    color: 'var(--main-text-color)',
    backgroundColor: 'var(--float-popup-bg-color)',
    zIndex: '8000',
});

const AlertContent = styled.div({
    textAlign: 'center',
});

const Operation = styled.div({
    display: 'flex',
    justifyContent: 'space-around',
});

const CancelBtn = styled.div({
    width: '40%',
    fontSize: '16px',
    marginTop: '20px',
    padding: '4px 0',
    borderRadius: '5px',
    textAlign: 'center',
    backgroundColor: 'var(--main-btn-bg-color)',
    cursor: 'pointer',
});

const ConfirmBtn = styled.div({
    width: '40%',
    fontSize: '16px',
    marginTop: '20px',
    padding: '4px 0',
    borderRadius: '5px',
    textAlign: 'center',
    backgroundColor: 'var(--main-btn-bg-color)',
    cursor: 'pointer',
});
