import styled from '@emotion/styled';

type AssistantPanelProps = Record<string, unknown>;

const AssistantPanel: React.FC<AssistantPanelProps> = ({}) => {
    return <AssistantPanelContainer className="child-border-color"></AssistantPanelContainer>;
};

const AssistantPanelContainer = styled.div({
    width: '400px',
    borderLeftWidth: '1.5px',
    borderLeftStyle: 'solid',
});

export default AssistantPanel;
