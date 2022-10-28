import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';

const GlobalSetting: React.FC<{
    theme: string;
    setTheme: React.Dispatch<React.SetStateAction<string>>;
    closeAssistantPanel: () => void;
}> = ({ theme, setTheme, closeAssistantPanel }) => {
    const { curDataPath } = useContext(GlobalContext);

    return (
        <DataSpaceContainer>
            <TopRow>
                <CloseDataSpaceBtn
                    onClick={() => {
                        closeAssistantPanel();
                    }}
                >
                    x
                </CloseDataSpaceBtn>
            </TopRow>
            <ChildPart>
                <PartTitle>主题</PartTitle>
                <SelectArea>
                    {/* <SelectLabel>
                        <RadioBtn type='radio' name='theme' value='white' 
                        checked={ theme === 'white'} onChange={(e: any) => {setTheme(e.target.value);}}/>
                        明亮
                    </SelectLabel>
                    <SelectLabel>
                        <RadioBtn type='radio' name='theme' value='grey' 
                        checked={ theme === 'grey'} onChange={(e: any) => {setTheme(e.target.value);}}/>
                        黑夜
                    </SelectLabel> */}
                    <div className="radio-beauty-container">
                        <input
                            type="radio"
                            name="theme"
                            value="white"
                            id="radioNameWhite"
                            className="radio-input"
                            checked={theme === 'white'}
                            onChange={(e: any) => {
                                setTheme(e.target.value);
                            }}
                        />
                        <label htmlFor="radioNameWhite" className="radio-beauty"></label>
                        <span className="radio-name">明亮</span>
                    </div>
                    <div className="radio-beauty-container">
                        <input
                            type="radio"
                            name="theme"
                            value="grey"
                            id="radioNameGrey"
                            className="radio-input"
                            checked={theme === 'grey'}
                            onChange={(e: any) => {
                                setTheme(e.target.value);
                            }}
                        />
                        <label htmlFor="radioNameGrey" className="radio-beauty"></label>
                        <span className="radio-name">黑夜</span>
                    </div>
                </SelectArea>
            </ChildPart>
            <ChildPart>
                <PartTitle>字体</PartTitle>
                <div>编辑框</div>
                <div>预览框</div>
            </ChildPart>
            <ChildPart>
                <PartTitle>同步</PartTitle>
            </ChildPart>
        </DataSpaceContainer>
    );
};

const DataSpaceContainer = styled.div({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '5px',
});

const TopRow = styled.div({
    display: 'flex',
    alignItem: 'center',
    justifyContent: 'flex-end',
});

const CloseDataSpaceBtn = styled.div({
    width: '20px',
    height: '20px',
    lineHeight: '18px',
    fontSize: '20px',
    padding: '5px 10px',
    margin: '0 0 2px 0',
    cursor: 'pointer',
});

const ChildPart = styled.div({
    padding: '10px',
});

const PartTitle = styled.div({
    fontSize: '18px',
    fontWeight: '500',
    marginBottom: '15px',
    paddingBottom: '4px',
    borderBottom: '1px solid var(--main-border-color)',
});

const SelectArea = styled.div({
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 50px',
});

const SelectLabel = styled.label({});

const RadioBtn = styled.input(
    {
        paddingRight: '20px',
    },
    `
    &[type='radio'] {
        padding-right: 20px;
    }
`
);

export default GlobalSetting;
