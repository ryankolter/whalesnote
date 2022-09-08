import styled from '@emotion/styled';

const AssistantPanel: React.FC<AssistantPanelProps> = ({}) => {
    return <AssistantPanelContainer></AssistantPanelContainer>;
};

const AssistantPanelContainer = styled.div({
    width: '400px',
});

type AssistantPanelProps = Record<string, unknown>;

export default AssistantPanel;
