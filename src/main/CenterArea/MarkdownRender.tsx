import { useContext, useMemo, useEffect, useCallback, useRef, useState } from 'react';
import styled from '@emotion/styled';
import cryptoRandomString from 'crypto-random-string';
import { GlobalContext } from '../../GlobalProvider';
import markdownIt from 'markdown-it';
import hljs from 'highlight.js';
/* eslint-disable */
//@ts-ignore
import markdownItEmoji from 'markdown-it-emoji';
//@ts-ignore
import markdownItFootnote from 'markdown-it-footnote';
//@ts-ignore
import markdownItLinkAttributes from 'markdown-it-link-attributes';
//@ts-ignore
import markdownItSub from 'markdown-it-sub';
//@ts-ignore
import markdownItSup from 'markdown-it-sup';
//@ts-ignore
import markdownItTaskLists from 'markdown-it-task-lists';
/* eslint-enable */
import markdownItAnchor from 'markdown-it-anchor';
import markdownItTable from 'markdown-it-multimd-table';
import markdownItTocDoneRight from 'markdown-it-toc-done-right';
import ClipboardJS from 'clipboard';
import { toPng } from 'html-to-image';

const { ipcRenderer } = window.require('electron');

export const MarkdownRender: React.FC<MarkdownRenderProps> = ({
    editorScrollRatio,
    renderPanelState,
    theme,
    cursorInRender,
    setCursorInRender,
    setRenderScrollRatio,
}) => {
    const {
        dataPath,
        currentRepoKey,
        currentFolderKey,
        currentNoteKey,
        repos_obj,
        notes,
        currentNoteStr,
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

                return (
                    '<pre><code class="hljs">' + md.current.utils.escapeHtml(str) + '</code></pre>'
                );
            },
        })
            .use(markdownItEmoji)
            .use(markdownItFootnote)
            .use(markdownItSub)
            .use(markdownItSup)
            .use(markdownItTaskLists)
            .use(markdownItLinkAttributes, {
                attrs: {
                    target: '_blank',
                },
            })
            .use(markdownItTable, {
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

    const print_md: any = useRef<markdownIt>(
        markdownIt({
            breaks: true,
            linkify: true,
            typographer: true,
            highlight: function (str, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return (
                            '<pre><code class="hljs" style="position: relative;">' +
                            hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                            '</code></pre>'
                        );
                    } catch (__) {}
                }

                return (
                    '<pre><code class="hljs">' + md.current.utils.escapeHtml(str) + '</code></pre>'
                );
            },
        })
            .use(markdownItEmoji)
            .use(markdownItFootnote)
            .use(markdownItSub)
            .use(markdownItSup)
            .use(markdownItTaskLists)
            .use(markdownItLinkAttributes, {
                attrs: {
                    target: '_blank',
                },
            })
            .use(markdownItTable, {
                multiline: false,
                rowspan: true,
                headerless: false,
                multibody: true,
                aotolabel: true,
            })
    );

    const [result, setResult] = useState('');

    const [showRenderScrollPos, setShowRenderScrollPos] = useState(false);

    const renderRef = useRef<HTMLDivElement>(null);
    const scrollSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const scrollRatioSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const autoScroll = useRef<boolean>(false);
    const TocRef = useRef<HTMLDivElement>(null);
    const renderContainerRef = useRef<HTMLDivElement>(null);

    const clipboard: any = useRef<ClipboardJS>(null);

    const themeClassNames = useMemo(() => {
        return typeof theme === 'string'
            ? `${theme}-theme-rd common-theme-rd`
            : 'grey-theme-rd common-theme-rd';
    }, [theme]);

    useEffect(() => {
        ipcRenderer.on('saveNoteToHtml', (event: any, path: string) => {
            const bodyContent = print_md.current.render(currentNoteStr);
            const hljsStyle =
                ipcRenderer.sendSync('readCss', {
                    file_name: '/hljs_theme/grey_standard.css',
                }) || '';
            const commonStyle =
                ipcRenderer.sendSync('readCss', {
                    file_name: '/theme/common.css',
                }) || '';
            const themeStyle =
                ipcRenderer.sendSync('readCss', {
                    file_name: `/theme/${theme}.css`,
                }) || '';
            const outerHtml = `<!DOCTYPE html><html>
            <head>
            <meta charset="UTF-8">
            <meta name = "viewport" content = "width = device-width, initial-scale = 1, maximum-scale = 1">
            <style>
            ${commonStyle}
            ${themeStyle}
            ${hljsStyle}
            </style>
            </head>
            <body>
            <div class='${theme}-theme-global ${theme}-theme-rd common-theme-rd'>
                ${bodyContent}
            </div>
            </body></html>`;
            ipcRenderer.sendSync('writeStr', {
                file_path: path,
                str: outerHtml,
            });
        });
        return () => {
            ipcRenderer.removeAllListeners('saveNoteToHtml');
        };
    }, [currentNoteStr, theme]);

    useEffect(() => {
        ipcRenderer.on('saveNoteToMd', (event: any, path: string) => {
            ipcRenderer.sendSync('writeStr', {
                file_path: path,
                str: currentNoteStr,
            });
        });
        return () => {
            ipcRenderer.removeAllListeners('saveNoteToPng');
        };
    }, [currentNoteStr, theme]);

    useEffect(() => {
        ipcRenderer.on('saveNoteToPng', (event: any, path: string) => {
            toPng(renderRef.current as HTMLElement, {
                height: renderRef.current?.scrollHeight,
            }).then((dataUrl) => {
                ipcRenderer.sendSync('writePngBlob', {
                    file_path: path,
                    url: dataUrl,
                });
            });
        });
        return () => {
            ipcRenderer.removeAllListeners('saveNoteToPng');
        };
    }, []);

    useEffect(() => {
        ipcRenderer.on('saveFolderToHtml', (event: any, path: string) => {
            const hljsStyle =
                ipcRenderer.sendSync('readCss', {
                    file_name: '/hljs_theme/grey_standard.css',
                }) || '';
            const commonStyle =
                ipcRenderer.sendSync('readCss', {
                    file_name: '/theme/common.css',
                }) || '';
            const themeStyle =
                ipcRenderer.sendSync('readCss', {
                    file_name: `/theme/${theme}.css`,
                }) || '';

            Object.keys(notes[currentRepoKey][currentFolderKey]).forEach((note_key: string) => {
                let title =
                    repos_obj[currentRepoKey]?.folders_obj &&
                    repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_obj
                        ? repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_obj[
                              note_key
                          ]?.title || ''
                        : '';
                if (title === '' || title === '新建文档') title = note_key;
                const content = notes[currentRepoKey][currentFolderKey][note_key];
                const bodyContent = print_md.current.render(content);
                const outerHtml = `<!DOCTYPE html><html>
                <head>
                <meta charset="UTF-8">
                <meta name = "viewport" content = "width = device-width, initial-scale = 1, maximum-scale = 1">
                <style>
                ${commonStyle}
                ${themeStyle}
                ${hljsStyle}
                </style>
                </head>
                <body>
                <div class='${theme}-theme-global ${theme}-theme-rd common-theme-rd'>
                    ${bodyContent}
                </div>
                </body></html>`;

                ipcRenderer.sendSync('writeStrToFile', {
                    folder_path: path,
                    file_name: title + '.html',
                    str: outerHtml,
                });
            });
        });
        return () => {
            ipcRenderer.removeAllListeners('saveFolderToHtml');
        };
    }, [repos_obj, notes, currentRepoKey, currentFolderKey, theme]);

    useEffect(() => {
        setResult(md.current.render(currentNoteStr));
        clipboard.current = new ClipboardJS('.copy-btn');
        clipboard.current.on('success', (e: any) => {
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
    }, [dataPath, currentRepoKey, currentFolderKey, currentNoteKey, currentNoteStr]);

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
        (e: any) => {
            if (cursorInRender) {
                if (scrollRatioSaveTimerRef.current) {
                    clearTimeout(scrollRatioSaveTimerRef.current);
                }

                scrollRatioSaveTimerRef.current = setTimeout(() => {
                    if (e.target) {
                        const offsetHeight = (e.target as HTMLDivElement).offsetHeight;
                        const scrollTop = (e.target as HTMLDivElement).scrollTop;
                        const scrollHeight = (e.target as HTMLDivElement).scrollHeight;
                        if ((scrollTop + offsetHeight) / scrollHeight > 0.99) {
                            setRenderScrollRatio(1.0);
                        } else {
                            setRenderScrollRatio(scrollTop / scrollHeight);
                        }
                    }
                }, 100);
            }

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
                    updateRenderTop(
                        currentRepoKey,
                        currentFolderKey,
                        currentNoteKey,
                        renderScrollValue
                    );
                }
            }, 100);
        },
        [renderRef, editorScrollRatio, setShowRenderScrollPos, updateRenderTop, cursorInRender]
    );

    const handleMouseEnter = useCallback(() => {
        setCursorInRender(true);
    }, [setCursorInRender]);

    const handleMouseLeave = useCallback(() => {
        setCursorInRender(false);
    }, [setCursorInRender]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        renderRef.current?.addEventListener('scroll', handleScroll, true);
        renderContainerRef.current?.addEventListener('mouseenter', handleMouseEnter);
        renderContainerRef.current?.addEventListener('mouseleave', handleMouseLeave);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            renderRef.current?.removeEventListener('scroll', handleScroll, true);
            renderContainerRef.current?.removeEventListener('mouseenter', handleMouseEnter);
            renderContainerRef.current?.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [handleKeyDown, handleScroll]);

    return (
        <MarkdownRenderContainer ref={renderContainerRef}>
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
            <TocDirectory ref={TocRef} className="toc-scroller"></TocDirectory>
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
        zIndex: 1000,
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
    right: '18px',
    width: '30%',
    maxHeight: '50%',
    borderRadius: '10px',
    paddingRight: '6px',
    backgroundColor: '#2F3338',
    overflowY: 'auto',
    zIndex: 1000,
});

type MarkdownRenderProps = {
    theme: string;
    editorScrollRatio: number;
    renderPanelState: string;
    cursorInRender: boolean;
    setCursorInRender: (cursorInRender: boolean) => void;
    setRenderScrollRatio: (editorScrollRatio: number) => void;
};
