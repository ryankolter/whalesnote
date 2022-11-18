import { ReactEventHandler, useCallback, useContext, useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';

export const SelectionOptions: React.FC<{
    title: string;
    currentOption: string;
    optionList: string[];
    handleOption: (option: string) => void;
    translateFunc?: (option: string) => string;
}> = ({ title, currentOption, optionList, handleOption, translateFunc }) => {
    const [showOptions, setShowOptions] = useState(false);
    const selectionRef = useRef<HTMLDivElement>(null);

    const handleClick = useCallback(
        (event: MouseEvent) => {
            event.preventDefault();
            if (selectionRef && selectionRef.current?.contains(event.target as Node)) {
                setShowOptions((_showOptions) => !_showOptions);
            } else {
                setShowOptions(false);
            }
        },
        [setShowOptions]
    );

    useEffect(() => {
        document.addEventListener('click', handleClick);
        return () => {
            document.removeEventListener('click', handleClick);
        };
    }, [handleClick]);

    return (
        <SelectionContainer>
            <Title optionHeight={32}>{title}</Title>
            <Selection ref={selectionRef}>
                <CurrentOption optionHeight={32}>
                    <CurrentValue>
                        {translateFunc ? translateFunc(currentOption) : currentOption}
                    </CurrentValue>
                    <Triangle optionHeight={32}></Triangle>
                </CurrentOption>
                {showOptions ? (
                    <Options>
                        {optionList.map((option: string, index: number) => {
                            return (
                                <Option
                                    optionHeight={32}
                                    key={index}
                                    onClick={(e) => handleOption(option)}
                                >
                                    <OptionValue>
                                        {translateFunc ? translateFunc(option) : option}
                                    </OptionValue>
                                </Option>
                            );
                        })}
                    </Options>
                ) : (
                    <></>
                )}
            </Selection>
        </SelectionContainer>
    );
};

const SelectionContainer = styled.div({
    display: 'flex',
    alignItem: 'center',
    marginBottom: '16px',
});

const Title = styled.div(
    {
        width: '160px',
        fontSize: '15px',
    },
    (props: { optionHeight: number }) => ({
        height: props.optionHeight + 'px',
        lineHeight: props.optionHeight + 'px',
    })
);

const Selection = styled.div({
    position: 'relative',
    flex: '1',
    minWidth: '0',
    cursor: 'pointer',
});

const CurrentOption = styled.div(
    {
        position: 'relative',
        display: ' flex',
        justifyContent: 'center',
        boxSizing: 'border-box',
        border: '1px solid var(--main-border-color)',
        backgroundColor: 'var(--main-bg-color)',
    },
    (props: { optionHeight: number }) => ({
        height: props.optionHeight + 'px',
        lineHeight: props.optionHeight + 'px',
    })
);

const CurrentValue = styled.div({
    wordBreak: 'break-all',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
});

const Triangle = styled.div(
    {
        position: 'absolute',
        right: '12px',
        display: 'block',
        height: '0',
        width: '0',
        marginLeft: '4px',
        borderBottom: '10px solid transparent',
        borderTop: '10px solid #939395',
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
    },
    (props: { optionHeight: number }) => ({
        top: (props.optionHeight - 10) / 2 + 'px',
    })
);

const OptionValue = styled.span({});

const Options = styled.div({
    width: '100%',
    position: 'absolute',
    left: '0',
    right: '0',
    padding: '5px 0',
    boxSizing: 'border-box',
    border: '1px solid var(--main-border-color)',
    backgroundColor: 'var(--main-bg-color)',
    zIndex: '4000',
});

const Option = styled.div(
    {
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        boxSizing: 'border-box',
        wordBreak: 'break-all',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
    },
    (props: { optionHeight: number }) => ({
        height: props.optionHeight + 'px',
        lineHeight: props.optionHeight + 'px',
    })
);
