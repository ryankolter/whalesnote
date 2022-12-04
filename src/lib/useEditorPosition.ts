import { useMemo } from 'react';
import { useRecordValue } from './useRecordValue';

const useEditorPosition = (
    curDataPath: string,
    currentRepoKey: string,
    currentFolderKey: string,
    currentNoteKey: string
) => {
    const [cursorHeadPositions, { updateRecordValue: updateCursorHeadPos }] =
        useRecordValue<number>();
    const [topLinePositions, { updateRecordValue: updateTopLinePos }] = useRecordValue<number>();

    const cursorHeadPos = useMemo(
        () =>
            currentRepoKey &&
            currentFolderKey &&
            currentNoteKey &&
            cursorHeadPositions[currentRepoKey] &&
            cursorHeadPositions[currentRepoKey][currentFolderKey] &&
            cursorHeadPositions[currentRepoKey][currentFolderKey][currentNoteKey]
                ? cursorHeadPositions[currentRepoKey][currentFolderKey][currentNoteKey]
                : -1,
        [curDataPath, currentRepoKey, currentFolderKey, currentNoteKey, cursorHeadPositions]
    );

    const topLinePos = useMemo(
        () =>
            currentRepoKey &&
            currentFolderKey &&
            currentNoteKey &&
            topLinePositions[currentRepoKey] &&
            topLinePositions[currentRepoKey][currentFolderKey] &&
            topLinePositions[currentRepoKey][currentFolderKey][currentNoteKey]
                ? topLinePositions[currentRepoKey][currentFolderKey][currentNoteKey]
                : 0,
        [curDataPath, currentRepoKey, currentFolderKey, currentNoteKey, topLinePositions]
    );

    return [topLinePos, cursorHeadPos, updateTopLinePos, updateCursorHeadPos];
};

export default useEditorPosition;
