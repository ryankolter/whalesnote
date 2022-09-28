import styled from '@emotion/styled';

type AssistantPanelProps = Record<string, unknown>;

const AssistantPanel: React.FC<AssistantPanelProps> = ({}) => {
    return <AssistantPanelContainer></AssistantPanelContainer>;
};

const AssistantPanelContainer = styled.div({
    width: '400px',
});

export default AssistantPanel;
