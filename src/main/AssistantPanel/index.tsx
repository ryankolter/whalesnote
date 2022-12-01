import styled from '@emotion/styled';
import React, { useCallback, useContext, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';

import TrashList from './TrashList';

const AssistantPanel: React.FC<{}> = ({}) => {
    const { curAssistantPanelTab, setCurAssistantPanelTab } = useContext(GlobalContext);

    const resizeAssistantPanelOffsetX = useRef<number>(0);
    const lastPageX = useRef<number>(0);
    const [assistantPanelWidth, setAssistantPanelWidth] = useState(
        Number(window.localStorage.getItem('assistant_panel_width')) || 360
    );

    const handleAssistantTabSwitch = useCallback(
        (tab_name: string) => {
            setCurAssistantPanelTab(tab_name);
            window.localStorage.setItem('cur_assistant_panel_tab', tab_name);
        },
        [setCurAssistantPanelTab]
    );

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
            <AssistantBox>
                <FloatCloseBtnBox>
                    <FloatCloseBtn
                        className="ri-side-bar-fill"
                        onClick={() => setCurAssistantPanelTab('none')}
                    ></FloatCloseBtn>
                </FloatCloseBtnBox>

                <AssistantTabs>
                    <AssistantTab
                        style={
                            curAssistantPanelTab === 'mobile_panel'
                                ? { backgroundColor: 'var(--main-selected-bg-color)' }
                                : {}
                        }
                        onClick={(e) => handleAssistantTabSwitch('mobile_panel')}
                    >
                        手机协作
                    </AssistantTab>
                    <AssistantTab
                        style={
                            curAssistantPanelTab === 'trash_list'
                                ? { backgroundColor: 'var(--main-selected-bg-color)' }
                                : {}
                        }
                        onClick={(e) => handleAssistantTabSwitch('trash_list')}
                    >
                        废纸篓
                    </AssistantTab>
                </AssistantTabs>
                <AssistantContent>
                    {curAssistantPanelTab == 'mobile_panel' ? <></> : <></>}
                    {curAssistantPanelTab == 'model_panel' ? <></> : <></>}
                    {curAssistantPanelTab == 'trash_list' ? <TrashList /> : <></>}
                </AssistantContent>
            </AssistantBox>
        </AssistantPanelContainer>
    );
};

const AssistantPanelContainer = styled.div(
    {
        height: '100vh',
        position: 'relative',
        borderLeft: '1px solid var(--main-border-color)',
        zIndex: '3000',
        backgroundColor: 'var(--main-bg-color)',
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

const AssistantBox = styled.div({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '5px',
    boxSizing: 'border-box',
});

const FloatCloseBtnBox = styled.div({
    position: 'absolute',
    top: '19px',
    right: '20px',
});

const FloatCloseBtn = styled.div({
    fontSize: '22px',
    color: 'var(--main-icon-color)',
    transform: 'rotate(180deg)',
});

const AssistantTabs = styled.div({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '32px',
    margin: '13px 70px 13px 50px',
});

const AssistantTab = styled.div({
    height: '32px',
    lineHeight: '32px',
    margin: '6px 0',
    padding: '0 6px',
    textAlign: 'center',
    cursor: 'pointer',
});

const AssistantContent = styled.div({
    flex: '1',
    minHeight: '0',
});

export default AssistantPanel;
