import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';

import MobilePage from './MobilePage';
import TrashList from './TrashList';
import { useAtom, useSetAtom } from 'jotai';
import { assistPanelOpenAtom, assistPanelTabAtom } from '@/atoms';
import { PanelRightCloseIcon } from 'lucide-react';

const AssistantPanel: React.FC<{}> = ({}) => {
    const [assistPanelTab, setAssistPanelTab] = useAtom(assistPanelTabAtom);
    const setAssistPanelOpen = useSetAtom(assistPanelOpenAtom);
    const { t } = useTranslation();

    const resizeAssistantPanelOffsetX = useRef<number>(0);
    const lastPageX = useRef<number>(0);
    const [assistantPanelWidth, setAssistantPanelWidth] = useState(
        Number(window.localStorage.getItem('assistant_panel_width')) || 360,
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
                        assistantPanelWidth.toString(),
                    );
                }}
                draggable="true"
            />
            <AssistantBox>
                <FloatCloseBtnBox>
                    <PanelRightCloseIcon
                        width="20"
                        height="20"
                        style={{ color: 'var(--main-icon-color)' }}
                        className="cursor-pointer"
                        onClick={() => setAssistPanelOpen(false)}
                    />
                </FloatCloseBtnBox>
                <AssistantTabs>
                    <AssistantTab
                        style={
                            assistPanelTab === 'mobile'
                                ? { backgroundColor: 'var(--main-selected-bg-color)' }
                                : {}
                        }
                        onClick={(e) => setAssistPanelTab('mobile')}
                    >
                        {t('assistant.mobile.title')}
                    </AssistantTab>
                    <AssistantTab
                        style={
                            assistPanelTab === 'trash'
                                ? { backgroundColor: 'var(--main-selected-bg-color)' }
                                : {}
                        }
                        onClick={(e) => setAssistPanelTab('trash')}
                    >
                        {t('assistant.trash.title')}
                    </AssistantTab>
                </AssistantTabs>
                <AssistantContent>
                    {assistPanelTab == 'mobile' ? (
                        <MobilePage />
                    ) : assistPanelTab === 'trash' ? (
                        <TrashList />
                    ) : assistPanelTab === 'model' ? (
                        <></>
                    ) : (
                        <></>
                    )}
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
    }),
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
    }),
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
    top: '20px',
    right: '20px',
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
