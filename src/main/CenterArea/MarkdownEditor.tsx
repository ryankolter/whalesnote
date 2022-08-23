import { useCallback, useRef, useEffect, useState } from "react";
import styled from "@emotion/styled";
import { basicSetup } from "codemirror";
import { EditorState, StateEffect, SelectionRange } from "@codemirror/state";
import { EditorView, keymap, ViewUpdate } from "@codemirror/view";
import { indentWithTab, history } from "@codemirror/commands";
import { oneDark } from "@codemirror/theme-one-dark";
import { indentUnit } from "@codemirror/language";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
    data_path,
    currentRepoKey,
    currentFolderKey,
    currentNoteKey,
    content,
    cursorHead,
    fromPos,
    theme,
    focus,
    blur,
    updateNote,
    renameNote,
    updateCursorHead,
    updateFromPos,
}) => {
    const editor = useRef<HTMLDivElement>(null);
    const view = useRef<EditorView>();

    const [showScrollPos, setShowScrollPos] = useState(false);

    const autoScroll = useRef<boolean>(false);
    const scrollSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const noteSwitchRef = useRef<boolean>(false);

    const docChangeHandler = useCallback(
        (new_value: string, viewUpdate: any) => {
            if (!noteSwitchRef.current) {
                updateNote(data_path, currentRepoKey, currentFolderKey, currentNoteKey, new_value);
                const doc = view.current?.state.doc;
                if (doc) {
                    let first_line_content = doc.lineAt(0).text.replace(/^[#\-\_*>\s]+/g, "");
                    let new_name: string = first_line_content || "新建文档";
                    renameNote(
                        data_path,
                        currentRepoKey,
                        currentFolderKey,
                        currentNoteKey,
                        new_name
                    );
                }
            }
        },
        [data_path, currentRepoKey, currentFolderKey, currentNoteKey, renameNote, updateNote]
    );

    const selectionSetHandler = useCallback(
        (vu: ViewUpdate) => {
            if (view.current) {
                let cursorHead = view.current.state.selection.main.head;
                updateCursorHead(currentRepoKey, currentFolderKey, currentNoteKey, cursorHead);
            }
        },
        [data_path, currentRepoKey, currentFolderKey, currentNoteKey]
    );

    const handleScrollEvent = useCallback(() => {
        console.log("handleScrollEvent");
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
                let fromPos = view.current.elementAtHeight(
                    Math.abs(view.current.contentDOM.getBoundingClientRect().top) + 10 + 15
                ).from;

                setShowScrollPos(false);
                updateFromPos(currentRepoKey, currentFolderKey, currentNoteKey, fromPos);
            }
        }, 100);
    }, [currentRepoKey, currentFolderKey, currentNoteKey]);

    const autoScrollToLine = useCallback(() => {
        console.log("autoScrollToLine");
        if (view.current) {
            let max_height = view.current.contentDOM.getBoundingClientRect().height;
            let start_line = fromPos <= max_height && fromPos > 0 ? fromPos : max_height;

            view.current?.dispatch({
                effects: EditorView.scrollIntoView(start_line, {
                    y: "start",
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
        "&": {
            height: "100%",
        },
    });

    const updateListener = EditorView.updateListener.of((vu: ViewUpdate) => {
        if (vu.docChanged && typeof docChangeHandler === "function") {
            console.log("docChanged");
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
        if (vu.selectionSet && typeof selectionSetHandler === "function") {
            console.log("selectionSet");
            selectionSetHandler(vu);
        }
    });

    let getExtensions = [
        basicSetup,
        updateListener,
        defaultThemeOption,
        keymap.of([indentWithTab]),
        EditorView.lineWrapping,
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        indentUnit.of("    "),
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
                    y: "start",
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
    }, [data_path, currentRepoKey, currentFolderKey, currentNoteKey]);

    useEffect(() => {
        if (focus === "") return;
        view.current?.focus();
    }, [focus]);

    useEffect(() => {
        console.log("blur");
        if (blur === "") return;
        view.current?.contentDOM.blur();
    }, [blur]);

    const wrappedClassNames = typeof theme === "string" ? `cm-theme-${theme}` : "cm-theme";

    return (
        <MarkdownEditorContainer>
            {showScrollPos ? (
                <div className='lastScrollPos' onClick={autoScrollToLine}>
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
    position: "relative",
    width: "100%",
    height: "100%",
});

type MarkdownEditorProps = {
    data_path: string;
    currentRepoKey: string;
    currentFolderKey: string;
    currentNoteKey: string;
    content: string;
    cursorHead: number;
    fromPos: number;
    focus: string;
    blur: string;
    theme: string;
    updateNote: (
        data_path: string,
        repo_key: string,
        folder_key: string,
        note_key: string,
        content: string
    ) => void;
    renameNote: (
        data_path: string,
        repo_key: string,
        folder_key: string,
        note_key: string,
        new_title: string
    ) => void;
    updateCursorHead: (
        repo_key: string,
        folder_key: string,
        note_key: string,
        cursor_head: number
    ) => void;
    updateFromPos: (
        repo_key: string,
        folder_key: string,
        note_key: string,
        from_pos: number
    ) => void;
};
