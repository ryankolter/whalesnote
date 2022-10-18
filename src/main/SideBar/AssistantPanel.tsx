import styled from '@emotion/styled';

import DataSpace from './DataSpace';

const AssistantPanel: React.FC<{
    curAssistantPanelName: string;
}> = ({ curAssistantPanelName }) => {
    return (
        <AssistantPanelContainer className="child-border-color">
            {curAssistantPanelName == 'data_panel' ? <DataSpace></DataSpace> : <></>}
        </AssistantPanelContainer>
    );
};

const AssistantPanelContainer = styled.div({
    width: '400px',
    borderLeftWidth: '1.5px',
    borderLeftStyle: 'solid',
    padding: '5px',
});

export default AssistantPanel;
