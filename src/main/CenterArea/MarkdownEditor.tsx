import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';
import { EditorView, ViewUpdate } from '@codemirror/view';
import useCodeMirror from '../../lib/useCodeMirror';
import useContextMenu from '../../lib/useContextMenu';
import useEditorPosition from '../../lib/useEditorPosition';
import { notes, updateNote } from '../../lib/notes';

const MarkdownEditor: React.FC<{
    cursorInRenderFlag: boolean;
    mdRenderState: string;
    renderScrollRatio: number;
    setEditorScrollRatio: React.Dispatch<React.SetStateAction<number>>;
    setRenderNoteStr: React.Dispatch<React.SetStateAction<string>>;
}> = ({
    cursorInRenderFlag,
    mdRenderState,
    renderScrollRatio,
    setEditorScrollRatio,
    setRenderNoteStr,
}) => {
    const {
        blur,
        curDataPath,
        currentRepoKey,
        currentFolderKey,
        currentNoteKey,
        editorFontSize,
        focus,
        platformName,
        showRepoPanel,
        renameNote,
        setShowKeySelect,
    } = useContext(GlobalContext);

    const [topLinePos, cursorHeadPos, updateTopLinePos, updateCursorHeadPos] = useEditorPosition(
        curDataPath,
        currentRepoKey,
        currentFolderKey,
        currentNoteKey
    );

    const [showEditorScrollPos, setShowEditorScrollPos] = useState(false);
    const [cursorInEditor, setCursorInEditor] = useState(false);
    const autoScroll = useRef(false);
    const scrollSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const scrollRatioSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const { xPos, yPos, menu } = useContextMenu(editorContainerRef);

    const onDocChange = useCallback(
        async (new_value: string, vu: ViewUpdate) => {
            await updateNote(
                curDataPath,
                currentRepoKey,
                currentFolderKey,
                currentNoteKey,
                new_value
            );
            setRenderNoteStr(new_value);

            let line = '';
            const is_with_lf = new_value.indexOf('\n') !== -1;
            if (is_with_lf) {
                let index = 0;
                let max_count = 500;
                while ((line === '' || line === '\n') && index !== -1) {
                    const next_index = new_value.indexOf('\n', index + 1);
                    if (next_index === -1) {
                        line = new_value.substring(index);
                        break;
                    }
                    line = new_value.substring(index, next_index);
                    index = next_index;
                    if (--max_count < 0) break;
                }
            } else {
                line = new_value;
            }

            let new_name = '空笔记';
            if (line !== '' && !line.startsWith('\\#')) {
                const replace_line = line.replace(/^[#\-\_*>\s]+/g, '');
                if (replace_line !== '' && !replace_line.startsWith('\\#')) new_name = replace_line;
            }

            await renameNote(
                curDataPath,
                currentRepoKey,
                currentFolderKey,
                currentNoteKey,
                new_name
            );
        },
        [
            curDataPath,
            currentRepoKey,
            currentFolderKey,
            currentNoteKey,
            renameNote,
            setRenderNoteStr,
            updateNote,
        ]
    );

    const onSelectionSet = useCallback(
        async (vu: ViewUpdate) => {
            if (view.current) {
                setShowKeySelect(false);
                const cursorHeadPos = view.current.state.selection.main.head;
                await updateCursorHeadPos(
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
        curDataPath,
        currentRepoKey,
        currentFolderKey,
        currentNoteKey,
        onDocChange,
        onSelectionSet,
    });

    useEffect(() => {
        if (focus !== '') view.current?.focus();
    }, [focus]);

    useEffect(() => {
        if (blur !== '') view.current?.contentDOM.blur();
    }, [blur]);

    useEffect(() => {
        autoScroll.current = true;
        topLinePos && topLinePos > 10
            ? setShowEditorScrollPos(true)
            : setShowEditorScrollPos(false);
    }, [curDataPath, currentRepoKey, currentFolderKey, currentNoteKey]);

    useEffect(() => {
        if (view.current && !Number.isNaN(renderScrollRatio)) {
            const offsetHeight = view.current.contentDOM.getBoundingClientRect().height;
            const scrollTop = offsetHeight * renderScrollRatio;
            const scrollPos = view.current.lineBlockAtHeight(scrollTop).from;
            setTimeout(() => {
                view.current?.dispatch({
                    effects: EditorView.scrollIntoView(scrollPos, {
                        y: 'start',
                    }),
                });
            }, 0);
        }
    }, [renderScrollRatio]);

    const autoScrollToLine = useCallback(() => {
        if (view.current) {
            if (topLinePos > 0) {
                const start_line = Math.min(topLinePos, view.current.state.doc.length);
                view.current?.dispatch({
                    effects: EditorView.scrollIntoView(start_line, {
                        y: 'start',
                    }),
                });
            }

            if (cursorHeadPos !== -1) {
                view.current?.focus();
                view.current?.dispatch({
                    selection: { anchor: cursorHeadPos },
                });
            }
        }

        setShowEditorScrollPos(false);
    }, [cursorHeadPos, topLinePos, setShowEditorScrollPos]);

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
        async (e: KeyboardEvent) => {
            if (platformName === 'darwin' || platformName === 'win32' || platformName === 'linux') {
                const modKey = platformName === 'darwin' ? e.metaKey : e.ctrlKey;

                if (
                    e.key === 'j' &&
                    modKey &&
                    !e.shiftKey &&
                    mdRenderState !== 'all' &&
                    !showRepoPanel
                ) {
                    autoScrollToLine();
                }
            }
        },
        [mdRenderState, platformName, showRepoPanel, autoScrollToLine]
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
                    const fromPos = view.current.elementAtHeight(
                        Math.abs(view.current.contentDOM.getBoundingClientRect().top) + 50
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
            cursorInEditor,
            setEditorScrollRatio,
            setShowEditorScrollPos,
            updateTopLinePos,
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
            {showEditorScrollPos && mdRenderState !== 'all' ? (
                <LastScrollPos onClick={autoScrollToLine}>上次在</LastScrollPos>
            ) : (
                <></>
            )}
            <div
                ref={editor}
                className={`wn-theme-cm ${cursorInRenderFlag ? 'editor-smooth' : 'editor-auto'}`}
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
    (props: { fontSizeValue: string }) => ({
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

export default MarkdownEditor;
