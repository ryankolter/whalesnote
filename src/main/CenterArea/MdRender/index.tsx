import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import cryptoRandomString from 'crypto-random-string';
import ClipboardJS from 'clipboard';
import markdownIt from 'markdown-it';
// import hljs from 'highlight.js/lib/common';
import { common, createLowlight } from 'lowlight';
import { toHtml } from 'hast-util-to-html';
/* eslint-disable */
//@ts-ignore
import { full as emoji } from 'markdown-it-emoji';
//@ts-ignore
import markdownItFootnote from 'markdown-it-footnote';
//@ts-ignore
import markdownItReplaceLink from 'markdown-it-replace-link';
//@ts-ignore
import markdownItLinkAttributes from 'markdown-it-link-attributes';
//@ts-ignore
import markdownItSub from 'markdown-it-sub';
//@ts-ignore
import markdownItSup from 'markdown-it-sup';
//@ts-ignore
import markdownItTaskLists from 'markdown-it-task-lists';
//@ts-ignore
import implicitFigures from 'markdown-it-image-figures';
/* eslint-enable */
import markdownItAnchor from 'markdown-it-anchor';
import markdownItTable from 'markdown-it-multimd-table';
import markdownItTocDoneRight from 'markdown-it-toc-done-right';

import { useContextMenu } from '@/lib';
import { useAtomValue } from 'jotai';
import {
    platformAtom,
    renderCodeFontSizeAtom,
    renderFontSizeAtom,
    repoPanelVisibleAtom,
} from '@/atoms';
import { useDataContext } from '@/context/DataProvider';

const lowlight = createLowlight(common);

