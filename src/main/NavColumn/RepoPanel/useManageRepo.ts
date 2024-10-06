import { activeWhaleIdAtom, editorRefAtom } from '@/atoms';
import { useDataContext } from '@/context/DataProvider';
import { genKey } from '@/utils';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const useManageRepo = () => {
    const { t } = useTranslation();

    const {
        whalesnote,
        newRepo,
        newFolder,
        newNote,
        renameRepo,
        reorderRepo,
        deleteRepo,
        curRepoKey,
        curFolderKey,
        switchRepo,
        switchNote,
        prepareContent,
    } = useDataContext();

    const id = useAtomValue(activeWhaleIdAtom);
    const editorRef = useAtomValue(editorRefAtom);

    const [newRepoName, setNewRepoName] = useState('');
    const [curRepoName, setCurRepoName] = useState('');

    const newRepoProcessing = useRef(false);

    useEffect(() => {
        setCurRepoName(
            curRepoKey && whalesnote.repo_map?.[curRepoKey]
                ? whalesnote.repo_map[curRepoKey].repo_name
                : '',
        );
    }, [curRepoKey, whalesnote]);

    const confirmNewRepo = useCallback(
        async (cb: (repoKey: string) => void) => {
            if (newRepoProcessing.current) return;
            newRepoProcessing.current = true;

            const repoKey = genKey(),
                folderKey = genKey(),
                noteKey = genKey();

            await newRepo(id, repoKey, newRepoName);
            await newFolder(id, repoKey, folderKey, t('category.default_name'));
            await newNote(id, repoKey, folderKey, noteKey, t('note.untitled'));
            await prepareContent(repoKey, folderKey, noteKey);
            setNewRepoName('');

            setTimeout(() => {
                switchNote(repoKey, folderKey, noteKey);
            }, 0);

            setTimeout(() => {
                editorRef.current?.focus();
            }, 300);

            cb(repoKey);
            newRepoProcessing.current = false;
        },
        [id, newRepoName, newRepo, newFolder, newNote, prepareContent, switchNote],
    );

    const confirmRenameRepo = useCallback(async () => {
        if (!curRepoKey) return;
        await renameRepo(id, curRepoKey, curRepoName);
    }, [id, curRepoKey, curRepoName, renameRepo]);

    const resetCurRepoName = useCallback(() => {
        setCurRepoName(
            curRepoKey && whalesnote.repo_map?.[curRepoKey]
                ? whalesnote.repo_map[curRepoKey].repo_name
                : '',
        );
    }, [curRepoKey, whalesnote]);

    const confirmDeleteRepo = useCallback(
        async (cb: (successorRepoKey: string) => void) => {
            if (!curRepoKey) return;
            const successorRepoKey = await deleteRepo(id, curRepoKey);
            cb(successorRepoKey);
        },
        [curRepoKey, deleteRepo, id],
    );

    return {
        newRepoName,
        setNewRepoName,
        confirmNewRepo,
        curRepoName,
        setCurRepoName,
        confirmRenameRepo,
        resetCurRepoName,
        confirmDeleteRepo,
    };
};
