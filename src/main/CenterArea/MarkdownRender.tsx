import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';
import cryptoRandomString from 'crypto-random-string';
import ClipboardJS from 'clipboard';
import { toPng } from 'html-to-image';

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
//@ts-ignore
import markwodnItReplaceLink from 'markdown-it-replace-link';
//@ts-ignore
import implicitFigures from 'markdown-it-image-figures';
/* eslint-enable */
import markdownItAnchor from 'markdown-it-anchor';
import markdownItTable from 'markdown-it-multimd-table';
import markdownItTocDoneRight from 'markdown-it-toc-done-right';

import useContextMenu from '../../lib/useContextMenu';
import { notes } from '../../lib/notes';

export const MarkdownRender: React.FC<{
    editorScrollRatio: number;
    mdRenderState: string;
    cursorInRender: boolean;
    renderNoteStr: string;
    setCursorInRender: React.Dispatch<React.SetStateAction<boolean>>;
    setRenderScrollRatio: React.Dispatch<React.SetStateAction<number>>;
    renderScrollTop: number;
    updateRenderScrollTop: (
        repo_key: string,
        folder_key: string,
        note_key: string,
        render_scroll_value: number
    ) => void;
}> = ({
    editorScrollRatio,
    mdRenderState,
    cursorInRender,
    renderNoteStr,
    setCursorInRender,
    setRenderScrollRatio,
    renderScrollTop,
    updateRenderScrollTop,
}) => {
    const {
        curDataPath,
        currentRepoKey,
        currentFolderKey,
        currentNoteKey,
        whalenote,
        theme,
        renderFontSize,
        platformName,
    } = useContext(GlobalContext);

    const [result, setResult] = useState('');
    const [showRenderScrollPos, setShowRenderScrollPos] = useState(false);
    const [showTocFlag, setShowTocFlag] = useState(
        Number(window.localStorage.getItem('show_toc_flag')) || 0
    );

    const md = useRef<markdownIt>(markdownIt());
    const mdPrint = useRef<markdownIt>(markdownIt());
    const renderRef = useRef<HTMLDivElement>(null);
    const scrollSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const scrollRatioSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const TocRef = useRef<HTMLDivElement>(null);
    const renderContainerRef = useRef<HTMLDivElement>(null);
    const autoScroll = useRef<boolean>(false);
    const clipboard: any = useRef<ClipboardJS>(null);

    const { xPos, yPos, menu } = useContextMenu(renderRef);

    useEffect(() => {
        window.localStorage.setItem('show_toc_flag', String(showTocFlag));
    }, [showTocFlag]);

    md.current = useMemo(() => {
        return markdownIt({
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
                        const html = `<button class="copy-btn" type="button" data-clipboard-action="copy" data-clipboard-target="#copy-${copyId}">复制</button>`;
                        const textarea = `<textarea style="position: absolute;top: -9999px;left: -9999px;z-index: -9999;" id="copy-${copyId}">${str}</textarea>`;
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
            .use(markwodnItReplaceLink, {
                replaceLink: function (link: string, env: string, token: any) {
                    if (token.type === 'image') return curDataPath + '/images/' + link;
                    else return link;
                },
            })
            .use(implicitFigures, {
                figcaption: 'title',
            });
    }, [curDataPath]);

    mdPrint.current = useMemo(() => {
        return markdownIt({
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
                    '<pre><code class="hljs">' +
                    mdPrint.current.utils.escapeHtml(str) +
                    '</code></pre>'
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
            .use(markwodnItReplaceLink, {
                replaceLink: function (link: string, env: string) {
                    return curDataPath + '/images/' + link;
                },
            });
    }, [curDataPath]);

    // useEffect(() => {
    //     ipcRenderer.on('saveNoteToHtml', async (event: any, path: string) => {
    //         const bodyContent = mdPrint.current.render(renderNoteStr);
    //         const colorStyle =
    //         await window.electronAPI.readCssSync({
    //                 file_name: '/theme/color_variable.css',
    //             }) || '';
    //         const globalStyle =
    //             await window.electronAPI.readCssSync({
    //                 file_name: '/theme/global.css',
    //             }) || '';
    //         const hljsStyle =
    //             await window.electronAPI.readCssSync({
    //                 file_name: `/hljs_theme/${theme}_standard.css`,
    //             }) || '';
    //         const renderStyle =
    //             await window.electronAPI.readCssSync({
    //                 file_name: '/theme/render.css',
    //             }) || '';
    //         const outerHtml = `<!DOCTYPE html><html>
    //         <head>
    //         <meta charset="UTF-8">
    //         <meta name = "viewport" content = "width = device-width, initial-scale = 1.5, maximum-scale = 1">
    //         <style>
    //         ${colorStyle}
    //         ${globalStyle}
    //         ${hljsStyle}
    //         ${renderStyle}
    //         </style>
    //         </head>
    //         <body>
    //         <div class='${theme}-theme-global wn-theme-rd'>
    //             ${bodyContent}
    //         </div>
    //         </body></html>`;
    //         await window.electronAPI.writeStr({
    //             file_path: path,
    //             str: outerHtml,
    //         });
    //     });
    //     return () => {
    //         ipcRenderer.removeAllListeners('saveNoteToHtml');
    //     };
    // }, [renderNoteStr, theme]);

    // useEffect(() => {
    //     ipcRenderer.on('saveNoteToMd', async (event: any, path: string) => {
    //         await window.electronAPI.writeStr({
    //             file_path: path,
    //             str: renderNoteStr,
    //         });
    //     });
    //     return () => {
    //         ipcRenderer.removeAllListeners('saveNoteToPng');
    //     };
    // }, [renderNoteStr, theme]);

    // useEffect(() => {
    //     ipcRenderer.on('saveNoteToPng', (event: any, path: string) => {
    //         toPng(renderRef.current as HTMLElement, {
    //             height: renderRef.current?.scrollHeight,
    //         }).then(async (dataUrl) => {
    //             await window.electronAPI.writePngBlob({
    //                 file_path: path,
    //                 url: dataUrl,
    //             });
    //         });
    //     });
    //     return () => {
    //         ipcRenderer.removeAllListeners('saveNoteToPng');
    //     };
    // }, []);

    // useEffect(() => {
    //     ipcRenderer.on('saveFolderToHtml', async (event: any, path: string) => {
    //         const colorStyle =
    //             await window.electronAPI.readCssSync({
    //                 file_name: '/theme/color_variable.css',
    //             }) || '';
    //         const globalStyle =
    //             await window.electronAPI.readCssSync({
    //                 file_name: '/theme/global.css',
    //             }) || '';
    //         const hljsStyle =
    //             await window.electronAPI.readCssSync({
    //                 file_name: `/hljs_theme/${theme}_standard.css`,
    //             }) || '';
    //         const renderStyle =
    //             await window.electronAPI.readCssSync({
    //                 file_name: '/theme/render.css',
    //             }) || '';
    //         for (const note_key of Object.keys(notes[currentRepoKey][currentFolderKey])) {
    //             let title =
    //                 whalenote.repos_obj[currentRepoKey]?.folders_obj &&
    //                 whalenote.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_obj
    //                     ? whalenote.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_obj[
    //                           note_key
    //                       ]?.title || ''
    //                     : '';
    //             if (title === '' || title === '新建文档') title = note_key;
    //             const content = notes[currentRepoKey][currentFolderKey][note_key];
    //             const bodyContent = mdPrint.current.render(content);
    //             const outerHtml = `<!DOCTYPE html><html>
    //             <head>
    //             <meta charset="UTF-8">
    //             <meta name = "viewport" content = "width = device-width, initial-scale = 1, maximum-scale = 1">
    //             <style>
    //             ${colorStyle}
    //             ${globalStyle}
    //             ${hljsStyle}
    //             ${renderStyle}
    //             </style>
    //             </head>
    //             <body>
    //             <div class='${theme}-theme-global wn-theme-rd'>
    //                 ${bodyContent}
    //             </div>
    //             </body></html>`;

    //             await window.electronAPI.writeStrToFile({
    //                 folder_path: path,
    //                 file_name: title + '.html',
    //                 str: outerHtml,
    //             });
    //         }
    //     });
    //     return () => {
    //         ipcRenderer.removeAllListeners('saveFolderToHtml');
    //     };
    // }, [whalenote, notes, currentRepoKey, currentFolderKey, theme]);

    useEffect(() => {
        setResult(md.current.render(renderNoteStr));
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
    }, [curDataPath, currentRepoKey, currentFolderKey, currentNoteKey, renderNoteStr]);

    useEffect(() => {
        if (renderRef.current) {
            autoScroll.current = true;
            renderRef.current.scrollTop = 0;
            setShowRenderScrollPos(false);
            if (renderScrollTop > renderRef.current.offsetHeight) setShowRenderScrollPos(true);
        }
    }, [curDataPath, currentRepoKey, currentFolderKey, currentNoteKey]);

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
        if (renderRef.current) {
            renderRef.current.scrollTop = renderScrollTop;
        }
        setShowRenderScrollPos(false);
    }, [renderScrollTop]);

    const copySelection = useCallback(() => {
        const sel = window.getSelection();
        if (sel && sel.type === 'Range') {
            navigator.clipboard.writeText(sel.toString());
        }
    }, []);

    const handleKeyDown = useCallback(
        async (e: any) => {
            if (platformName === 'darwin' || platformName === 'win32' || platformName === 'linux') {
                const modKey = platformName === 'darwin' ? e.metaKey : e.ctrlKey;

                if (e.keyCode === 74 && modKey && !e.shiftKey && mdRenderState === 'all') {
                    autoScrollToLine();
                }
                if (e.key === '.' && modKey && !e.shiftKey) {
                    setShowTocFlag((showTocFlag) => 1 - showTocFlag);
                }
            }
        },
        [platformName, mdRenderState, autoScrollToLine, setShowTocFlag]
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
                    updateRenderScrollTop(
                        currentRepoKey,
                        currentFolderKey,
                        currentNoteKey,
                        renderScrollValue
                    );
                }
            }, 100);
        },
        [
            renderRef,
            editorScrollRatio,
            setShowRenderScrollPos,
            updateRenderScrollTop,
            cursorInRender,
        ]
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
        <MarkdownRenderContainer ref={renderContainerRef} fontSizeValue={renderFontSize}>
            {showRenderScrollPos && mdRenderState === 'all' ? (
                <LastScrollPos onClick={autoScrollToLine}>上次在</LastScrollPos>
            ) : (
                <></>
            )}
            <div
                ref={renderRef}
                className={'wn-theme-rd'}
                style={{
                    overflowX: 'hidden',
                    scrollBehavior: mdRenderState === 'all' ? 'auto' : 'smooth',
                }}
                dangerouslySetInnerHTML={{ __html: result }}
            ></div>
            <TocToggleBtn onClick={() => setShowTocFlag((showTocFlag) => 1 - showTocFlag)}>
                <svg width="9.5px" height="11.5px">
                    <path
                        fillRule="evenodd"
                        stroke="var(--main-text-title-color)"
                        strokeWidth="1px"
                        strokeLinecap="round"
                        strokeLinejoin="miter"
                        fill="none"
                        d="M7.716,1.232 C7.960,1.458 7.941,1.808 7.673,2.13 L4.764,4.246 C4.497,4.452 4.82,4.436 3.838,4.210 L1.188,1.759 C0.944,1.534 0.963,1.184 1.231,0.978 "
                    />
                    <path
                        fillRule="evenodd"
                        stroke="var(--main-text-title-color)"
                        strokeWidth="1px"
                        strokeLinecap="round"
                        strokeLinejoin="miter"
                        fill="none"
                        d="M7.716,6.422 C7.960,6.648 7.941,6.997 7.673,7.203 L4.764,9.436 C4.497,9.642 4.82,9.626 3.838,9.400 L1.188,6.949 C0.944,6.723 0.963,6.374 1.231,6.168 "
                    />
                </svg>
            </TocToggleBtn>
            <TocDirectory
                ref={TocRef}
                className="toc-scroller"
                tocHeight={showTocFlag ? '40%' : '0'}
            ></TocDirectory>
            {menu ? (
                <MenuUl top={yPos} left={xPos}>
                    <MenuLi className="menu-li-color" onClick={() => copySelection()}>
                        复制
                    </MenuLi>
                </MenuUl>
            ) : (
                <></>
            )}
        </MarkdownRenderContainer>
    );
};

