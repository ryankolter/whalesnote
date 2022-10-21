import styled from '@emotion/styled';
import { useCallback } from 'react';

import DataSpace from './DataSpace';
import ImageSpace from './ImageSpace';
import TrashList from './TrashList';

const AssistantPanel: React.FC<{
    theme: string;
    curAssistantPanelName: string;
    setCurAssistantPanelName: any;
}> = ({ theme, curAssistantPanelName, setCurAssistantPanelName }) => {
    const closeAssistantPanel = useCallback(() => {
        setCurAssistantPanelName('none');
    }, [setCurAssistantPanelName]);

    return (
        <AssistantPanelContainer className="child-border-color">
            {curAssistantPanelName == 'data_space' ? <DataSpace /> : <></>}
            {curAssistantPanelName == 'mobile_panel' ? <></> : <></>}
            {curAssistantPanelName == 'image_space' ? (
                <ImageSpace closeAssistantPanel={closeAssistantPanel} />
            ) : (
                <></>
            )}
            {curAssistantPanelName == 'model_panel' ? <></> : <></>}
            {curAssistantPanelName == 'trash_list' ? (
                <TrashList theme={theme} closeAssistantPanel={closeAssistantPanel} />
            ) : (
                <></>
            )}
            {curAssistantPanelName == 'setting_panel' ? <></> : <></>}
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
