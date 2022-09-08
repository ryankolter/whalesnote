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

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ theme, focus, blur }) => {
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

    const [showScrollPos, setShowScrollPos] = useState(false);

    const autoScroll = useRef<boolean>(false);
    const scrollSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
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

    const handleScrollEvent = useCallback(() => {
        console.log('handleScrollEvent');
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

                setShowScrollPos(false);
                updateFromPos(currentRepoKey, currentFolderKey, currentNoteKey, fromPos);
            }
        }, 100);
    }, [currentRepoKey, currentFolderKey, currentNoteKey]);

    const autoScrollToLine = useCallback(() => {
        console.log('autoScrollToLine');
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
            setShowScrollPos(false);
        }
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
            handleScrollEvent();
        },
    });

    const cursorActiveListener = EditorView.updateListener.of((vu: ViewUpdate) => {
        if (vu.selectionSet && typeof selectionSetHandler === 'function') {
            console.log('selectionSet');
            //selectionSetHandler(vu);
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

        fromPos && fromPos > 10 ? setShowScrollPos(true) : setShowScrollPos(false);
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

    const wrappedClassNames = typeof theme === 'string' ? `cm-theme-${theme}` : 'cm-theme';

    return (
        <MarkdownEditorContainer>
            {showScrollPos ? (
                <div className="lastScrollPos" onClick={autoScrollToLine}>
                    上次在
                </div>
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

type MarkdownEditorProps = {
    focus: string;
    blur: string;
    theme: string;
};
