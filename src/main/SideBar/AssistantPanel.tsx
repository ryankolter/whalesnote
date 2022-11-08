import styled from '@emotion/styled';
import React, { useCallback, useRef, useState } from 'react';

import DataSpace from './DataSpace';
import ImageSpace from './ImageSpace';
import TrashList from './TrashList';
import GlobalSetting from './GlobalSetting';

const AssistantPanel: React.FC<{
    curAssistantPanelName: string;
    setCurAssistantPanelName: React.Dispatch<React.SetStateAction<string>>;
}> = ({ curAssistantPanelName, setCurAssistantPanelName }) => {
    const resizeAssistantPanelOffsetX = useRef<number>(0);
    const lastPageX = useRef<number>(0);
    const [assistantPanelWidth, setAssistantPanelWidth] = useState(
        Number(window.localStorage.getItem('assistant_panel_width')) || 360
    );

    const closeAssistantPanel = useCallback(() => {
        setCurAssistantPanelName('none');
    }, [setCurAssistantPanelName]);

    return (
        <AssistantPanelContainer width={assistantPanelWidth}>
            <ResizeAssistantPanelWidth
                left={0}
                onDragStart={(e: React.DragEvent) => {
                    resizeAssistantPanelOffsetX.current =
                        document.body.clientWidth - assistantPanelWidth - 48 - e.pageX;
                }}
                onDrag={(e: React.DragEvent) => {
                    if (Math.abs(e.pageX - lastPageX.current) < 5) return;
                    lastPageX.current = e.pageX;
                    if (e.pageX > 0 && e.pageX < document.body.clientWidth) {
                        const newFolderWidth =
                            document.body.clientWidth -
                            e.pageX -
                            48 -
                            resizeAssistantPanelOffsetX.current;
                        if (newFolderWidth >= 250 && newFolderWidth <= 800) {
                            setAssistantPanelWidth(newFolderWidth);
                        }
                    }
                }}
                onDragEnd={(e: React.DragEvent) => {
                    window.localStorage.setItem(
                        'assistant_panel_width',
                        assistantPanelWidth.toString()
                    );
                }}
                draggable="true"
            ></ResizeAssistantPanelWidth>
            {curAssistantPanelName == 'data_space' ? (
                <DataSpace closeAssistantPanel={closeAssistantPanel} />
            ) : (
                <></>
            )}
            {curAssistantPanelName == 'mobile_panel' ? <></> : <></>}
            {curAssistantPanelName == 'image_space' ? (
                <ImageSpace closeAssistantPanel={closeAssistantPanel} />
            ) : (
                <></>
            )}
            {curAssistantPanelName == 'model_panel' ? <></> : <></>}
            {curAssistantPanelName == 'trash_list' ? (
                <TrashList closeAssistantPanel={closeAssistantPanel} />
            ) : (
                <></>
            )}
            {curAssistantPanelName == 'global_setting' ? (
                <GlobalSetting closeAssistantPanel={closeAssistantPanel} />
            ) : (
                <></>
            )}
        </AssistantPanelContainer>
    );
};

const AssistantPanelContainer = styled.div(
    {
        position: 'relative',
        border: '1px solid var(--main-border-color)',
        padding: '5px',
    },
    (props: { width: number }) => ({
        width: props.width,
    })
);

const ResizeAssistantPanelWidth = styled.div(
    {
        width: '8px',
        cursor: 'col-resize',
        position: 'absolute',
        top: '0',
        height: '100%',
        zIndex: 1000,
    },
    (props: { left: number }) => ({
        left: props.left - 4,
    })
);

export default AssistantPanel;
