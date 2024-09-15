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
import { useDataPathContext } from './context/DataPathProvider';
import { useAtomValue } from 'jotai';
import {
    assistPanelOpenAtom,
    assistPanelTabAtom,
    languageAtom,
    settingPanelOpenAtom,
    themeAtom,
} from './atoms';
import i18next from 'i18next';

const App = () => {
    const { whalesnote, dataInitingFlag, dataPathChangeFlag } = useContext(GlobalContext);
    const theme = useAtomValue(themeAtom);

    const assistPanelOpen = useAtomValue(assistPanelOpenAtom);
    const settingPanelOpen = useAtomValue(settingPanelOpenAtom);
    // const { dataInitingFlag, dataPathChangeFlag } = useDataPathContext();

    const language = useAtomValue(languageAtom);
    useEffect(() => {
        i18next.changeLanguage(language);
    }, [language]);

    return (
        <AppContainer className={`${theme}-theme-global`}>
            <WaitingMask in={dataInitingFlag} timeout={300}></WaitingMask>
            {dataPathChangeFlag > 0 ? (
                <AppUI>
                    <NavColumn />
                    <CenterArea />
                    {assistPanelOpen && <AssistantPanel />}
                    {settingPanelOpen && <SettingPanel />}
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
