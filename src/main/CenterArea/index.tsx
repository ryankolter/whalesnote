import styled from "@emotion/styled";
import cryptoRandomString from "crypto-random-string";
import { MarkdownArea } from "./MarkdownArea";

import { editPosTypes } from "../../lib/useEditPos";
import { editLinesTypes } from "../../lib/useEditLine";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
const { ipcRenderer } = window.require("electron");

const CenterArea: React.FC<CenterAreaProps> = ({
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
  return (
    <MarkdownArea
      data_path={data_path}
      updateNote={updateNote}
      renameNote={renameNote}
      updateEditPos={updateEditPos}
      updateEditLine={updateEditLine}
      currentRepoKey={currentRepoKey}
      currentFolderKey={currentFolderKey}
      currentNoteKey={currentNoteKey}
      content={content}
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
  );
};

type CenterAreaProps = {
  data_path: string;
  currentRepoKey: string;
  currentFolderKey: string;
  currentNoteKey: string;
  content: string;
  editPos: editPosTypes;
  editLine: editLinesTypes;
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

export default CenterArea;
