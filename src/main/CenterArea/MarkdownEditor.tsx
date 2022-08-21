import { useCallback, useRef, useEffect, useState } from "react";
import styled from "@emotion/styled";
import { basicSetup } from "codemirror";
import { EditorState, StateEffect } from "@codemirror/state";
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

  const [view, setView] = useState<EditorView>();
  const [state, setState] = useState<EditorState>();

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
        const doc = view?.state.doc;
        console.log(doc);
        if (doc) {
          let first_line_content = doc
            .lineAt(1)
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
    console.log("init view");
    if (editor.current) {
      const defaultState = EditorState.create({
        doc: content,
        extensions: [getExtensions],
      });
      setState(defaultState);
      const viewCurrent = new EditorView({
        state: defaultState,
        parent: editor.current,
      });
      setView(viewCurrent);
    }

    return () => {
      view?.destroy();
      setView(undefined);
      setState(undefined);
    };
  }, []);

  useEffect(() => {
    if (view) {
      view.dispatch({ effects: StateEffect.reconfigure.of(getExtensions) });
    }
  }, [onChange]);

  useEffect(() => {
    console.log("trigger switch");
    noteSwitchRef.current = true;
    setTimeout(() => {
      noteSwitchRef.current = false;
    }, 500);
    // view?.dispatch({
    //     changes: { from: 0, to: view.state.doc.length, insert: content || '' },
    // });

    const newState = EditorState.create({
      doc: content,
      extensions: [getExtensions],
    });
    setState(newState);
    view?.setState(newState);

    // if (content) {
    //   autoScroll.current = true;
    //   editor?.value(content ?? "");
    // } else {
    //   editor?.value("");
    //   codemirror?.setValue("");
    // }
  }, [data_path, currentRepoKey, currentFolderKey, currentNoteKey]);

  const wrappedClassNames =
    typeof theme === "string" ? `cm-theme-${theme}` : "cm-theme";

  return (
    <MarkdownEditorContainer>
      <div ref={editor} className={wrappedClassNames} />
    </MarkdownEditorContainer>
  );
};

const MarkdownEditorContainer = styled.div({
  width: "100%",
  height: "calc(100vh - 40px - 20px)",
  margin: "20px 10px 10px 0",
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
