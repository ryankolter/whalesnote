import { useCallback, useContext } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';

import InterfacePage from './InterfacePage';
import DataPage from './DataPage';
import AboutPage from './AboutPage';

const SettingPanel: React.FC<{}> = ({}) => {
    const { curSettingPanelTab, setCurSettingPanelTab } = useContext(GlobalContext);
    const { t } = useTranslation();

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
                            curSettingPanelTab === 'data_page'
                                ? { backgroundColor: 'var(--main-selected-bg-color)' }
                                : {}
                        }
                        onClick={(e) => handleSettingTabSwitch('data_page')}
                    >
                        {t('setting.data.title')}
                    </SettingTab>
                    <SettingTab
                        style={
                            curSettingPanelTab === 'interface_page'
                                ? { backgroundColor: 'var(--main-selected-bg-color)' }
                                : {}
                        }
                        onClick={(e) => handleSettingTabSwitch('interface_page')}
                    >
                        {t('setting.interface.title')}
                    </SettingTab>
                    <SettingTab
                        style={
                            curSettingPanelTab === 'about_page'
                                ? { backgroundColor: 'var(--main-selected-bg-color)' }
                                : {}
                        }
                        onClick={(e) => handleSettingTabSwitch('about_page')}
                    >
                        {t('setting.about.title')}
                    </SettingTab>
                </SettingTabs>
                <SettingContent>
                    {curSettingPanelTab == 'interface_page' ? <InterfacePage /> : <></>}
                    {curSettingPanelTab == 'data_page' ? <DataPage /> : <></>}
                    {curSettingPanelTab == 'about_page' ? <AboutPage /> : <></>}
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
