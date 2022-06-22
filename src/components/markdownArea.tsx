import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import "easymde/dist/easymde.min.css";
import "codemirror/addon/scroll/simplescrollbars.css";
import "codemirror/addon/scroll/simplescrollbars.js";
import EasyMDE from "easymde";
import type { Editor, Position } from "codemirror";
import styled from "@emotion/styled";
import MarkdownIt from "markdown-it";
import SimpleMDE, { Options } from "easymde";

export const MarkdownArea: React.FC<MarkdownAreaProps> = ({
  data_path,
  currentRepoKey,
  currentFolderKey,
  currentNoteKey,
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
  const currentValueRef = useRef(content);

  const [textRef, setTextRef] = useState<HTMLTextAreaElement | null>(null);
  const [editor, setEditor] = useState<SimpleMDE | null>(null);
  const codemirror = useMemo(() => {
    return editor?.codemirror;
  }, [editor?.codemirror]) as Editor | undefined;

  const [showScrollPos, setShowScrollPos] = useState(false);

  const autoScroll = useRef<boolean>(false);
  const scrollSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noteSwitchRef = useRef<boolean>(false);

  const options = useMemo(() => {
    const customMarkdownParser = new MarkdownIt({
      html: true, // do not allow embedding html
      linkify: true, // auto-detect links and convert them to links
      breaks: true, // convert \n to <br>
    }).use(require("markdown-it-highlightjs"), {});

    return {
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

  //all useEffect
  useEffect(() => {
    console.log("new simple mde");
    if (textRef) {
      let editor: SimpleMDE = new SimpleMDE(
        Object.assign({}, options, {
          element: textRef,
          initialValue: currentValueRef.current,
        })
      );
      let view_mode = window.localStorage.getItem("view_mode") || "";
      if (view_mode === "sidebyside") {
        EasyMDE.toggleSideBySide(editor);
      } else if (view_mode === "preview") {
        EasyMDE.togglePreview(editor);
      }
      setEditor(editor);
    }
    return () => {
      editor?.toTextArea();
      editor?.cleanup();
    };
  }, [textRef, options]);

  const changeShowScrollPos = useCallback(() => {
    console.log(editLine);
    if (editLine && editLine > 10 && !editor?.isPreviewActive()) {
      setShowScrollPos(true);
    } else {
      setShowScrollPos(false);
    }
  }, [editLine, editor]);

  useEffect(() => {
    noteSwitchRef.current = true;
    setTimeout(() => {
      noteSwitchRef.current = false;
    }, 500);
    codemirror?.scrollTo(null, 0);
    codemirror?.clearHistory();
    if (content) {
      autoScroll.current = true;
      editor?.value(content ?? "");
    } else {
      editor?.value("");
      codemirror?.setValue("");
    }
    changeShowScrollPos();
    let full_preview_ele = codemirror?.getWrapperElement().lastChild;
    if (full_preview_ele) {
      (full_preview_ele as any).scrollTop = 0;
    }
  }, [data_path, currentRepoKey, currentFolderKey, currentNoteKey]);

  useEffect(() => {
    if (focus === "") return;
    codemirror?.focus();
    codemirror?.setCursor({
      ch: 0,
      line: 1,
    });
  }, [focus]);

  const activateBlur = useCallback(() => {
    editor?.getCmDisplay().input.blur();
  }, [editor]);

  useEffect(() => {
    activateBlur();
  }, [blur, activateBlur]);

  const onCodemirrorChangeHandler = useCallback(() => {
    console.log("======");
    const new_value = editor?.value() ?? "";
    console.log(new_value);
    if (!noteSwitchRef.current) {
      updateNote(
        data_path,
        currentRepoKey,
        currentFolderKey,
        currentNoteKey,
        new_value
      );
      const doc = editor?.codemirror?.getDoc();
      if (doc) {
        let first_line_content = doc
          .getLine(doc.firstLine())
          .replace(/^[#\-\_*>\s]+/g, "");
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
  }, [
    data_path,
    currentRepoKey,
    currentFolderKey,
    currentNoteKey,
    renameNote,
    updateNote,
    editor,
  ]);

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

        if (line <= 1) {
          return;
        }
        setShowScrollPos(false);
        updateEditLine(currentRepoKey, currentFolderKey, currentNoteKey, line);
      }, 100);
    },
    [currentRepoKey, currentFolderKey, currentNoteKey]
  );

  const handleCursorActivity = useCallback(
    (editor) => {
      var pos = editor.getCursor();
      if ((pos.line === 0 || pos.line === 1) && pos.ch === 0) {
        return;
      }
      setShowScrollPos(false);
      updateEditPos(currentRepoKey, currentFolderKey, currentNoteKey, {
        cursor_line: pos.line,
        cursor_ch: pos.ch,
      });
    },
    [currentRepoKey, currentFolderKey, currentNoteKey]
  );

  useEffect(() => {
    codemirror?.on("change", onCodemirrorChangeHandler);
    codemirror?.on("scroll", handleScrollEvent);
    codemirror?.on("cursorActivity", handleCursorActivity);

    return () => {
      codemirror?.off("change", onCodemirrorChangeHandler);
      codemirror?.off("scroll", handleScrollEvent);
      codemirror?.off("cursorActivity", handleCursorActivity);
    };
  }, [
    codemirror,
    onCodemirrorChangeHandler,
    handleScrollEvent,
    handleCursorActivity,
  ]);

  const autoScrollToLine = useCallback(() => {
    const doc = codemirror?.getDoc();
    if (doc) {
      let row_count = doc.lineCount();
      let start_line =
        editLine < row_count && editLine > 0 ? editLine + 1 : editLine;
      codemirror?.scrollIntoView({
        ch: 0,
        line: start_line,
        sticky: "dxnote",
      });
      if (codemirror) {
        const rect = codemirror.getWrapperElement().getBoundingClientRect();
        const topVisibleLine = codemirror.lineAtHeight(rect.top, "window");
        const bottomVisibleLine = codemirror.lineAtHeight(
          rect.bottom,
          "window"
        );
        if (
          editPos.cursor_line > topVisibleLine &&
          editPos.cursor_line < bottomVisibleLine
        ) {
          codemirror?.focus();
          if (editPos.cursor_line !== -1) {
            codemirror?.setCursor({
              ch: editPos.cursor_ch,
              line: editPos.cursor_line,
            });
          } else {
            codemirror?.setCursor({
              ch: 0,
              line: start_line,
            });
          }
        }
      }
      setShowScrollPos(false);
    }
  }, [editPos, editLine, codemirror]);

  //event handler
  const handleKeyDown = useCallback(
    (e: any) => {
      // console.log(e.ctrlKey)
      // console.log(e.shiftKey)
      // console.log(e.altKey)
      // console.log(e.metaKey)
      // console.log(e.keyCode)
      if (process.platform === "darwin") {
        //J key mean jump
        if (e.keyCode === 74 && e.metaKey) {
          showScrollPos && autoScrollToLine();
        }

        if (e.keyCode === 13 || e.keyCode === 108) {
          if (codemirror && !codemirror.hasFocus()) {
            setTimeout(() => {
              codemirror.focus();
              codemirror?.setCursor({
                ch: 0,
                line: 1,
              });
            }, 0);
          }
        }

        if (e.keyCode === 191 && e.metaKey) {
          if (editor) {
            EasyMDE.switchMode(editor);
          }
        }
      }
      if (process.platform === "win32" || process.platform === "linux") {
        //J key
        if (e.keyCode === 74 && e.ctrlKey) {
          showScrollPos && autoScrollToLine();
        }

        if (e.keyCode === 13 || e.keyCode === 108) {
          if (codemirror && !codemirror.hasFocus()) {
            setTimeout(() => {
              codemirror.focus();
              codemirror?.setCursor({
                ch: 0,
                line: 1,
              });
            }, 0);
          }
        }

        if (e.keyCode === 191 && e.ctrlKey) {
          if (editor) {
            EasyMDE.switchMode(editor);
          }
        }
      }
    },
    [showScrollPos, autoScrollToLine, codemirror, editor]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <MarkdownAreaContainer>
      <div style={{ position: "relative" }} id={`markdown-area-wrapper`}>
        {showScrollPos ? (
          <div className="lastScrollPos" onClick={() => autoScrollToLine()}>
            上次在
          </div>
        ) : (
          <></>
        )}
        <textarea
          id={`markdown-area`}
          ref={setTextRef}
          style={{ display: "none" }}
        />
      </div>
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
