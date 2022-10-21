const { ipcRenderer } = window.require('electron');
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '../GlobalProvider';
import cryptoRandomString from 'crypto-random-string';
import MiniSearch from 'minisearch';

const useSearch = () => {
    const { curDataPath, whalenote, repos_obj, notes, allRepoNotesFetch, setFocus } =
        useContext(GlobalContext);

    const miniSearch = useRef<any>();
    const [showUpdateIndexTips, setShowUpdateIndexTips] = useState(true);
    const [showWaitingMask, setShowWaitingMask] = useState(false);

    useEffect(() => {
        if (curDataPath) {
            const search = ipcRenderer.sendSync('readJson', {
                file_path: `${curDataPath}/search.json`,
            });
            if (search) {
                setShowUpdateIndexTips(false);
                miniSearch.current = MiniSearch.loadJS(search, {
                    fields: ['title', 'content'],
                    storeFields: ['id', 'type', 'title', 'folder_name'],
                    tokenize: (string, _fieldName) => {
                        const result = ipcRenderer.sendSync('nodejieba', {
                            word: string,
                        });
                        return result;
                    },
                    searchOptions: {
                        boost: { title: 2 },
                        fuzzy: 0.2,
                        tokenize: (string: string) => {
                            let result = ipcRenderer.sendSync('nodejieba', {
                                word: string,
                            });
                            result = result.filter((w: string) => w !== ' ');
                            return result;
                        },
                    },
                });
            } else {
                miniSearch.current = null;
            }
            setTimeout(() => {
                setFocus(
                    cryptoRandomString({
                        length: 24,
                        type: 'alphanumeric',
                    })
                );
            }, 0);
        }
    }, [curDataPath]);

    const updateMiniSearch = useCallback(() => {
        console.log('updateMiniSearch begin');
        setShowWaitingMask(true);

        setTimeout(() => {
            allRepoNotesFetch(curDataPath, whalenote, repos_obj);

            const documents: any = [];
            Object.keys(notes).forEach((repo_key: string) => {
                const folders_obj = repos_obj[repo_key].folders_obj;
                Object.keys(notes[repo_key]).forEach((folder_key: string) => {
                    const folder_name = folders_obj[folder_key].folder_name;
                    Object.keys(notes[repo_key][folder_key]).forEach((note_key: string) => {
                        const id = `${repo_key}-${folder_key}-${note_key}`;
                        let title =
                            repos_obj[repo_key]?.folders_obj &&
                            repos_obj[repo_key]?.folders_obj[folder_key]?.notes_obj
                                ? repos_obj[repo_key]?.folders_obj[folder_key]?.notes_obj[note_key]
                                      ?.title || ''
                                : '';
                        if (title === '新建文档') title = '';
                        const content = notes[repo_key][folder_key][note_key];
                        documents.push({
                            id,
                            type: 'note',
                            title,
                            folder_name,
                            content,
                        });
                    });
                });
            });

            miniSearch.current = new MiniSearch({
                fields: ['title', 'content'],
                storeFields: ['id', 'type', 'title', 'folder_name'],
                tokenize: (string, _fieldName) => {
                    const result: any = ipcRenderer.sendSync('nodejieba', {
                        word: string,
                    });
                    return result;
                },
                searchOptions: {
                    boost: { title: 2 },
                    fuzzy: 0.2,
                    tokenize: (string: string) => {
                        let result = ipcRenderer.sendSync('nodejieba', {
                            word: string,
                        });
                        result = result.filter((w: string) => w !== ' ');
                        return result;
                    },
                },
            });
            miniSearch.current.addAll(documents);

            ipcRenderer.sendSync('writeStr', {
                file_path: `${curDataPath}/search.json`,
                str: JSON.stringify(miniSearch.current),
            });

            setShowUpdateIndexTips(false);
            setShowWaitingMask(false);

            console.log('updateMiniSearch success');
        }, 200);
    }, [
        curDataPath,
        whalenote,
        repos_obj,
        notes,
        setShowUpdateIndexTips,
        setShowWaitingMask,
        allRepoNotesFetch,
    ]);

    const searchNote = (word: string) => {
        if (!miniSearch.current) return [];
        return miniSearch.current.search(word, {
            filter: (result: any) => result.type === 'note',
        });
    };

    return [showUpdateIndexTips, showWaitingMask, updateMiniSearch, searchNote] as const;
};

export default useSearch;
