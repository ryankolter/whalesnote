import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { GlobalProvider } from './GlobalProvider';

import SideNav from './main/SideNav';
import CenterArea from './main/CenterArea/index';
import WaitingMask from './components/WaitingMask';
import WaitingMaskStatic from './components/WaitingMaskStatic';

import SocketServerBtn from './components/socketServerBtn';
import SocketClientBtn from './socketClientBtn';

import AssistantPanel from './main/AssistantPanel';

const App = () => {
    const [focus, setFocus] = useState('');
    const [blur, setBlur] = useState('');
    const [theme, setTheme] = useState('grey');
    const [keySelect, setKeySelect] = useState(false);
    const [showAssistantPanel, setShowAssistantPanel] = useState(false);

    const [showWaitingMask, setShowWaitingMask] = useState(false);

    useEffect(() => {
        console.log(showWaitingMask);
    }, [showWaitingMask]);

    return (
        <GlobalProvider>
            <AppContainer className={`${theme}-theme-global body-color`}>
                <WaitingMaskStatic show={showWaitingMask} word={'请等待......'}></WaitingMaskStatic>
                <RepoContent>
                    <SideNav
                        keySelect={keySelect}
                        setFocus={setFocus}
                        setBlur={setBlur}
                        setKeySelect={setKeySelect}
                        setShowWaitingMask={setShowWaitingMask}
                    />
                    <CenterArea
                        setFocus={setFocus}
                        setBlur={setBlur}
                        setKeySelect={setKeySelect}
                        focus={focus}
                        blur={blur}
                        keySelect={keySelect}
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
