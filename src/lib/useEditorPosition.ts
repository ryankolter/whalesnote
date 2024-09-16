import { useMemo } from 'react';
import { useRecordValue } from './useRecordValue';

const useEditorPosition = (
    curDataPath: string,
    curRepoKey: string,
    curFolderKey: string,
    curNoteKey: string,
) => {
    const [cursorHeadPositions, { updateRecordValue: updateCursorHeadPos }] =
        useRecordValue<number>();
    const [topLinePositions, { updateRecordValue: updateTopLinePos }] = useRecordValue<number>();

    const cursorHeadPos = useMemo(
        () =>
            curRepoKey &&
            curFolderKey &&
            curNoteKey &&
            cursorHeadPositions[curRepoKey] &&
            cursorHeadPositions[curRepoKey][curFolderKey] &&
            cursorHeadPositions[curRepoKey][curFolderKey][curNoteKey]
                ? cursorHeadPositions[curRepoKey][curFolderKey][curNoteKey]
                : -1,
        [curDataPath, curRepoKey, curFolderKey, curNoteKey, cursorHeadPositions],
    );

    const topLinePos = useMemo(
        () =>
            curRepoKey &&
            curFolderKey &&
            curNoteKey &&
            topLinePositions[curRepoKey] &&
            topLinePositions[curRepoKey][curFolderKey] &&
            topLinePositions[curRepoKey][curFolderKey][curNoteKey]
                ? topLinePositions[curRepoKey][curFolderKey][curNoteKey]
                : 0,
        [curDataPath, curRepoKey, curFolderKey, curNoteKey, topLinePositions],
    );

    return [topLinePos, cursorHeadPos, updateTopLinePos, updateCursorHeadPos];
};

export default useEditorPosition;
