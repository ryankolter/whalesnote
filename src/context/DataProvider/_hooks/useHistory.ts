import { useRef, useCallback, useState, useEffect } from 'react';
import { Draft, produce } from 'immer';
import { HistoryInfo } from '@/interface';

export const useHistory = () => {
    const [histories, setHistories] = useState<Record<string, HistoryInfo>>({});
    const historySaveTimerObj = useRef<NodeJS.Timeout>();

    const latestHistories = useRef(histories);
    useEffect(() => {
        latestHistories.current = histories;
    }, [histories]);

    const produceHistories = useCallback(
        (draftFn: (draft: Draft<Record<string, HistoryInfo>>) => void) => {
            setHistories((_histories) => {
                return produce(_histories, draftFn);
            });
        },
        [],
    );

    const addHistory = useCallback((id: string, historyInfo: HistoryInfo) => {
        produceHistories((draft) => {
            if (draft[id]) return;
            draft[id] = historyInfo;
        });
    }, []);

    const removeHistory = useCallback((id: string) => {
        produceHistories((draft) => {
            if (!draft[id]) return;
            delete draft[id];
        });
    }, []);

    const saveTask = async (id: string, dataPath: string) => {
        const currentHistories = latestHistories.current;
        if (!currentHistories[id]) return;
        await window.electronAPI.writeJson(`${dataPath}/history_info.json`, currentHistories[id]);
    };

    const addSaveTask = (id: string, dataPath: string, delay: number) => {
        if (historySaveTimerObj.current) {
            clearTimeout(historySaveTimerObj.current);
        }

        historySaveTimerObj.current = setTimeout(async () => {
            await saveTask(id, dataPath);
            historySaveTimerObj.current = undefined;
        }, delay);
    };

    const updateHistory = async (
        id: string,
        dataPath: string,
        repoKey: string,
        folderKey?: string,
        noteKey?: string,
    ) => {
        if (folderKey) {
            if (noteKey) {
                produceHistories((draft) => {
                    draft[id].cur_repo_key = repoKey;
                    if (!draft[id].repos_record) {
                        draft[id].repos_record = {};
                    }
                    if (!draft[id].repos_record[repoKey]) {
                        draft[id].repos_record[repoKey] = {
                            cur_folder_key: folderKey,
                            folders: {
                                [folderKey]: noteKey,
                            },
                        };
                    } else {
                        draft[id].repos_record[repoKey].cur_folder_key = folderKey;
                        draft[id].repos_record[repoKey].folders[folderKey] = noteKey;
                    }
                });
            } else {
                produceHistories((draft) => {
                    if (!draft[id].repos_record) draft[id].repos_record = {};
                    if (!draft[id].repos_record[repoKey]) {
                        draft[id].repos_record[repoKey] = {
                            cur_folder_key: folderKey,
                            folders: {},
                        };
                    } else {
                        draft[id].repos_record[repoKey].cur_folder_key = folderKey;
                    }
                });
            }
        } else {
            produceHistories((draft) => {
                draft[id].cur_repo_key = repoKey;
            });
        }

        await addSaveTask(id, dataPath, 1200);
    };

    return { histories, addHistory, removeHistory, updateHistory };
};
