import { useContext, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';

import AssistantPanel from './AssistantPanel';
import TopIcons from './TopIcons';
import BottomIcons from './BottomIcons';

const SideBar: React.FC<{ theme: string }> = ({ theme }) => {
    const { currentTitle } = useContext(GlobalContext);
    const [curAssistantPanelName, setCurAssistantPanelName] = useState('none');

    return (
        <SideBarContainer>
            {curAssistantPanelName !== 'none' ? (
                <AssistantPanel
                    curAssistantPanelName={curAssistantPanelName}
                    setCurAssistantPanelName={setCurAssistantPanelName}
                    theme={theme}
                />
            ) : (
                <></>
            )}
            <SideBarColumn className="side-bar-color">
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
});

const SideBarTopIcons = styled.div({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '30px',
});

export default SideBar;
