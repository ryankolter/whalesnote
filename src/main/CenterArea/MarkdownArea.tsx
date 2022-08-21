import { useCallback, useEffect, useState } from "react";
import styled from "@emotion/styled";
import { MarkdownEditor } from "./MarkdownEditor";
import { MarkdownRender } from "./MarkdownRender";
import { relative } from "node:path/win32";

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
  theme,
  updateNote,
  renameNote,
  updateEditPos,
  updateEditLine,
}) => {
  const [editorHeight, setEditorHeight] = useState("calc(100vh - 40px - 20px)");
  const [renderHeight, setRenderHeight] = useState("0");
  const [renderTop, setRenderTop] = useState("calc(100vh - 20px)");

  const [renderPanelState, setRenderPanelState] = useState("hidden");

  useEffect(() => {
    if (renderPanelState === "hidden") {
      setEditorHeight("calc(100vh - 40px - 20px)");
      setRenderHeight("0");
      setRenderTop("calc(100vh - 20px)");
    } else if (renderPanelState === "half") {
      setEditorHeight("calc(50vh - 30px)");
      setRenderHeight("calc(50vh - 40px)");
      setRenderTop("calc(50vh - 20px)");
    } else if (renderPanelState === "all") {
      setEditorHeight("calc(100vh - 40px - 20px)");
      setRenderHeight("calc(100vh - 40px - 20px)");
      setRenderTop("0");
    }
  }, [renderPanelState]);

  return (
    <MarkdownAreaContainer>
      <EditorPanel heightValue={editorHeight}>
        <MarkdownEditor
          data_path={data_path}
          updateNote={updateNote}
          renameNote={renameNote}
          updateEditPos={updateEditPos}
          updateEditLine={updateEditLine}
          currentRepoKey={currentRepoKey}
          currentFolderKey={currentFolderKey}
          currentNoteKey={currentNoteKey}
          content={content}
          theme={theme}
          editPos={
            currentRepoKey &&
            currentFolderKey &&
            currentNoteKey &&
            editPos[currentRepoKey] &&
            editPos[currentRepoKey][currentFolderKey] &&
            editPos[currentRepoKey][currentFolderKey][currentNoteKey]
              ? editPos[currentRepoKey][currentFolderKey][currentNoteKey]
              : { cursor_line: -1, cursor_ch: -1 }
          }
          editLine={
            currentRepoKey &&
            currentFolderKey &&
            currentNoteKey &&
            editLine[currentRepoKey] &&
            editLine[currentRepoKey][currentFolderKey] &&
            editLine[currentRepoKey][currentFolderKey][currentNoteKey]
              ? editLine[currentRepoKey][currentFolderKey][currentNoteKey]
              : 0
          }
          focus={focus}
          blur={blur}
        />
      </EditorPanel>
      <RenderPanel topValue={renderTop} heightValue={renderHeight}>
        {renderPanelState !== "hidden" ? (
          <MarkdownRender
            data_path={data_path}
            currentRepoKey={currentRepoKey}
            currentFolderKey={currentFolderKey}
            currentNoteKey={currentNoteKey}
            content={content}
            theme={theme}
          />
        ) : (
          <></>
        )}
        {renderPanelState === "hidden" ? (
          <HiddenToHalfBtn
            onClick={() => {
              setRenderPanelState("half");
            }}
          ></HiddenToHalfBtn>
        ) : (
          <></>
        )}
        {renderPanelState === "hidden" ? (
          <HiddenToAllBtn
            onClick={() => {
              setRenderPanelState("all");
            }}
          ></HiddenToAllBtn>
        ) : (
          <></>
        )}
        {renderPanelState === "half" ? (
          <HalfToHiddenBtn
            onClick={() => {
              setRenderPanelState("hidden");
            }}
          ></HalfToHiddenBtn>
        ) : (
          <></>
        )}
        {renderPanelState === "half" ? (
          <HalfToAllBtn
            onClick={() => {
              setRenderPanelState("all");
            }}
          ></HalfToAllBtn>
        ) : (
          <></>
        )}
        {renderPanelState === "all" ? (
          <AllToHalfBtn
            onClick={() => {
              setRenderPanelState("half");
            }}
          ></AllToHalfBtn>
        ) : (
          <></>
        )}
        {renderPanelState === "all" ? (
          <AllToHiddenBtn
            onClick={() => {
              setRenderPanelState("hidden");
            }}
          ></AllToHiddenBtn>
        ) : (
          <></>
        )}
      </RenderPanel>
    </MarkdownAreaContainer>
  );
};

const MarkdownAreaContainer = styled.div({
  position: "relative",
  flex: "1",
  minWidth: "0",
  margin: "20px 10px 10px 0",
});

const EditorPanel = styled.div(
  {
    width: "100%",
  },
  (props: { heightValue: string }) => ({
    height: props.heightValue,
  })
);

const RenderPanel = styled.div(
  {
    position: "absolute",
    width: "100%",
  },
  (props: { topValue: string; heightValue: string }) => ({
    top: props.topValue,
    height: props.heightValue,
  })
);

const HiddenToHalfBtn = styled.div({
  height: "25px",
  width: "40px",
  position: "absolute",
  right: "40px",
  top: "-25px",
  backgroundColor: "#000",
});

const HiddenToAllBtn = styled.div({
  height: "40px",
  width: "40px",
  position: "absolute",
  right: "0",
  top: "-40px",
  backgroundColor: "#999",
});

const HalfToHiddenBtn = styled.div({
  height: "25px",
  width: "40px",
  position: "absolute",
  right: "40px",
  top: "0",
  backgroundColor: "#000",
});

const HalfToAllBtn = styled.div({
  height: "40px",
  width: "40px",
  position: "absolute",
  right: "0",
  top: "-40px",
  backgroundColor: "#999",
});

const AllToHalfBtn = styled.div({
  height: "25px",
  width: "40px",
  position: "absolute",
  right: "40px",
  top: "0",
  backgroundColor: "#000",
});

const AllToHiddenBtn = styled.div({
  height: "40px",
  width: "40px",
  position: "absolute",
  right: "0",
  top: "0",
  backgroundColor: "#999",
});

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
