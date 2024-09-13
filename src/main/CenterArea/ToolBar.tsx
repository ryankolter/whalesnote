import { useCallback, useContext } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';

import SwitchMode from './SwitchMode';
import ExportNote from './ExportNote';
import { assistPanelOpenAtom, settingPanelOpenAtom } from '@/atoms';
import { useAtom, useSetAtom } from 'jotai';

const ToolBar: React.FC<{
    mdRenderState: string;
    setMdRenderState: React.Dispatch<React.SetStateAction<string>>;
}> = ({ mdRenderState, setMdRenderState }) => {
    const [assistPanelOpen, setAssistPanelOpen] = useAtom(assistPanelOpenAtom);
    const setSettingPanelOpen = useSetAtom(settingPanelOpenAtom);

    return (
        <TopRowContainer>
            <BreakCrumb>
                <SwitchMode mdRenderState={mdRenderState} setMdRenderState={setMdRenderState} />
            </BreakCrumb>
            <AllBtnBox>
                <SettingPanelBtnBox>
                    <SettingPanelBtn
                        className="ri-settings-3-line"
                        onClick={() => setSettingPanelOpen((_open) => !_open)}
                    ></SettingPanelBtn>
                </SettingPanelBtnBox>
                <ExportNote />
                <AssistantPanelBtnBox>
                    {!assistPanelOpen && (
                        <AssistantPanelBtn
                            className="ri-side-bar-line"
                            onClick={() => {
                                setAssistPanelOpen(true);
                            }}
                        />
                    )}
                </AssistantPanelBtnBox>
            </AllBtnBox>
        </TopRowContainer>
    );
};

const TopRowContainer = styled.div(
    {
        position: 'relative',
        width: '100%',
        height: '60px',
        display: 'flex',
        padding: '10px 45px 10px 20px',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        backgroundColor: 'var(--render-main-bg-color)',
    },
    `
    app-region: drag;
`,
);

const BreakCrumb = styled.div({
    display: 'flex',
    alignItems: 'center',
    zIndex: '1000',
});

const AllBtnBox = styled.div({
    display: 'flex',
});

const SettingPanelBtnBox = styled.div(
    {
        width: '20px',
        height: '20px',
        margin: '1px 3px 0 0',
    },
    `
    app-region: no-drag;
`,
);

const SettingPanelBtn = styled.div({
    fontSize: '22px',
    color: 'var(--main-icon-color)',
    transform: 'rotate(180deg)',
    cursor: 'pointer',
});

const AssistantPanelBtnBox = styled.div(
    {
        position: 'absolute',
        top: '20px',
        right: '20px',
    },
    `
app-region: no-drag;
`,
);

const AssistantPanelBtn = styled.div({
    fontSize: '22px',
    color: 'var(--main-icon-color)',
    transform: 'rotate(180deg)',
    cursor: 'pointer',
});

export default ToolBar;
