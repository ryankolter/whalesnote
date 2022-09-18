import { keyframes, ClassNames } from '@emotion/react';
import { Transition } from 'react-transition-group';

const duration = 3000;

const defaultStyle = {
    display: 'none',
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    transition: `background-color ${duration}ms ease-in-out`,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    zIndex: '9999999',
};

const transitionStyles = {
    entering: { backgroundColor: 'rgba(0,0,0,0.4)', display: 'block' },
    entered: { backgroundColor: 'rgba(0,0,0,0.4)', display: 'block' },
    exiting: { backgroundColor: 'rgba(0,0,0,0)', display: 'none' },
    exited: { backgroundColor: 'rgba(0,0,0,0)', display: 'none' },
};

interface WaitingMaskProps {
    in: boolean;
    timeout: number;
}

const WaitingMask: React.FC<WaitingMaskProps> = ({ in: inProp, timeout: timeout }) => {
    return (
        <Transition in={inProp} timeout={timeout}>
            {(state) => (
                <div
                    style={{
                        ...defaultStyle,
                        ...transitionStyles[state],
                    }}
                >
                    <ClassNames>
                        {({ css, cx }) => (
                            <div
                                className={cx(
                                    css`
                                        position: fixed;
                                        top: 50%;
                                        left: 50%;
                                        display: inline-block;
                                        border: 4px solid #2c3033;
                                        border-left-color: #939395;
                                        border-radius: 50%;
                                        width: 30px;
                                        height: 30px;
                                        animation: ${donut_spin} 1.2s linear infinite;
                                    `
                                )}
                            />
                        )}
                    </ClassNames>
                </div>
            )}
        </Transition>
    );
};

const donut_spin = keyframes`
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
`;

export default WaitingMask;
