import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';

import SwitchModePanel from './SwitchModePanel';
import ExportPanel from './ExportPanel';
import SvgIcon from '../../components/SvgIcon';
import settingPanelIcon from '../../resources/icon/sideBar/settingPanelIcon.svg';

const ToolBar: React.FC<{
    mdRenderState: string;
    setMdRenderState: React.Dispatch<React.SetStateAction<string>>;
}> = ({ mdRenderState, setMdRenderState }) => {
    const {
        curSettingPanelTab,
        editorType,
        setCurSettingPanelTab,
        curAssistantPanelTab,
        setCurAssistantPanelTab,
    } = useContext(GlobalContext);

    const handleOpenSettingClick = useCallback(() => {
        const curTab = window.localStorage.getItem('cur_setting_panel_tab') || 'data_space';
        setCurSettingPanelTab((curSettingPanelTab: string) => {
            if (curSettingPanelTab !== 'none') {
                return 'none';
            } else {
                return curTab;
            }
        });
    }, []);

    const handleOpenAssistantClick = useCallback(() => {
        const curTab = window.localStorage.getItem('cur_assistant_panel_tab') || 'mobile_panel';
        setCurAssistantPanelTab(curTab);
    }, []);

    return (
        <TopRowContainer>
            <BreakCrumb>
                {editorType === 'codemirror' ? (
                    <SwitchModePanel
                        mdRenderState={mdRenderState}
                        setMdRenderState={setMdRenderState}
                    />
                ) : (
                    <></>
                )}
            </BreakCrumb>
            <SettingPanelBtnBox>
                <SettingPanelBtn
                    className="ri-settings-3-line"
                    onClick={() => handleOpenSettingClick()}
                ></SettingPanelBtn>
            </SettingPanelBtnBox>
            <ExportPanel />
            <AssistantPanelBtnBox>
                {curAssistantPanelTab === 'none' ? (
                    <AssistantPanelBtn
                        className="ri-side-bar-line"
                        onClick={() => handleOpenAssistantClick()}
                    ></AssistantPanelBtn>
                ) : (
                    <></>
                )}
            </AssistantPanelBtnBox>
        </TopRowContainer>
    );
};

const TopRowContainer = styled.div(
    {
        position: 'relative',
        width: '100%',
        height: '60px',
        display: 'flex',
        padding: '10px 45px 10px 0',
        alignItems: 'center',
        boxSizing: 'border-box',
        backgroundColor: 'var(--main-bg-color)',
    },
    `
    -webkit-app-region: drag;
`
);

const BreakCrumb = styled.div({
    width: '100%',
    flex: '1',
    minWidth: '0',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    zIndex: '1000',
});

const SettingPanelBtnBox = styled.div({
    width: '20px',
    height: '20px',
    margin: '1px 3px 0 0',
});

const SettingPanelBtn = styled.div({
    fontSize: '22px',
    color: 'var(--main-icon-color)',
    transform: 'rotate(180deg)',
});

const AssistantPanelBtnBox = styled.div({
    position: 'absolute',
    top: '20px',
    right: '20px',
});

const AssistantPanelBtn = styled.div({
    fontSize: '22px',
    color: 'var(--main-icon-color)',
    transform: 'rotate(180deg)',
});

export default ToolBar;
