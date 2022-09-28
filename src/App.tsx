import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { GlobalProvider } from './GlobalProvider';

import SideNav from './main/SideNav';
import CenterArea from './main/CenterArea';
import AssistantPanel from './main/AssistantPanel';

import SocketServerBtn from './components/socketServerBtn';
import SocketClientBtn from './socketClientBtn';

const App = () => {
    const [theme, setTheme] = useState('grey');
    const [showAssistantPanel, setShowAssistantPanel] = useState(false);

    return (
        <GlobalProvider>
            <AppContainer className={`${theme}-theme-global body-color`}>
                <RepoContent>
                    <SideNav />
                    <CenterArea
                        theme={theme}
                        showAssistantPanel={showAssistantPanel}
                        setShowAssistantPanel={setShowAssistantPanel}
                    />
                    {showAssistantPanel ? <AssistantPanel /> : <></>}
                </RepoContent>
                {/* <SocketClientBtn/>
                <SocketServerBtn/> */}
            </AppContainer>
        </GlobalProvider>
    );
};

const AppContainer = styled.div({
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
});

const RepoContent = styled.div({
    display: 'flex',
    alignItem: 'center',
    flex: '1',
    minHeight: '0',
    width: '100vw',
});

export default App;