const MdRender: React.FC<{
    cursorInRenderFlag: boolean;
    editorScrollRatio: number;
    mdRenderState: string;
    renderNoteStr: string;
    renderScrollTop: number;
    setCursorInRenderFlag: React.Dispatch<React.SetStateAction<boolean>>;
    setRenderScrollRatio: React.Dispatch<React.SetStateAction<number>>;
    updateRenderScrollTop: (
        repo_key: string,
        folder_key: string,
        note_key: string,
        render_scroll_value: number,
    ) => void;
}> = ({
    cursorInRenderFlag,
    editorScrollRatio,
    mdRenderState,
    renderNoteStr,
    renderScrollTop,
    setCursorInRenderFlag,
    setRenderScrollRatio,
    updateRenderScrollTop,
}) => {
    const { curDataPath, curRepoKey, curFolderKey, curNoteKey } = useDataContext();

    const { t } = useTranslation();

    const platform = useAtomValue(platformAtom);
    const renderFontSize = useAtomValue(renderFontSizeAtom);
    const renderCodeFontSize = useAtomValue(renderCodeFontSizeAtom);
    const repoPanelVisible = useAtomValue(repoPanelVisibleAtom);

    const [result, setResult] = useState('');
    const [showRenderScrollPos, setShowRenderScrollPos] = useState(false);
    const [tocVisible, setTocVisible] = useState(false);

    const md = useRef<markdownIt>(markdownIt());
    const scrollSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const scrollRatioSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const TocRef = useRef<HTMLDivElement>(null);
    const autoScroll = useRef<boolean>(false);
    const clipboard: any = useRef<ClipboardJS>(null);
    const renderContainerRef = useRef<HTMLDivElement>(null);
    const renderRef = useRef<HTMLDivElement>(null);
    const { xPos, yPos, menuVisible } = useContextMenu(renderRef);

    md.current = useMemo(() => {
        return (
            markdownIt({
                html: true,
                breaks: true,
                linkify: true,
                typographer: true,
                highlight: function (str, lang) {
                    const copyId = cryptoRandomString({
                        length: 12,
                        type: 'alphanumeric',
                    });
                    const html = `<button class="copy-btn" type="button" data-clipboard-action="copy" data-clipboard-target="#copy-${copyId}">${t(
                        'render.copy',
                    )}</button>`;
                    const textarea = `<textarea style="position: absolute;top: -9999px;left: -9999px;z-index: -9999;" id="copy-${copyId}">${str}</textarea>`;

                    if (lang) {
                        try {
                            return (
                                `<pre style="position: relative;"><code class="hljs"><pre style='font-size: ${renderCodeFontSize}px'>` +
                                html +
                                toHtml(lowlight.highlight(lang, str, {})) +
                                '</pre></code></pre>' +
                                textarea
                            );
                        } catch (__) {}
                    }

                    return (
                        `<pre style="position: relative;"><code class="hljs"><pre style='font-size: ${renderCodeFontSize}px'>` +
                        html +
                        md.current.utils.escapeHtml(str) +
                        '</pre></code></pre>' +
                        textarea
                    );
                },
            })
                .use(emoji)
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
                    //@ts-ignore
                    callback: (html, ast) => {
                        if (TocRef.current) {
                            TocRef.current.innerHTML = html;
                        }
                    },
                })
                //@ts-ignore
                .use(markdownItReplaceLink, {
                    replaceLink: function (link: string, env: string, token: any) {
                        if (
                            token.type === 'image' &&
                            link.indexOf('https://') === -1 &&
                            link.indexOf('http://') === -1
                        )
                            return curDataPath + '/images/' + link;
                        else return link;
                    },
                })
                .use(implicitFigures, {
                    figcaption: 'title',
                })
        );
    }, [curDataPath, renderCodeFontSize]);

    useEffect(() => {
        setResult(md.current.render(renderNoteStr));
        clipboard.current = new ClipboardJS('.copy-btn');
        clipboard.current.on('success', (e: any) => {
            e.trigger.innerHTML = t('render.success');
            setTimeout(() => {
                e.trigger.innerHTML = t('render.copy');
            }, 2000);
        });

        clipboard.current.on('error', (e: any) => {
            console.log(e);
        });
        return () => {
            clipboard.current.off('success');
            clipboard.current.off('error');
        };
    }, [curDataPath, curRepoKey, curFolderKey, curNoteKey, renderNoteStr, renderCodeFontSize]);

    useEffect(() => {
        if (renderRef.current) {
            autoScroll.current = true;
            renderRef.current.scrollTop = 0;
            setShowRenderScrollPos(false);
            if (renderScrollTop > renderRef.current.offsetHeight) setShowRenderScrollPos(true);
        }
    }, [curDataPath, curRepoKey, curFolderKey, curNoteKey]);

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
        async (e: KeyboardEvent) => {
            if (platform === 'darwin' || platform === 'win32' || platform === 'linux') {
                const modKey = platform === 'darwin' ? e.metaKey : e.ctrlKey;

                if (e.key === 'J' && modKey && !e.shiftKey) {
                    if (mdRenderState === 'all' && !repoPanelVisible) autoScrollToLine();
                }

                if (e.key === '.' && modKey && e.shiftKey) {
                    setTocVisible((state) => !state);
                }
            }
        },
        [platform, mdRenderState, repoPanelVisible, autoScrollToLine, setTocVisible],
    );

    const handleScroll = useCallback(
        (e: Event) => {
            if (cursorInRenderFlag) {
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
                    updateRenderScrollTop(curRepoKey, curFolderKey, curNoteKey, renderScrollValue);
                }
            }, 100);
        },
        [
            renderRef,
            editorScrollRatio,
            setShowRenderScrollPos,
            updateRenderScrollTop,
            cursorInRenderFlag,
        ],
    );

    const handleMouseEnter = useCallback(() => {
        setCursorInRenderFlag(true);
    }, [setCursorInRenderFlag]);

    const handleMouseLeave = useCallback(() => {
        setCursorInRenderFlag(false);
    }, [setCursorInRenderFlag]);

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
                <LastScrollPos onClick={autoScrollToLine}>{t('render.last_time')}</LastScrollPos>
            ) : (
                <></>
            )}
            <div
                ref={renderRef}
                className="wn-theme-rd"
                style={{
                    overflowX: 'hidden',
                    scrollBehavior: mdRenderState === 'all' ? 'auto' : 'smooth',
                }}
                dangerouslySetInnerHTML={{ __html: result }}
            ></div>
            <TocToggleBtn onClick={() => setTocVisible((state) => !state)}>
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
                tocHeight={tocVisible ? '40%' : '0'}
            ></TocDirectory>
            {menuVisible ? (
                <MenuUl top={yPos} left={xPos}>
                    <MenuLi className="menu-li-color" onClick={() => copySelection()}>
                        {t('render.copy')}
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
        height: 'calc(100% - 2px)',
    },
    (props: { fontSizeValue: string }) => ({
        fontSize: props.fontSizeValue + 'px',
    }),
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
        backgroundColor: 'var(--main-btn-bg-color)',
    },
    `
    &:before {
        border: 15px dashed transparent;
        border-right: 15px solid var(--main-btn-bg-color);
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
`,
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
    zIndex: 3000,
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
`,
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
    }),
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
`,
);

export default MdRender;
