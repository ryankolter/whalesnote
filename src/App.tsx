import { useEffect } from 'react';
import styled from '@emotion/styled';

import WaitingMask from './components/WaitingMask';
import NavColumn from './main/NavColumn';
import CenterArea from './main/CenterArea';
import AssistantPanel from './main/AssistantPanel';
import SettingPanel from './main/SettingPanel';

import SocketServerBtn from './components/socketServerBtn';
import SocketClientBtn from './socketClientBtn';
import { useAtomValue } from 'jotai';
import { assistPanelOpenAtom, languageAtom, settingPanelOpenAtom, themeAtom } from './atoms';
import i18next from 'i18next';
import { useDataContext } from './context/DataProvider';

const App = () => {
    const theme = useAtomValue(themeAtom);
    const language = useAtomValue(languageAtom);
    const assistPanelOpen = useAtomValue(assistPanelOpenAtom);
    const settingPanelOpen = useAtomValue(settingPanelOpenAtom);

    useEffect(() => {
        i18next.changeLanguage(language);
    }, [language]);

    return (
        <AppContainer className={`${theme}-theme-global`}>
            <AppUI>
                <NavColumn />
                <CenterArea />
                {assistPanelOpen && <AssistantPanel />}
                {settingPanelOpen && <SettingPanel />}
            </AppUI>
            <WaitingMask in={false} timeout={300}></WaitingMask>
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
