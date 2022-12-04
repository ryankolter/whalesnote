import styled from '@emotion/styled';

const WaitingMaskStatic: React.FC<{
    show: boolean;
    word: string;
}> = ({ show, word }) => {
    return (
        <Mask style={{ display: show ? 'flex' : 'none' }}>
            <WordPiece>{word}</WordPiece>
        </Mask>
    );
};

const Mask = styled.div({
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    backgroundColor: 'var(--main-waiting-bg-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '7000',
});

const WordPiece = styled.div({
    fontSize: '24px',
    color: 'var(--waiting-mask-text-color)',
});

export default WaitingMaskStatic;
