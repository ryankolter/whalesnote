import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';

import { basicSetup } from 'codemirror';
import { EditorState, StateEffect } from '@codemirror/state';
import { EditorView, keymap, ViewUpdate } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';
import { indentUnit } from '@codemirror/language';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { Completion, autocompletion } from '@codemirror/autocomplete';

import useCodeMirror from '../../lib/useCodeMirror';

export const MarkdownEditor: React.FC<{
    theme: string;
    cursorInRender: boolean;
    renderPanelState: string;
    renderScrollRatio: number;
    setEditorScrollRatio: (editorScrollRatio: number) => void;
}> = ({ theme, cursorInRender, renderPanelState, renderScrollRatio, setEditorScrollRatio }) => {
    console.log('MarkdownEditor render');
    const {
        curDataPath,
        currentRepoKey,
        currentFolderKey,
        currentNoteKey,
        renameNote,
        updateNote,
        currentContent,
        cursorHead,
        fromPos,
        updateCursorHead,
        updateFromPos,
        focus,
        blur,
        setKeySelect,
    } = useContext(GlobalContext);

    const [showEditorScrollPos, setShowEditorScrollPos] = useState(false);
    const [cursorInEditor, setCursorInEditor] = useState(false);

    const autoScroll = useRef<boolean>(false);
    const scrollSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const scrollRatioSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);

    const onDocChange = useCallback(
        (new_value: string, viewUpdate: any) => {
            updateNote(curDataPath, currentRepoKey, currentFolderKey, currentNoteKey, new_value);
            const doc = view.current?.state.doc;
            if (doc) {
                const first_line_content = doc.lineAt(0).text.replace(/^[#\-\_*>\s]+/g, '');
                const new_name: string = first_line_content || '新建文档';
                renameNote(curDataPath, currentRepoKey, currentFolderKey, currentNoteKey, new_name);
            }
        },
        [curDataPath, currentRepoKey, currentFolderKey, currentNoteKey, renameNote, updateNote]
    );

    const onSelectionSet = useCallback(
        (vu: ViewUpdate) => {
            if (view.current) {
                setKeySelect(false);
                const cursorHead = view.current.state.selection.main.head;
                updateCursorHead(currentRepoKey, currentFolderKey, currentNoteKey, cursorHead);
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
        console.log('focus');
        if (focus === '') return;
        view.current?.focus();
    }, [focus]);

    useEffect(() => {
        console.log('blur');
        if (blur === '') return;
        view.current?.contentDOM.blur();
    }, [blur]);

    useEffect(() => {
        autoScroll.current = true;
        fromPos && fromPos > 10 ? setShowEditorScrollPos(true) : setShowEditorScrollPos(false);
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
            const start_line = fromPos <= max_height && fromPos > 0 ? fromPos : max_height;

            view.current?.dispatch({
                effects: EditorView.scrollIntoView(start_line, {
                    y: 'start',
                }),
            });

            if (cursorHead !== -1) {
                view.current?.focus();
                view.current?.dispatch({
                    selection: { anchor: cursorHead },
                });
            }
        }

        setShowEditorScrollPos(false);
    }, [cursorHead, fromPos]);

    const handleKeyDown = useCallback(
        (e: any) => {
            if (process.platform === 'darwin') {
                if (e.keyCode === 74 && e.metaKey && !e.shiftKey && renderPanelState !== 'all') {
                    autoScrollToLine();
                }
            }
            if (process.platform === 'win32' || process.platform === 'linux') {
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
                    updateFromPos(currentRepoKey, currentFolderKey, currentNoteKey, fromPos);
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

    const themeClassNames =
        typeof theme === 'string'
            ? `${theme}-theme-cm common-theme-cm`
            : 'grey-theme-cm common-theme-cm';

    const scrollClassNames = cursorInRender ? 'editor-smooth' : 'editor-auto';

    return (
        <MarkdownEditorContainer ref={editorContainerRef}>
            {showEditorScrollPos && renderPanelState !== 'all' ? (
                <LastScrollPos className="btn-1-bg-color" onClick={autoScrollToLine}>
                    上次在
                </LastScrollPos>
            ) : (
                <></>
            )}
            <div ref={editor} className={`${themeClassNames} ${scrollClassNames}`} />
        </MarkdownEditorContainer>
    );
};

const MarkdownEditorContainer = styled.div({
    position: 'relative',
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
