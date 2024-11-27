import styled from '@emotion/styled';

import SwitchMode from './SwitchMode';
import ExportNote from './ExportNote';
import { assistPanelOpenAtom, settingPanelOpenAtom } from '@/atoms';
import { useAtom, useSetAtom } from 'jotai';
import { PanelRightIcon, SettingsIcon } from 'lucide-react';

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
                    <SettingsIcon
                        width="21"
                        height="21"
                        style={{ color: 'var(--main-icon-color)' }}
                        className="cursor-pointer translate-y-[0.5px]"
                        onClick={() => setSettingPanelOpen((_open) => !_open)}
                    />
                </SettingPanelBtnBox>
                <ExportNote />
                <AssistantPanelBtnBox>
                    {!assistPanelOpen && (
                        <PanelRightIcon
                            width="20"
                            height="20"
                            style={{ color: 'var(--main-icon-color)' }}
                            className="cursor-pointer"
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
    alignItems: 'center',
});

const SettingPanelBtnBox = styled.div(
    `
    app-region: no-drag;
`,
);

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

export default ToolBar;
