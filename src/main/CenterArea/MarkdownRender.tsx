import { useContext, useEffect, useCallback, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { GlobalContext } from '../../GlobalProvider';
import markdownIt from 'markdown-it';
import highlightjs from 'markdown-it-highlightjs';

export const MarkdownRender: React.FC<MarkdownRenderProps> = ({
    content,
    editorScrollRatio,
    renderPanelState,
    theme,
}) => {
    const {
        dataPath,
        currentRepoKey,
        currentFolderKey,
        currentNoteKey,
        renderTop,
        updateRenderTop,
    } = useContext(GlobalContext);

    const md = useRef(markdownIt().use(highlightjs));
    const [result, setResult] = useState('');

    const [showRenderScrollPos, setShowRenderScrollPos] = useState(false);
    const [scrollLock, setScrollLock] = useState(false);

    const renderRef = useRef<HTMLDivElement>(null);
    const scrollSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const autoScroll = useRef<boolean>(false);

    useEffect(() => {
        setResult(md.current.render(content));
    }, [dataPath, currentRepoKey, currentFolderKey, currentNoteKey, content]);

    useEffect(() => {
        if (renderRef.current) {
            autoScroll.current = true;
            renderRef.current.scrollTop = 0;
            setShowRenderScrollPos(false);
            if (renderTop > renderRef.current.offsetHeight) setShowRenderScrollPos(true);
        }
    }, [dataPath, currentRepoKey, currentFolderKey, currentNoteKey]);

    useEffect(() => {
        if (renderRef && renderRef.current) {
            setTimeout(() => {
                if (renderRef && renderRef.current) {
                    const scrollHeight = renderRef.current.scrollHeight;
                    renderRef.current.scrollTop = Math.ceil(scrollHeight * editorScrollRatio);
                    setScrollLock(true);
                }
            }, 0);
        }
    }, [editorScrollRatio]);

    const autoScrollToLine = useCallback(() => {
        console.log('render autoScrollToLine');

        if (renderRef.current) {
            renderRef.current.scrollTop = renderTop;
        }

        setShowRenderScrollPos(false);
    }, [renderTop]);

    const handleKeyDown = useCallback(
        (e: any) => {
            if (process.platform === 'darwin') {
                if (e.keyCode === 74 && e.metaKey && !e.shiftKey && renderPanelState === 'all') {
                    autoScrollToLine();
                }
            }
            if (process.platform === 'win32' || process.platform === 'linux') {
                if (e.keyCode === 74 && e.crtlKey && !e.shiftKey && renderPanelState === 'all') {
                    autoScrollToLine();
                }
            }
        },
        [renderPanelState, autoScrollToLine]
    );

    const handleScroll = useCallback(
        (event: any) => {
            if (renderRef.current && renderRef.current.contains(event.target)) {
                if (
                    Math.ceil(renderRef.current.scrollHeight * editorScrollRatio) ===
                    renderRef.current.scrollTop
                ) {
                    setScrollLock(false);
                }

                if (!scrollLock) {
                    if (autoScroll.current) {
                        autoScroll.current = false;
                        return;
                    }
                    if (scrollSaveTimerRef.current) {
                        clearTimeout(scrollSaveTimerRef.current);
                    }
                    scrollSaveTimerRef.current = setTimeout(() => {
                        setShowRenderScrollPos(false);
                        if (renderRef.current) {
                            const renderScrollValue = renderRef.current.scrollTop;
                            console.log(renderScrollValue);
                            updateRenderTop(
                                currentRepoKey,
                                currentFolderKey,
                                currentNoteKey,
                                renderScrollValue
                            );
                        }
                    }, 100);
                }
            }
        },
        [renderRef, editorScrollRatio, scrollLock, setShowRenderScrollPos, updateRenderTop]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('scroll', handleScroll, true);
        };
    }, [handleKeyDown, handleScroll]);

    const wrappedClassNames = typeof theme === 'string' ? `rd-theme-${theme}` : 'rd-theme';

    const commonClassNames = 'rd-theme-common';

    return (
        <MarkdownRenderContainer>
            {showRenderScrollPos && renderPanelState === 'all' ? (
                <LastScrollPos onClick={autoScrollToLine}>上次在</LastScrollPos>
            ) : (
                <></>
            )}
            <div
                ref={renderRef}
                className={`${wrappedClassNames} ${commonClassNames}`}
                style={{
                    overflowX: 'hidden',
                    scrollBehavior: renderPanelState === 'all' ? 'auto' : 'smooth',
                }}
                dangerouslySetInnerHTML={{ __html: result }}
            ></div>
        </MarkdownRenderContainer>
    );
};

const MarkdownRenderContainer = styled.div({
    position: 'absolute',
    width: '100%',
    height: '100%',
});

const LastScrollPos = styled.div(
    {
        position: 'absolute',
        left: '15px',
        bottom: '100px',
        height: '30px',
        lineHeight: '30px',
        fontSize: '16px',
        padding: '0 12px 0 6px',
        zIndex: 9,
        color: '#939395',
        backgroundColor: '#3a404c',
        cursor: 'pointer',
    },
    `
    &:before {
        border: 15px dashed transparent;
        border-right: 15px solid #3a404c;
        content: "";
        font-size: 0;
        height: 0;
        left: -15px;
        transform: translateX(-50%);
        overflow: hidden;
        position: absolute;
        top: 0;
        width: 0;
    }
`
);

type MarkdownRenderProps = {
    content: string;
    theme: string;
    editorScrollRatio: number;
    renderPanelState: string;
};
