import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';

import SwitchModePanel from './SwitchModePanel';
import ExportPanel from './ExportPanel';
import SvgIcon from '../../components/SvgIcon';
import mobilePanelIcon from '../../resources/icon/sideBar/mobilePanelIcon.svg';
import settingPanelIcon from '../../resources/icon/sideBar/settingPanelIcon.svg';

const ToolBar: React.FC<{
    mdRenderState: string;
    setMdRenderState: React.Dispatch<React.SetStateAction<string>>;
}> = ({ mdRenderState, setMdRenderState }) => {
    const {
        curSettingPanelTab,
        setCurSettingPanelTab,
        curAssistantPanelTab,
        setCurAssistantPanelTab,
    } = useContext(GlobalContext);

    const handleOpenSettingClick = useCallback(() => {
        const curTab = window.localStorage.getItem('cur_setting_panel_tab') || 'global_setting';
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
            <BreakCrumb></BreakCrumb>
            <SwitchModePanel mdRenderState={mdRenderState} setMdRenderState={setMdRenderState} />
            <SvgIcon
                iconWidth={20}
                iconHeight={20}
                iconPadding={8}
                iconSrc={settingPanelIcon}
                onClick={() => handleOpenSettingClick()}
            />
            <ExportPanel />
            <AssistantPanelBtn>
                {curAssistantPanelTab === 'none' ? (
                    <SvgIcon
                        iconWidth={16}
                        iconHeight={20}
                        iconPadding={0}
                        iconSrc={mobilePanelIcon}
                        onClick={() => handleOpenAssistantClick()}
                    />
                ) : (
                    <></>
                )}
            </AssistantPanelBtn>
        </TopRowContainer>
    );
};

const TopRowContainer = styled.div(
    {
        position: 'relative',
        width: '100%',
        height: '60px',
        display: 'flex',
        padding: '0 40px 0 0',
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
    zIndex: '1000',
});

const AssistantPanelBtn = styled.div({
    position: 'absolute',
    top: '20px',
    right: '20px',
});

export default ToolBar;
