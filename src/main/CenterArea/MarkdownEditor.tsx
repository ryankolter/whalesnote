import { useContext, useCallback, useRef, useEffect, useState, useMemo } from 'react';
import styled from '@emotion/styled';
import { GlobalContext } from '../../GlobalProvider';
import { basicSetup } from 'codemirror';
import { EditorState, StateEffect, SelectionRange } from '@codemirror/state';
import { EditorView, keymap, ViewUpdate } from '@codemirror/view';
import { indentWithTab, history } from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';
import { indentUnit } from '@codemirror/language';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { autocompletion } from '@codemirror/autocomplete';
import { KeyboardSensor } from '@dnd-kit/core';

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
    theme,
    focus,
    blur,
    renderPanelState,
    setKeySelect,
    setEditorScrollRatio,
}) => {
    console.log('MarkdownEditor render');
    const {
        dataPath,
        currentRepoKey,
        currentFolderKey,
        currentNoteKey,
        renameNote,
        updateNote,
        content,
        cursorHead,
        fromPos,
        updateCursorHead,
        updateFromPos,
    } = useContext(GlobalContext);

    const editor = useRef<HTMLDivElement>(null);
    const view = useRef<EditorView>();

    const [showEditorScrollPos, setShowEditorScrollPos] = useState(false);

    const autoScroll = useRef<boolean>(false);
    const scrollSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const scrollRatioSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const noteSwitchRef = useRef<boolean>(false);

    const docChangeHandler = useCallback(
        (new_value: string, viewUpdate: any) => {
            if (!noteSwitchRef.current) {
                updateNote(dataPath, currentRepoKey, currentFolderKey, currentNoteKey, new_value);
                const doc = view.current?.state.doc;
                if (doc) {
                    const first_line_content = doc.lineAt(0).text.replace(/^[#\-\_*>\s]+/g, '');
                    const new_name: string = first_line_content || '新建文档';
                    renameNote(
                        dataPath,
                        currentRepoKey,
                        currentFolderKey,
                        currentNoteKey,
                        new_name
                    );
                }
            }
        },
        [dataPath, currentRepoKey, currentFolderKey, currentNoteKey, renameNote, updateNote]
    );

    const selectionSetHandler = useCallback(
        (vu: ViewUpdate) => {
            if (view.current) {
                const cursorHead = view.current.state.selection.main.head;
                updateCursorHead(currentRepoKey, currentFolderKey, currentNoteKey, cursorHead);
            }
        },
        [dataPath, currentRepoKey, currentFolderKey, currentNoteKey]
    );

    const handleScrollEvent = useCallback(
        (e: any) => {
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

            if (autoScroll.current) {
                autoScroll.current = false;
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
        ]
    );

    const autoScrollToLine = useCallback(() => {
        console.log('editor autoScrollToLine');
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

    const defaultThemeOption = EditorView.theme({
        '&': {
            height: '100%',
        },
    });

    const updateListener = EditorView.updateListener.of((vu: ViewUpdate) => {
        if (vu.docChanged && typeof docChangeHandler === 'function') {
            console.log('docChanged');
            const doc = vu.state.doc;
            const value = doc.toString();
            docChangeHandler(value, vu);
        }
    });

    const scrollListener = EditorView.domEventHandlers({
        scroll(event, view) {
            handleScrollEvent(event);
        },
    });

    const cursorActiveListener = EditorView.updateListener.of((vu: ViewUpdate) => {
        if (vu.selectionSet && typeof selectionSetHandler === 'function') {
            console.log('selectionSet');
            setKeySelect(false);
            selectionSetHandler(vu);
        }
    });

    const myCompletions = useCallback((CompletionContext: any) => {
        const word = CompletionContext.matchBefore(/\s*```[a-z]*/);
        const assistant_word = CompletionContext.matchBefore(/```[a-z]*/);

        if (!word || (word.from == word.to && !CompletionContext.explicit)) return null;

        const space_count = word.to - word.from - (assistant_word.to - assistant_word.from);

        const langs = ['bash', 'js', 'go'];
        const options = [];

        for (const lang of langs) {
            let label = '```' + lang + '\n';
            for (let i = 0; i < space_count; ++i) {
                label += ' ';
            }
            label += '\n';
            for (let i = 0; i < space_count; ++i) {
                label += ' ';
            }
            label += '```';
            options.push({ label });
        }

        return {
            from: word.from + space_count,
            to: word.to,
            options,
        };
    }, []);

    const getExtensions = [
        basicSetup,
        updateListener,
        defaultThemeOption,
        keymap.of([indentWithTab]),
        EditorView.lineWrapping,
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        indentUnit.of('    '),
        autocompletion({
            activateOnTyping: true,
            override: [myCompletions],
        }),
    ];

    getExtensions.push(oneDark);

    useEffect(() => {
        if (editor.current) {
            const defaultState = EditorState.create({
                doc: content,
                extensions: [...getExtensions, scrollListener, cursorActiveListener],
            });
            view.current = new EditorView({
                state: defaultState,
                parent: editor.current,
            });
        }

        return () => {
            view.current?.destroy();
            view.current = undefined;
        };
    }, []);

    useEffect(() => {
        view.current?.dispatch({
            effects: StateEffect.reconfigure.of([
                ...getExtensions,
                scrollListener,
                cursorActiveListener,
            ]),
        });
    }, [docChangeHandler, selectionSetHandler, handleScrollEvent]);

    useEffect(() => {
        autoScroll.current = true;
        noteSwitchRef.current = true;
        setTimeout(() => {
            noteSwitchRef.current = false;
        }, 500);

        const newState = EditorState.create({
            doc: content,
            extensions: [...getExtensions, EditorView.editable.of(false)],
        });
        view.current?.setState(newState);

        setTimeout(() => {
            view.current?.dispatch({
                effects: EditorView.scrollIntoView(0, {
                    y: 'start',
                }),
            });
        }, 0);

        setTimeout(() => {
            view.current?.dispatch({
                effects: StateEffect.reconfigure.of([
                    ...getExtensions,
                    EditorView.editable.of(true),
                    scrollListener,
                    cursorActiveListener,
                ]),
            });
        }, 250);

        fromPos && fromPos > 10 ? setShowEditorScrollPos(true) : setShowEditorScrollPos(false);
    }, [dataPath, currentRepoKey, currentFolderKey, currentNoteKey]);

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

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    const wrappedClassNames = typeof theme === 'string' ? `cm-theme-${theme}` : 'cm-theme';

    return (
        <MarkdownEditorContainer>
            {showEditorScrollPos && renderPanelState !== 'all' ? (
                <LastScrollPos onClick={autoScrollToLine}>上次在</LastScrollPos>
            ) : (
                <></>
            )}
            <div ref={editor} className={wrappedClassNames} />
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

type MarkdownEditorProps = {
    focus: string;
    blur: string;
    theme: string;
    renderPanelState: string;
    setKeySelect: (keySelect: boolean) => void;
    setEditorScrollRatio: (editorScrollRatio: number) => void;
};
