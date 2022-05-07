import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import SimpleMdeReact from "./SimpleMdeReact";
import "easymde/dist/easymde.min.css";
import "codemirror/addon/scroll/simplescrollbars.css";
import EasyMDE from "easymde";
import type { Editor, Position } from "codemirror";
import styled from "@emotion/styled";
import MarkdownIt from "markdown-it";
import { editLinesTypes } from "../lib/useEditLine";

export const MarkdownArea: React.FC<MarkdownAreaProps> = ({
  data_path,
  currentRepoKey,
  currentFolderKey,
  currentNoteKey,
  notes,
  content,
  editPos,
  editLine,
  focus,
  blur,
  updateNote,
  renameNote,
  updateEditPos,
  updateEditLine,
}) => {
  const [value, setValue] = useState(content);
  const [curEditPos, setCurEditPos] = useState<editPos>({
    cursor_line: -1,
    cursor_ch: -1,
  });
  const [curEditLine, setCurEditLine] = useState(0);
  const [showScrollPos, setShowScrollPos] = useState(false);

  const [simpleMdeInstance, setMdeInstance] = useState<EasyMDE | null>(null);
  const [codemirrorInstance, setCodemirrorInstance] = useState<Editor | null>(
    null
  );
  const [lineAndCursor, setLineAndCursor] = useState<Position | null>(null);

  const autoScroll = useRef<boolean>(false);
  const scrollSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noteSwitchRef = useRef<boolean>(false);

  const options = useMemo(() => {
    return {
      autofocus: false,
      toolbar: [
        "undo" as ToolbarButton,
        "redo" as ToolbarButton,
        "|" as "|",
        "heading-1" as ToolbarButton,
        "heading-2" as ToolbarButton,
        "heading-3" as ToolbarButton,
        "|" as "|",
        "unordered-list" as ToolbarButton,
        "quote" as ToolbarButton,
        "code" as ToolbarButton,
        "table" as ToolbarButton,
        "|" as "|",
        "switch-mode" as ToolbarButton,
        "fullscreen" as ToolbarButton,
      ],
      tabSize: 4,
      sideBySideFullscreen: false,
      spellChecker: false,
      shortcuts: {},
      scrollbarStyle: "overlay",
      maxHeight: "calc(100vh - 105px)",
      autoDownloadFontAwesome: false,
      previewRender: (plainText: any) => customMarkdownParser.render(plainText),
    };
  }, []);

  const customMarkdownParser = new MarkdownIt({
    html: true, // do not allow embedding html
    linkify: true, // auto-detect links and convert them to links
    breaks: true, // convert \n to <br>
  }).use(require("markdown-it-highlightjs"), {});

  //all useEffect
  useEffect(() => {
    noteSwitchRef.current = true;
    setTimeout(() => {
      noteSwitchRef.current = false;
    }, 500);
    if (content) {
      autoScroll.current = true;
      simpleMdeInstance?.value(content ?? "");
    } else {
      simpleMdeInstance?.value("");
      codemirrorInstance?.setValue("");
    }
    codemirrorInstance?.clearHistory();
    changeShowScrollPos();
    let full_preview_ele = codemirrorInstance?.getWrapperElement().lastChild;
    if (full_preview_ele) {
      (full_preview_ele as any).scrollTop = 0;
    }
  }, [data_path, currentRepoKey, currentFolderKey, currentNoteKey]);

  useEffect(() => {
    console.log(curEditPos);
    changeNoteCurEditPos(curEditPos);
  }, [curEditPos]);

  useEffect(() => {
    console.log(curEditLine);
    changeNoteCurEditLine(curEditLine);
  }, [curEditLine]);

  useEffect(() => {
    if (focus === "") return;
    codemirrorInstance?.focus();
    codemirrorInstance?.setCursor({
      ch: 0,
      line: 1,
    });
  }, [focus]);

  useEffect(() => {
    simpleMdeInstance?.getCmDisplay().input.blur();
  }, [blur]);

  //function used in useEffect
  const changeShowScrollPos = useCallback(() => {
    if (editLine && editLine > 10 && !simpleMdeInstance?.isPreviewActive()) {
      setShowScrollPos(true);
    } else {
      setShowScrollPos(false);
    }
  }, [editPos, simpleMdeInstance]);

  const changeNoteCurEditPos = useCallback(
    (edit_pos: editPos) => {
      updateEditPos(currentRepoKey, currentFolderKey, currentNoteKey, edit_pos);
    },
    [currentRepoKey, currentFolderKey, currentNoteKey]
  );

  const changeNoteCurEditLine = useCallback(
    (edit_line: number) => {
      updateEditLine(
        currentRepoKey,
        currentFolderKey,
        currentNoteKey,
        edit_line
      );
    },
    [currentRepoKey, currentFolderKey, currentNoteKey]
  );

  // function given to child
  const getMdeInstanceCallback = useCallback((simpleMde: EasyMDE) => {
    setMdeInstance(simpleMde);
    let view_mode = window.localStorage.getItem("view_mode") || "";
    if (view_mode === "sidebyside") {
      EasyMDE.toggleSideBySide(simpleMde);
    } else if (view_mode === "preview") {
      EasyMDE.togglePreview(simpleMde);
    }
  }, []);

  const getCmInstanceCallback = useCallback((editor: Editor) => {
    setCodemirrorInstance(editor);
    editor?.clearHistory();
    editor?.scrollTo(null, 0);
    editor?.on("scroll", handleScrollEvent);
    editor?.on("cursorActivity", handleCursorActivity);
  }, []);

  const getLineAndCursorCallback = useCallback((position: Position) => {
    setLineAndCursor(position);
  }, []);

  const onChange = useCallback(
    (new_value: string) => {
      if (!noteSwitchRef.current) {
        updateNote(
          data_path,
          currentRepoKey,
          currentFolderKey,
          currentNoteKey,
          new_value
        );

        // let index = new_value.indexOf("\n");
        // let first_line = "";
        // if(index !== -1){
        //     first_line = new_value.substring(0, index).replace(/^[\#\-\_\*\>\s]+/g,"");
        // }else{
        //     if(new_value !== ""){
        //         first_line = new_value.replace(/^[\#\-\_\*\>\s]+/g,"");
        //     }
        // }
        // let new_name : string = first_line || "空笔记"
        // enameNote(data_path, currentRepoKey, currentFolderKey, currentNoteKey, new_name);
        const doc = codemirrorInstance?.getDoc();
        if (doc) {
          let first_line_content = doc
            .getLine(doc.firstLine())
            .replace(/^[\#\-\_\*\>\s]+/g, "");
          let new_name: string = first_line_content || "空笔记";
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
      codemirrorInstance,
    ]
  );

  const autoScrollToLine = useCallback(() => {
    const doc = codemirrorInstance?.getDoc();
    if (doc) {
      let row_count = doc.lineCount();
      let start_line =
        editLine < row_count && editLine > 0 ? editLine + 1 : editLine;
      codemirrorInstance?.scrollIntoView({
        ch: 0,
        line: start_line,
        sticky: "dxnote",
      });
      if (codemirrorInstance) {
        const rect = codemirrorInstance
          .getWrapperElement()
          .getBoundingClientRect();
        const topVisibleLine = codemirrorInstance.lineAtHeight(
          rect.top,
          "window"
        );
        const bottomVisibleLine = codemirrorInstance.lineAtHeight(
          rect.bottom,
          "window"
        );
        if (
          editPos.cursor_line > topVisibleLine &&
          editPos.cursor_line < bottomVisibleLine
        ) {
          codemirrorInstance?.focus();
          if (editPos.cursor_line !== -1) {
            codemirrorInstance?.setCursor({
              ch: editPos.cursor_ch,
              line: editPos.cursor_line,
            });
          } else {
            codemirrorInstance?.setCursor({
              ch: 0,
              line: start_line,
            });
          }
        }
      }
      setShowScrollPos(false);
    }
  }, [editPos, editLine, codemirrorInstance]);

  //event handler
  const handleScrollEvent = useCallback(
    (editor) => {
      if (autoScroll.current) {
        autoScroll.current = false;
        return;
      }
      if (scrollSaveTimerRef.current) {
        clearTimeout(scrollSaveTimerRef.current);
      }
      scrollSaveTimerRef.current = setTimeout(() => {
        const rect = editor.getWrapperElement().getBoundingClientRect();
        const topVisibleLine = editor.lineAtHeight(rect.top, "window");
        let line = topVisibleLine;

        console.log(line);
        if (line <= 1) {
          return;
        }
        setShowScrollPos(false);
        setCurEditLine(line);
      }, 100);
    },
    [curEditPos]
  );

  const handleCursorActivity = useCallback((editor) => {
    var pos = editor.getCursor();
    if ((pos.line === 0 || pos.line === 1) && pos.ch === 0) {
      return;
    }
    setShowScrollPos(false);
    setCurEditPos({
      cursor_line: pos.line,
      cursor_ch: pos.ch,
    });
  }, []);

  const handleKeyDown = useCallback(
    (e: any) => {
      // console.log(e.ctrlKey)
      // console.log(e.shiftKey)
      // console.log(e.altKey)
      // console.log(e.metaKey)
      // console.log(e.keyCode)
      if (process.platform == "darwin") {
        //J key mean jump
        if (e.keyCode === 74 && e.metaKey) {
          showScrollPos && autoScrollToLine();
        }

        if (e.keyCode === 13 || e.keyCode === 108) {
          if (codemirrorInstance && !codemirrorInstance.hasFocus()) {
            setTimeout(() => {
              codemirrorInstance.focus();
              codemirrorInstance?.setCursor({
                ch: 0,
                line: 1,
              });
            }, 0);
          }
        }

        if (e.keyCode === 191 && e.metaKey) {
          if (simpleMdeInstance) {
            EasyMDE.switchMode(simpleMdeInstance);
          }
        }
      }
      if (process.platform == "win32" || process.platform == "linux") {
        //J key
        if (e.keyCode === 74 && e.ctrlKey) {
          showScrollPos && autoScrollToLine();
        }

        if (e.keyCode === 13 || e.keyCode === 108) {
          if (codemirrorInstance && !codemirrorInstance.hasFocus()) {
            setTimeout(() => {
              codemirrorInstance.focus();
              codemirrorInstance?.setCursor({
                ch: 0,
                line: 1,
              });
            }, 0);
          }
        }

        if (e.keyCode === 191 && e.ctrlKey) {
          if (simpleMdeInstance) {
            EasyMDE.switchMode(simpleMdeInstance);
          }
        }
      }
    },
    [showScrollPos, autoScrollToLine, codemirrorInstance, simpleMdeInstance]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <MarkdownAreaContainer>
      <SimpleMdeReact
        value={value}
        onChange={onChange}
        options={options}
        showScrollPos={showScrollPos}
        autoScrollToLine={autoScrollToLine}
        getMdeInstance={getMdeInstanceCallback}
        getCodemirrorInstance={getCmInstanceCallback}
        getLineAndCursor={getLineAndCursorCallback}
      />
    </MarkdownAreaContainer>
  );
};

const MarkdownAreaContainer = styled.div`
  flex: 1;
  min-width: 0;
  height: 100%;
`;

type ToolbarButton =
  | "bold"
  | "italic"
  | "quote"
  | "unordered-list"
  | "ordered-list"
  | "link"
  | "image"
  | "strikethrough"
  | "code"
  | "table"
  | "redo"
  | "heading"
  | "undo"
  | "heading-bigger"
  | "heading-smaller"
  | "heading-1"
  | "heading-2"
  | "heading-3"
  | "clean-block"
  | "horizontal-rule"
  | "preview"
  | "side-by-side"
  | "fullscreen"
  | "guide";

type MarkdownAreaProps = {
  data_path: string;
  currentRepoKey: string;
  currentFolderKey: string;
  currentNoteKey: string;
  notes: object;
  content: string;
  editPos: editPos;
  editLine: number;
  focus: string;
  blur: string;
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
