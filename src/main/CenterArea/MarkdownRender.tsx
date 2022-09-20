import { useContext, useEffect, useCallback, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { GlobalContext } from '../../GlobalProvider';
import markdownIt from 'markdown-it';
import highlightjs from 'markdown-it-highlightjs';
import hljs from 'highlight.js';

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

    const md: any = useRef<markdownIt>(
        markdownIt({
            breaks: true,
            linkify: true,
            highlight: function (str, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return (
                            '<pre><code class="hljs">' +
                            hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                            '</code></pre>'
                        );
                    } catch (__) {}
                }

                return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>';
            },
        })
    );
    const [result, setResult] = useState('');

    const [showRenderScrollPos, setShowRenderScrollPos] = useState(false);

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
            console.log(renderTop);
            console.log(renderRef.current.offsetHeight);
            if (renderTop > renderRef.current.offsetHeight) setShowRenderScrollPos(true);
        }
    }, [dataPath, currentRepoKey, currentFolderKey, currentNoteKey]);

    useEffect(() => {
        if (renderRef && renderRef.current) {
            setTimeout(() => {
                if (renderRef && renderRef.current) {
                    const scrollHeight = renderRef.current.scrollHeight;
                    renderRef.current.scrollTop = Math.ceil(scrollHeight * editorScrollRatio);
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
        },
        [renderRef, editorScrollRatio, setShowRenderScrollPos, updateRenderTop]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('scroll', handleScroll, true);
        };
    }, [handleKeyDown, handleScroll]);

    const themeClassNames =
        typeof theme === 'string'
            ? `${theme}-theme-rd common-theme-rd`
            : 'grey-theme-rd common-theme-rd';

    return (
        <MarkdownRenderContainer>
            {showRenderScrollPos && renderPanelState === 'all' ? (
                <LastScrollPos className="btn-1-bg-color" onClick={autoScrollToLine}>
                    上次在
                </LastScrollPos>
            ) : (
                <></>
            )}
            <div
                ref={renderRef}
                className={themeClassNames}
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
        zIndex: 99,
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
