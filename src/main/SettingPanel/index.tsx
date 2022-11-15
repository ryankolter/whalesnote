import styled from '@emotion/styled';
import { useCallback, useContext } from 'react';
import { GlobalContext } from '../../GlobalProvider';

import GlobalSetting from './GlobalSetting';
import DataSpace from './DataSpace';

const SettingPanel: React.FC<{}> = ({}) => {
    const { curSettingPanelTab, setCurSettingPanelTab } = useContext(GlobalContext);

    const handleSettingTabSwitch = useCallback(
        (tab_name: string) => {
            setCurSettingPanelTab(tab_name);
            window.localStorage.setItem('cur_setting_panel_tab', tab_name);
        },
        [setCurSettingPanelTab]
    );

    return (
        <SettingPanelContainer>
            <TopRow>
                <CloseSettingPanelBtn
                    onClick={() => {
                        setCurSettingPanelTab('none');
                    }}
                >
                    x
                </CloseSettingPanelBtn>
            </TopRow>
            <SettingBox>
                <SettingTabs>
                    <SettingTab
                        style={
                            curSettingPanelTab === 'global_setting'
                                ? { backgroundColor: 'var(--main-selected-bg-color)' }
                                : {}
                        }
                        onClick={(e) => handleSettingTabSwitch('global_setting')}
                    >
                        主题
                    </SettingTab>
                    <SettingTab
                        style={
                            curSettingPanelTab === 'data_space'
                                ? { backgroundColor: 'var(--main-selected-bg-color)' }
                                : {}
                        }
                        onClick={(e) => handleSettingTabSwitch('data_space')}
                    >
                        数据
                    </SettingTab>
                </SettingTabs>
                <SettingContent>
                    {curSettingPanelTab == 'global_setting' ? <GlobalSetting /> : <></>}
                    {curSettingPanelTab == 'data_space' ? <DataSpace /> : <></>}
                </SettingContent>
            </SettingBox>
        </SettingPanelContainer>
    );
};

const SettingPanelContainer = styled.div({
    width: '600px',
    height: '400px',
    position: 'fixed',
    top: 'calc(50% - 200px)',
    left: 'calc(50% - 300px)',
    padding: '20px 30px',
    boxSizing: 'border-box',
    backgroundColor: 'var(--float-panel-bg-color)',
    zIndex: '4500',
});

const TopRow = styled.div({
    display: 'flex',
    alignItem: 'center',
});

const CloseSettingPanelBtn = styled.div({
    width: '20px',
    height: '20px',
    lineHeight: '18px',
    fontSize: '20px',
    padding: '5px 10px',
    margin: '0 0 2px 0',
    cursor: 'pointer',
});

const SettingBox = styled.div({
    display: 'flex',
});

const SettingTabs = styled.div({
    display: 'flex',
    flexDirection: 'column',
    width: '80px',
    margin: '40px 20px 0 0',
});

const SettingTab = styled.div({
    height: '32px',
    lineHeight: '32px',
    margin: '6px 0',
    textAlign: 'center',
    cursor: 'pointer',
});

const SettingContent = styled.div({
    flex: '1',
    minWidth: '0',
});

export default SettingPanel;
