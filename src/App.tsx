import { useContext, useEffect } from 'react';
import styled from '@emotion/styled';

import { GlobalContext } from './GlobalProvider';
import WaitingMask from './components/WaitingMask';
import NavColumn from './main/NavColumn';
import CenterArea from './main/CenterArea';
import SideBar from './main/SideBar';

import SocketServerBtn from './components/socketServerBtn';
import SocketClientBtn from './socketClientBtn';

const App = () => {
    const { dataInitingFlag, dataPathChangeFlag, theme } = useContext(GlobalContext);

    return (
        <AppContainer className={`${theme}-theme-global`}>
            <WaitingMask in={dataInitingFlag} timeout={300}></WaitingMask>
            {dataPathChangeFlag > 0 ? (
                <AppUI>
                    <NavColumn />
                    <CenterArea />
                    <SideBar />
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
