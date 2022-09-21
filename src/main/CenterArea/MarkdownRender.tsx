import { useContext, useEffect, useCallback, useRef, useState } from 'react';
import styled from '@emotion/styled';
import cryptoRandomString from 'crypto-random-string';
import { GlobalContext } from '../../GlobalProvider';
import markdownIt from 'markdown-it';
import hljs from 'highlight.js';
/* eslint-disable */
//@ts-ignore
import markdownItLinkAttributes from 'markdown-it-link-attributes';
/* eslint-enable */
import mardownItTable from 'markdown-it-multimd-table';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItTocDoneRight from 'markdown-it-toc-done-right';
import ClipboardJS from 'clipboard';

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
            typographer: true,
            highlight: function (str, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        const copyId = cryptoRandomString({
                            length: 12,
                            type: 'alphanumeric',
                        });
                        const html = `<button class="copy-btn copy-btn-color" type="button" data-clipboard-action="copy" data-clipboard-target="#copy-${copyId}">复制</button>`;
                        const textarea: any = `<textarea style="position: absolute;top: -9999px;left: -9999px;z-index: -9999;" id="copy-${copyId}">${str}</textarea>`;
                        return (
                            '<pre><code class="hljs" style="position: relative;">' +
                            html +
                            hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                            '</code></pre>' +
                            textarea
                        );
                    } catch (__) {}
                }

                return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>';
            },
        })
            .use(markdownItLinkAttributes, {
                attrs: {
                    target: '_blank',
                },
            })
            .use(mardownItTable, {
                multiline: false,
                rowspan: true,
                headerless: false,
                multibody: true,
                aotolabel: true,
            })
            .use(markdownItAnchor, {})
            .use(markdownItTocDoneRight, {
                containerClass: 'render-toc',
                containerId: 'renderTocId',
                listType: 'ul',
                callback: (html, ast) => {
                    if (TocRef.current) {
                        TocRef.current.innerHTML = html;
                    }
                },
            })
    );

    const [result, setResult] = useState('');

    const [showRenderScrollPos, setShowRenderScrollPos] = useState(false);

    const renderRef = useRef<HTMLDivElement>(null);
    const scrollSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const autoScroll = useRef<boolean>(false);
    const TocRef = useRef<HTMLDivElement>(null);

    const clipboard: any = useRef<ClipboardJS>(null);

    useEffect(() => {
        setResult(md.current.render(content));
        clipboard.current = new ClipboardJS('.copy-btn');
        console.log(clipboard.current);
        clipboard.current.on('success', (e: any) => {
            console.log(e);
            e.trigger.innerHTML = '成功';
            setTimeout(() => {
                e.trigger.innerHTML = '复制';
            }, 2000);
        });

        clipboard.current.on('error', (e: any) => {
            console.log(e);
        });
        return () => {
            clipboard.current.off('success');

            clipboard.current.off('error');
        };
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
            <TocDirectory ref={TocRef}></TocDirectory>
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

const TocDirectory = styled.div({
    position: 'absolute',
    top: '0',
    right: '8px',
    width: '25%',
    borderRight: '3px solid #3A404C',
    borderTopLeftRadius: '10px',
    borderBottomLeftRadius: '10px',
    backgroundColor: '#2F3338',
    zIndex: 999999,
});

type MarkdownRenderProps = {
    content: string;
    theme: string;
    editorScrollRatio: number;
    renderPanelState: string;
};
