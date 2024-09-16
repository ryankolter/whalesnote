import { useRef, useCallback, useState } from 'react';
import { produce } from 'immer';
import { HistoryInfo } from '../commonType';

const useHistory = () => {
    const [histories, setHistories] = useState<Record<string, HistoryInfo>>({});
    const historySaveTimerObj = useRef<NodeJS.Timeout>();

    const addHistory = useCallback(
        (id: string, historyInfo: HistoryInfo) => {
            setHistories(
                produce(histories, (draft) => {
                    if (draft[id]) return;
                    draft[id] = historyInfo;
                }),
            );
        },
        [histories],
    );

    const saveTask = useCallback(
        async (id: string, dataPath: string) => {
            if (!histories[id]) return;
            await window.electronAPI.writeJson(`${dataPath}/history_info.json`, histories[id]);
        },
        [histories],
    );

    const addSaveTask = useCallback(
        (id: string, dataPath: string, delay: number) => {
            if (historySaveTimerObj.current) {
                clearTimeout(historySaveTimerObj.current);
            }

            historySaveTimerObj.current = setTimeout(async () => {
                await saveTask(id, dataPath);
                historySaveTimerObj.current = undefined;
            }, delay);
        },
        [saveTask],
    );

    const updateHistory = useCallback(
        async (
            id: string,
            dataPath: string,
            repoKey: string,
            folderKey?: string,
            noteKey?: string,
        ) => {
            if (folderKey) {
                if (noteKey) {
                    setHistories(
                        produce(histories, (draft) => {
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
                        }),
                    );
                } else {
                    setHistories(
                        produce(histories, (draft) => {
                            if (!draft[id].repos_record) draft[id].repos_record = {};
                            if (!draft[id].repos_record[repoKey]) {
                                draft[id].repos_record[repoKey] = {
                                    cur_folder_key: folderKey,
                                    folders: {},
                                };
                            } else {
                                draft[id].repos_record[repoKey].cur_folder_key = folderKey;
                            }
                        }),
                    );
                }
            } else {
                setHistories(
                    produce(histories, (draft) => {
                        draft[id].cur_repo_key = repoKey;
                    }),
                );
            }

            await addSaveTask(id, dataPath, 1200);
        },
        [histories, addSaveTask],
    );

    return { histories, addHistory, updateHistory };
};

export default useHistory;
