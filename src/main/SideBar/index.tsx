import { useContext, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';

import AssistantPanel from './AssistantPanel';
import TopIcons from './TopIcons';
import BottomIcons from './BottomIcons';

const SideBar: React.FC<{
    theme: string;
    setTheme: React.Dispatch<React.SetStateAction<string>>;
}> = ({ theme, setTheme }) => {
    const { currentTitle } = useContext(GlobalContext);
    const [curAssistantPanelName, setCurAssistantPanelName] = useState('none');

    return (
        <SideBarContainer>
            {curAssistantPanelName !== 'none' ? (
                <AssistantPanel
                    curAssistantPanelName={curAssistantPanelName}
                    setCurAssistantPanelName={setCurAssistantPanelName}
                    theme={theme}
                    setTheme={setTheme}
                />
            ) : (
                <></>
            )}
            <SideBarColumn>
                <TopIcons />
                <BottomIcons
                    curAssistantPanelName={curAssistantPanelName}
                    setCurAssistantPanelName={setCurAssistantPanelName}
                />
            </SideBarColumn>
        </SideBarContainer>
    );
};

const SideBarContainer = styled.div({
    display: 'flex',
});

const SideBarColumn = styled.div({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '48px',
    backgroundColor: 'var(--sidebar-bg-color)',
});

const SideBarTopIcons = styled.div({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '30px',
});

export default SideBar;
