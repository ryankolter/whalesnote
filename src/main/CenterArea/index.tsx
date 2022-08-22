import styled from "@emotion/styled";
import cryptoRandomString from "crypto-random-string";
import { MarkdownArea } from "./MarkdownArea";

import { cursorHeadTypes } from "../../lib/useEditPos";
import { editLinesTypes } from "../../lib/useEditLine";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
const { ipcRenderer } = window.require("electron");

const CenterArea: React.FC<CenterAreaProps> = ({
    data_path,
    currentRepoKey,
    currentFolderKey,
    currentNoteKey,
    content,
    cursorHeads,
    fromPos,
    focus,
    blur,
    theme,
    updateNote,
    renameNote,
    updateCursorHead,
    updateFromPos,
}) => {
    return (
        <MarkdownArea
            data_path={data_path}
            updateNote={updateNote}
            renameNote={renameNote}
            updateCursorHead={updateCursorHead}
            updateFromPos={updateFromPos}
            currentRepoKey={currentRepoKey}
            currentFolderKey={currentFolderKey}
            currentNoteKey={currentNoteKey}
            content={content}
            cursorHead={
                currentRepoKey &&
                currentFolderKey &&
                currentNoteKey &&
                cursorHeads[currentRepoKey] &&
                cursorHeads[currentRepoKey][currentFolderKey] &&
                cursorHeads[currentRepoKey][currentFolderKey][currentNoteKey]
                    ? cursorHeads[currentRepoKey][currentFolderKey][currentNoteKey]
                    : -1
            }
            fromPos={
                currentRepoKey &&
                currentFolderKey &&
                currentNoteKey &&
                fromPos[currentRepoKey] &&
                fromPos[currentRepoKey][currentFolderKey] &&
                fromPos[currentRepoKey][currentFolderKey][currentNoteKey]
                    ? fromPos[currentRepoKey][currentFolderKey][currentNoteKey]
                    : 0
            }
            focus={focus}
            blur={blur}
            theme={theme}
        />
    );
};

type CenterAreaProps = {
    data_path: string;
    currentRepoKey: string;
    currentFolderKey: string;
    currentNoteKey: string;
    content: string;
    cursorHeads: cursorHeadTypes;
    fromPos: editLinesTypes;
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

export default CenterArea;
