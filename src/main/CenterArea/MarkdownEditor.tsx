import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';

import { EditorView, ViewUpdate } from '@codemirror/view';

import useCodeMirror from '../../lib/useCodeMirror';
import useContextMenu from '../../lib/useContextMenu';
import useEditorPosition from '../../lib/useEditorPosition';

export const MarkdownEditor: React.FC<{
    theme: string;
    cursorInRender: boolean;
    renderPanelState: string;
    renderScrollRatio: number;
    setEditorScrollRatio: React.Dispatch<React.SetStateAction<number>>;
}> = ({ theme, cursorInRender, renderPanelState, renderScrollRatio, setEditorScrollRatio }) => {
    const {
        curDataPath,
        currentRepoKey,
        currentFolderKey,
        currentNoteKey,
        renameNote,
        updateNote,
        currentContent,
        focus,
        blur,
        setKeySelect,
        editorFontSize,
        platformName,
    } = useContext(GlobalContext);

    const [topLinePos, cursorHeadPos, updateTopLinePos, updateCursorHeadPos] = useEditorPosition(
        curDataPath,
        currentRepoKey,
        currentFolderKey,
        currentNoteKey
    );

    const [showEditorScrollPos, setShowEditorScrollPos] = useState(false);
    const [cursorInEditor, setCursorInEditor] = useState(false);

    const autoScroll = useRef<boolean>(false);
    const scrollSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const scrollRatioSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);

    const { xPos, yPos, menu } = useContextMenu(editorContainerRef);

    const onDocChange = useCallback(
        async (new_value: string, viewUpdate: ViewUpdate) => {
            updateNote(curDataPath, currentRepoKey, currentFolderKey, currentNoteKey, new_value);
            const doc = view.current?.state.doc;
            if (doc) {
                const first_line_content = doc.lineAt(0).text.replace(/^[#\-\_*>\s]+/g, '');
                const new_name: string = first_line_content || '新建文档';
                await renameNote(
                    curDataPath,
                    currentRepoKey,
                    currentFolderKey,
                    currentNoteKey,
                    new_name
                );
            }
        },
        [curDataPath, currentRepoKey, currentFolderKey, currentNoteKey, renameNote, updateNote]
    );

    const onSelectionSet = useCallback(
        (vu: ViewUpdate) => {
            if (view.current) {
                setKeySelect(false);
                const cursorHeadPos = view.current.state.selection.main.head;
                updateCursorHeadPos(
                    currentRepoKey,
                    currentFolderKey,
                    currentNoteKey,
                    cursorHeadPos
                );
            }
        },
        [curDataPath, currentRepoKey, currentFolderKey, currentNoteKey]
    );

    const [editor, view] = useCodeMirror<HTMLDivElement>({
        value: currentContent,
        onDocChange,
        onSelectionSet,
    });

    useEffect(() => {
        if (focus === '') return;
        view.current?.focus();
    }, [focus]);

    useEffect(() => {
        if (blur === '') return;
        view.current?.contentDOM.blur();
    }, [blur]);

    useEffect(() => {
        autoScroll.current = true;
        topLinePos && topLinePos > 10
            ? setShowEditorScrollPos(true)
            : setShowEditorScrollPos(false);
    }, [curDataPath, currentRepoKey, currentFolderKey, currentNoteKey]);

    useEffect(() => {
        if (view.current) {
            const offsetHeight = view.current.contentDOM.getBoundingClientRect().height;
            const scrollTop = offsetHeight * renderScrollRatio;
            const scrollPos = view.current.lineBlockAtHeight(scrollTop).from;

            view.current?.dispatch({
                effects: EditorView.scrollIntoView(scrollPos, {
                    y: 'start',
                }),
            });
        }
    }, [renderScrollRatio]);

    const autoScrollToLine = useCallback(() => {
        if (view.current) {
            const max_height = view.current.contentDOM.getBoundingClientRect().height;
            const start_line = topLinePos <= max_height && topLinePos > 0 ? topLinePos : max_height;

            view.current?.dispatch({
                effects: EditorView.scrollIntoView(start_line, {
                    y: 'start',
                }),
            });

            if (cursorHeadPos !== -1) {
                view.current?.focus();
                view.current?.dispatch({
                    selection: { anchor: cursorHeadPos },
                });
            }
        }

        setShowEditorScrollPos(false);
    }, [cursorHeadPos, topLinePos]);

    const copySelection = useCallback(() => {
        if (view.current) {
            const from = view.current.state.selection.main.from;
            const to = view.current.state.selection.main.to;
            if (from < to) {
                const slice_doc = view.current.state.sliceDoc(from, to);
                navigator.clipboard.writeText(slice_doc);
            }
        }
    }, []);

    const cutSelection = useCallback(() => {
        if (view.current) {
            const from = view.current.state.selection.main.from;
            const to = view.current.state.selection.main.to;
            if (from < to) {
                const slice_doc = view.current.state.sliceDoc(from, to);
                navigator.clipboard.writeText(slice_doc);
                view.current.dispatch({
                    changes: {
                        from: from,
                        to: to,
                        insert: '',
                    },
                });
                view.current.focus();
                view.current.dispatch({
                    selection: {
                        anchor: from,
                        head: from,
                    },
                });
            }
        }
    }, []);

    const pasteClipboard = useCallback(() => {
        navigator.clipboard.readText().then((clipText) => {
            if (view.current) {
                const from = view.current.state.selection.main.from;
                const to = view.current.state.selection.main.to;
                view.current.dispatch({
                    changes: {
                        from: from,
                        to: to,
                        insert: clipText,
                    },
                });
                view.current.dispatch({
                    selection: {
                        anchor: from + clipText.length,
                        head: from + clipText.length,
                    },
                });
            }
        });
    }, []);

    const handleKeyDown = useCallback(
        async (e: any) => {
            if (platformName === 'darwin') {
                if (e.keyCode === 74 && e.metaKey && !e.shiftKey && renderPanelState !== 'all') {
                    autoScrollToLine();
                }
            }
            if (platformName === 'win32' || platformName === 'linux') {
                if (e.keyCode === 74 && e.crtlKey && !e.shiftKey && renderPanelState !== 'all') {
                    autoScrollToLine();
                }
            }
        },
        [renderPanelState, autoScrollToLine]
    );

    const handleScroll = useCallback(
        (e: any) => {
            if (cursorInEditor) {
                if (scrollRatioSaveTimerRef.current) {
                    clearTimeout(scrollRatioSaveTimerRef.current);
                }

                scrollRatioSaveTimerRef.current = setTimeout(() => {
                    if (e.target) {
                        const offsetHeight = (e.target as HTMLDivElement).offsetHeight;
                        const scrollTop = (e.target as HTMLDivElement).scrollTop;
                        const scrollHeight = (e.target as HTMLDivElement).scrollHeight;
                        if ((scrollTop + offsetHeight) / scrollHeight > 0.99) {
                            setEditorScrollRatio((scrollTop + offsetHeight) / scrollHeight);
                        } else {
                            setEditorScrollRatio(scrollTop / scrollHeight);
                        }
                    }
                }, 100);
            }
            if (autoScroll.current) {
                setTimeout(() => {
                    autoScroll.current = false;
                }, 100);
                return;
            }

            if (scrollSaveTimerRef.current) {
                clearTimeout(scrollSaveTimerRef.current);
            }
            scrollSaveTimerRef.current = setTimeout(() => {
                if (view.current) {
                    //add the margin 10px and 15px to the top value
                    const fromPos = view.current.elementAtHeight(
                        Math.abs(view.current.contentDOM.getBoundingClientRect().top) + 10 + 15
                    ).from;

                    setShowEditorScrollPos(false);
                    updateTopLinePos(currentRepoKey, currentFolderKey, currentNoteKey, fromPos);
                }
            }, 100);
        },
        [
            currentRepoKey,
            currentFolderKey,
            currentNoteKey,
            setEditorScrollRatio,
            setShowEditorScrollPos,
            cursorInEditor,
        ]
    );

    const handleMouseEnter = useCallback(() => {
        setCursorInEditor(true);
    }, [setCursorInEditor]);

    const handleMouseLeave = useCallback(() => {
        setCursorInEditor(false);
    }, [setCursorInEditor]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        editor.current?.addEventListener('scroll', handleScroll, true);
        editor.current?.addEventListener('mouseenter', handleMouseEnter);
        editor.current?.addEventListener('mouseleave', handleMouseLeave);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            editor.current?.removeEventListener('scroll', handleScroll, true);
            editor.current?.removeEventListener('mouseenter', handleMouseEnter);
            editor.current?.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [handleKeyDown, handleScroll, handleMouseEnter, handleMouseLeave]);

    return (
        <MarkdownEditorContainer ref={editorContainerRef} fontSizeValue={editorFontSize}>
            {showEditorScrollPos && renderPanelState !== 'all' ? (
                <LastScrollPos onClick={autoScrollToLine}>上次在</LastScrollPos>
            ) : (
                <></>
            )}
            <div
                ref={editor}
                className={`wn-theme-cm ${cursorInRender ? 'editor-smooth' : 'editor-auto'}`}
            />
            {menu ? (
                <MenuUl top={yPos} left={xPos}>
                    <MenuLi className="menu-li-color" onClick={() => copySelection()}>
                        复制
                    </MenuLi>
                    <MenuLi className="menu-li-color" onClick={() => cutSelection()}>
                        剪切
                    </MenuLi>
                    <MenuLi className="menu-li-color" onClick={() => pasteClipboard()}>
                        粘贴
                    </MenuLi>
                </MenuUl>
            ) : (
                <></>
            )}
        </MarkdownEditorContainer>
    );
};

const MarkdownEditorContainer = styled.div(
    {
        position: 'relative',
        width: '100%',
        height: '100%',
        fontSize: '15px',
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
