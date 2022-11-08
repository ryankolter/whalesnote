import { useState } from 'react';
import styled from '@emotion/styled';

import AssistantPanel from './AssistantPanel';
import TopIcons from './TopIcons';
import BottomIcons from './BottomIcons';

const SideBar: React.FC<{}> = ({}) => {
    const [curAssistantPanelName, setCurAssistantPanelName] = useState('none');

    return (
        <SideBarContainer>
            {curAssistantPanelName !== 'none' ? (
                <AssistantPanel
                    curAssistantPanelName={curAssistantPanelName}
                    setCurAssistantPanelName={setCurAssistantPanelName}
                />
            ) : (
                <></>
            )}
            <SideBarColumn>
                <TopIcons />
                <BottomIcons setCurAssistantPanelName={setCurAssistantPanelName} />
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

export default SideBar;
