import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '../GlobalProvider';
import MiniSearch, { AsPlainObject, SearchResult } from 'minisearch';
import { notes, fetchNotesInAllRepo } from './notes';

const useSearch = () => {
    const { curDataPath, whalenote } = useContext(GlobalContext);

    const searchFileJson = useRef<AsPlainObject | false>(false);
    const miniSearch = useRef<MiniSearch | null>();
    const loadDictFinish = useRef<boolean>(false);
    const [showUpdateIndexTips, setShowUpdateIndexTips] = useState(true);
    const [showWaitingMask, setShowWaitingMask] = useState(false);
    const [showLoadingSearch, setShowLoadingSearch] = useState(false);

    useEffect(() => {
        if (curDataPath) {
            window.electronAPI
                .readJsonAsync({
                    file_path: `${curDataPath}/search.json`,
                })
                .then((search: AsPlainObject) => {
                    searchFileJson.current = search;
                    setShowUpdateIndexTips(false);
                })
                .catch((err: false) => {
                    setShowUpdateIndexTips(true);
                    miniSearch.current = null;
                });
        }
    }, [curDataPath]);

    const loadDict = useCallback(async () => {
        if (!loadDictFinish.current) {
            await window.electronAPI.loadNodejiebaDict();
            loadDictFinish.current = true;
        }
    }, []);

    const loadSearchFileJson = useCallback(async () => {
        if (searchFileJson.current) {
            setShowUpdateIndexTips(false);
            setShowLoadingSearch(true);
            setTimeout(async () => {
                if (searchFileJson.current) {
                    await loadDict();
                    miniSearch.current = MiniSearch.loadJS(searchFileJson.current, {
                        fields: ['title', 'content'],
                        storeFields: ['id', 'type', 'title', 'folder_name'],
                        tokenize: (string, _fieldName) => {
                            const result = window.electronAPI.nodejieba({
                                word: string,
                            });
                            return result;
                        },
                        searchOptions: {
                            boost: { title: 2 },
                            fuzzy: 0.2,
                            tokenize: (string: string) => {
                                let result = window.electronAPI.nodejieba({
                                    word: string,
                                });
                                result = result.filter((w: string) => w !== ' ');
                                return result;
                            },
                        },
                    });
                    searchFileJson.current = false;
                    setShowLoadingSearch(false);
                }
            }, 200);
        }
    }, [setShowUpdateIndexTips, setShowLoadingSearch]);

    const updateMiniSearch = useCallback(() => {
        setShowWaitingMask(true);

        setTimeout(async () => {
            await fetchNotesInAllRepo(curDataPath, whalenote);

            const documents: {
                id: string;
                type: string;
                title: string;
                folder_name: string;
                content: string;
            }[] = [];
            Object.keys(notes).forEach((repo_key: string) => {
                const folders_obj = whalenote.repos_obj[repo_key].folders_obj;
                Object.keys(notes[repo_key]).forEach((folder_key: string) => {
                    const folder_name = folders_obj[folder_key].folder_name;
                    Object.keys(notes[repo_key][folder_key]).forEach((note_key: string) => {
                        const id = `${repo_key}-${folder_key}-${note_key}`;
                        let title =
                            whalenote.repos_obj[repo_key]?.folders_obj &&
                            whalenote.repos_obj[repo_key]?.folders_obj[folder_key]?.notes_obj
                                ? whalenote.repos_obj[repo_key]?.folders_obj[folder_key]?.notes_obj[
                                      note_key
                                  ]?.title || ''
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
            await loadDict();
            miniSearch.current = new MiniSearch({
                fields: ['title', 'content'],
                storeFields: ['id', 'type', 'title', 'folder_name'],
                tokenize: (string, _fieldName) => {
                    const result: string[] = window.electronAPI.nodejieba({
                        word: string,
                    });
                    return result;
                },
                searchOptions: {
                    boost: { title: 2 },
                    fuzzy: 0.2,
                    tokenize: (string: string) => {
                        let result = window.electronAPI.nodejieba({
                            word: string,
                        });
                        result = result.filter((w: string) => w !== ' ');
                        return result;
                    },
                },
            });
            miniSearch.current.addAll(documents);

            await window.electronAPI.writeStr({
                file_path: `${curDataPath}/search.json`,
                str: JSON.stringify(miniSearch.current),
            });

            setShowUpdateIndexTips(false);
            setShowWaitingMask(false);
        }, 200);
    }, [
        curDataPath,
        whalenote,
        notes,
        setShowUpdateIndexTips,
        setShowWaitingMask,
        fetchNotesInAllRepo,
    ]);

    const searchNote = (word: string) => {
        if (!miniSearch.current) return [];
        return miniSearch.current.search(word, {
            filter: (result: SearchResult) => result.type === 'note',
        });
    };

    return [
        showUpdateIndexTips,
        showWaitingMask,
        showLoadingSearch,
        loadSearchFileJson,
        updateMiniSearch,
        searchNote,
    ] as const;
};

export default useSearch;
