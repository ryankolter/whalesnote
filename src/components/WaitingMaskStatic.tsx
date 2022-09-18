import styled from '@emotion/styled';

interface WaitingMaskStaticProps {
    show: boolean;
    word: string;
}

const WaitingMaskStatic: React.FC<WaitingMaskStaticProps> = ({ show, word }) => {
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '99999999',
});

const WordPiece = styled.div({
    fontSize: '24px',
    color: '#A9B7C6',
});

export default WaitingMaskStatic;
