import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';

import InterfacePage from './InterfacePage';
// import DataPage from './DataPage';
import AboutPage from './AboutPage';
import { settingPanelOpenAtom, settingPanelTabAtom } from '@/atoms';
import { useAtom, useSetAtom } from 'jotai';

const SettingPanel: React.FC<{}> = ({}) => {
    const setSettingPanelOpen = useSetAtom(settingPanelOpenAtom);
    const [settingPanelTab, setSettingPanelTab] = useAtom(settingPanelTabAtom);
    const { t } = useTranslation();

    return (
        <SettingPanelContainer>
            <TopRow>
                <CloseSettingPanelBtn
                    onClick={() => {
                        setSettingPanelOpen(false);
                    }}
                >
                    x
                </CloseSettingPanelBtn>
            </TopRow>
            <SettingBox>
                <SettingTabs>
                    <SettingTab
                        style={
                            settingPanelTab === 'dataTab'
                                ? { backgroundColor: 'var(--main-selected-bg-color)' }
                                : {}
                        }
                        onClick={(e) => setSettingPanelTab('dataTab')}
                    >
                        {t('setting.data.title')}
                    </SettingTab>
                    <SettingTab
                        style={
                            settingPanelTab === 'interfaceTab'
                                ? { backgroundColor: 'var(--main-selected-bg-color)' }
                                : {}
                        }
                        onClick={(e) => setSettingPanelTab('interfaceTab')}
                    >
                        {t('setting.interface.title')}
                    </SettingTab>
                    <SettingTab
                        style={
                            settingPanelTab === 'aboutTab'
                                ? { backgroundColor: 'var(--main-selected-bg-color)' }
                                : {}
                        }
                        onClick={(e) => setSettingPanelTab('aboutTab')}
                    >
                        {t('setting.about.title')}
                    </SettingTab>
                </SettingTabs>
                <SettingContent>
                    {settingPanelTab === 'interfaceTab' ? (
                        <InterfacePage />
                    ) : settingPanelTab == 'dataTab' ? (
                        // <DataPage />
                        <></>
                    ) : settingPanelTab == 'aboutTab' ? (
                        <AboutPage />
                    ) : (
                        <></>
                    )}
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
    borderRadius: '10px',
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
