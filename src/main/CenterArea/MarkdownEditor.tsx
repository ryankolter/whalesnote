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
  editPos,
  editLine,
  theme,
  focus,
  blur,
  updateNote,
  renameNote,
  updateEditPos,
  updateEditLine,
}) => {
  const editor = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView>();

  const [showScrollPos, setShowScrollPos] = useState(false);

  const autoScroll = useRef<boolean>(false);
  const scrollSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noteSwitchRef = useRef<boolean>(false);

  const onChange = useCallback(
    (new_value: string, viewUpdate: any) => {
      if (!noteSwitchRef.current) {
        console.log("????");
        updateNote(
          data_path,
          currentRepoKey,
          currentFolderKey,
          currentNoteKey,
          new_value
        );
        const doc = view.current?.state.doc;
        console.log(doc);
        if (doc) {
          let first_line_content = doc
            .lineAt(0)
            .text.replace(/^[#\-\_*>\s]+/g, "");
          let new_name: string = first_line_content || "新建文档";
          console.log(new_name);
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
    [
      data_path,
      currentRepoKey,
      currentFolderKey,
      currentNoteKey,
      renameNote,
      updateNote,
      view,
    ]
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
        let line = view.current.elementAtHeight(
          Math.abs(view.current.contentDOM.getBoundingClientRect().top)
        ).from;
        console.log(line);

        if (line <= 0) {
          return;
        }
        setShowScrollPos(false);
        updateEditLine(currentRepoKey, currentFolderKey, currentNoteKey, line);
      }
    }, 100);
  }, [currentRepoKey, currentFolderKey, currentNoteKey]);

  const handleCursorActivity = useCallback(() => {
    if (view.current) {
      let pos = view.current.state.selection.main.head;
      if (pos === 0 || pos === 1) {
        return;
      }
      setShowScrollPos(false);
      updateEditPos(currentRepoKey, currentFolderKey, currentNoteKey, {
        cursor_line: pos,
        cursor_ch: 0,
      });
    }
  }, [currentRepoKey, currentFolderKey, currentNoteKey]);

  const autoScrollToLine = useCallback(() => {
    if (view.current) {
      let max_height = view.current.contentDOM.getBoundingClientRect().height;
      let start_line =
        editLine <= max_height - 24 && editLine > 0
          ? editLine + 24
          : max_height;
      console.log(start_line);

      view.current?.dispatch({
        effects: EditorView.scrollIntoView(start_line, {
          y: "start",
        }),
      });
      // if (codemirror) {
      //     const rect = codemirror.getWrapperElement().getBoundingClientRect();
      //     const topVisibleLine = codemirror.lineAtHeight(rect.top, "window");
      //     const bottomVisibleLine = codemirror.lineAtHeight(
      //     rect.bottom,
      //     "window"
      //     );
      //     if (
      //     editPos.cursor_line > topVisibleLine &&
      //     editPos.cursor_line < bottomVisibleLine
      //     ) {
      //     codemirror?.focus();
      //     if (editPos.cursor_line !== -1) {
      //         codemirror?.setCursor({
      //         ch: editPos.cursor_ch,
      //         line: editPos.cursor_line,
      //         });
      //     } else {
      //         codemirror?.setCursor({
      //         ch: 0,
      //         line: start_line,
      //         });
      //     }
      //     }
      // }
      setShowScrollPos(false);
    }
  }, [editPos, editLine]);

  const defaultThemeOption = EditorView.theme({
    "&": {
      height: "100%",
    },
  });

  const updateListener = EditorView.updateListener.of((vu: ViewUpdate) => {
    if (vu.docChanged && typeof onChange === "function") {
      console.log("onchange");
      const doc = vu.state.doc;
      const value = doc.toString();
      onChange(value, vu);
    }
  });

  const scrollListener = EditorView.domEventHandlers({
    scroll(event, view) {
      handleScrollEvent();
    },
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
        extensions: [...getExtensions, scrollListener],
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
      effects: StateEffect.reconfigure.of([...getExtensions, scrollListener]),
    });
  }, [onChange, handleScrollEvent]);

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
        ]),
      });
    }, 250);

    editLine && editLine > 10
      ? setShowScrollPos(true)
      : setShowScrollPos(false);
  }, [data_path, currentRepoKey, currentFolderKey, currentNoteKey]);

  useEffect(() => {
    console.log("focus");
    if (focus === "") return;
    view.current?.focus();
  }, [focus]);

  useEffect(() => {
    console.log("blur");
    if (blur === "") return;
    view.current?.contentDOM.blur();
  }, [blur]);

  const wrappedClassNames =
    typeof theme === "string" ? `cm-theme-${theme}` : "cm-theme";

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
  editPos: editPos;
  editLine: number;
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
  updateEditPos: (
    repo_key: string,
    folder_key: string,
    note_key: string,
    edit_pos: editPos
  ) => void;
  updateEditLine: (
    repo_key: string,
    folder_key: string,
    note_key: string,
    edit_line: number
  ) => void;
};

type editPos = {
  cursor_line: number;
  cursor_ch: number;
};