const MarkdownRenderContainer = styled.div(
    {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    (props: { fontSizeValue: number }) => ({
        fontSize: props.fontSizeValue + 'px',
    })
);

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
        backgroundColor: 'var(--editor-lastpos-bg-color)',
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

const TocToggleBtn = styled.div({
    position: 'absolute',
    top: '0',
    right: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
    height: '14px',
    paddingRight: '6px',
    zIndex: 10000,
    borderBottom: '1px solid var(--main-border-color)',
    backgroundColor: 'var(--main-tips-bg-color)',
});

const TocDirectory = styled.div(
    {
        position: 'absolute',
        top: '15px',
        right: '8px',
        width: '30%',
        borderBottomLeftRadius: '10px',
        borderBottomRightRadius: '10px',
        paddingRight: '6px',
        overflowY: 'auto',
        zIndex: 1000,
        backgroundColor: 'var(--main-tips-bg-color)',
        transition: 'height .3s 0s ease',
    },
    (props: { tocHeight: string }) => ({
        height: props.tocHeight,
    }),
    `
    &::-webkit-scrollbar {
        display: none;
    }
`
);

const MenuUl = styled.ul(
    {
        listStyleType: 'none',
        position: 'fixed',
        padding: '4px',
        borderRadius: '5px',
        zIndex: '4000',
        border: '1px solid var(--menu-border-color)',
        color: 'var(--menu-text-color)',
        backgroundColor: 'var(--menu-bg-color)',
    },
    (props: { top: string; left: string }) => ({
        top: props.top,
        left: props.left,
    })
);

const MenuLi = styled.li(
    {
        padding: '0 10px',
        fontSize: '13px',
        fontWeight: '500',
        lineHeight: '22px',
        letterSpacing: '1px',
        cursor: 'pointer',
    },
    `
    &:hover {
        border-radius: 4px;
        background-color: var(--menu-hover-color);
    }
`
);
