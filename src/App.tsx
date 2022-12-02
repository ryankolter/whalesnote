import { useContext, useEffect } from 'react';
import styled from '@emotion/styled';

import { GlobalContext } from './GlobalProvider';
import WaitingMask from './components/WaitingMask';
import WaitingMaskStatic from './components/WaitingMaskStatic';
import NavColumn from './main/NavColumn';
import CenterArea from './main/CenterArea';
import AssistantPanel from './main/AssistantPanel';
import SettingPanel from './main/SettingPanel';

import SocketServerBtn from './components/socketServerBtn';
import SocketClientBtn from './socketClientBtn';

const App = () => {
    const {
        curAssistantPanelTab,
        curSettingPanelTab,
        dataInitingFlag,
        dataPathChangeFlag,
        dataSwitchingFlag,
        theme,
        whalenote,
    } = useContext(GlobalContext);

    return (
        <AppContainer className={`${theme}-theme-global`}>
            <WaitingMask in={dataInitingFlag} timeout={300}></WaitingMask>
            <WaitingMaskStatic show={dataSwitchingFlag} word={'载入中......'}></WaitingMaskStatic>
            {dataPathChangeFlag > 0 ? (
                <AppUI>
                    <NavColumn />
                    <CenterArea />
                    {curAssistantPanelTab !== 'none' ? <AssistantPanel /> : <></>}
                    {curSettingPanelTab !== 'none' ? <SettingPanel /> : <></>}
                </AppUI>
            ) : (
                <></>
            )}
            {/* <SocketClientBtn/>
            <SocketServerBtn/> */}
        </AppContainer>
    );
};

const AppContainer = styled.div({
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    color: 'var(--main-text-color)',
    backgroundColor: 'var(--main-bg-color)',
});

const AppUI = styled.div({
    display: 'flex',
    alignItem: 'center',
    flex: '1',
    minHeight: '0',
    width: '100vw',
});

export default App;
