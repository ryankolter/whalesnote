import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '../GlobalProvider';
import { t } from 'i18next';
import MiniSearch, { AsPlainObject, SearchResult } from 'minisearch';
import { notes } from './notes';
import { whalesnoteObjType } from '../commonType';

const useSearch = () => {
    const { curDataPath, whalesnote } = useContext(GlobalContext);

    const haveLoadSearchJson = useRef<boolean>(false);
    const miniSearch = useRef<MiniSearch | null>();
    const loadDictFinish = useRef<boolean>(false);
    const [showUpdateIndexTips, setShowUpdateIndexTips] = useState(true);
    const [showWaitingMask, setShowWaitingMask] = useState(false);
    const [showLoadingSearch, setShowLoadingSearch] = useState(false);

    const loadDict = useCallback(async () => {
        if (!loadDictFinish.current) {
            await window.electronAPI.loadNodejiebaDict();
            loadDictFinish.current = true;
        }
    }, []);

    const loadSearchFileJson = useCallback(async () => {
        if (!haveLoadSearchJson.current) {
            setShowLoadingSearch(true);
            setTimeout(async () => {
                if (curDataPath) {
                    await loadDict();
                    window.electronAPI
                        .readJsonAsync({
                            file_path: `${curDataPath}/search.json`,
                        })
                        .then((search: AsPlainObject) => {
                            setShowUpdateIndexTips(false);
                            miniSearch.current = MiniSearch.loadJS(search, {
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
                            haveLoadSearchJson.current = true;
                            setShowLoadingSearch(false);
                        })
                        .catch((err: false) => {
                            setShowUpdateIndexTips(true);
                            haveLoadSearchJson.current = true;
                            setShowLoadingSearch(false);
                            miniSearch.current = null;
                        });
                }
            }, 200);
        }
    }, [curDataPath, setShowUpdateIndexTips, setShowLoadingSearch]);

    const updateMiniSearch = useCallback(() => {
        setShowWaitingMask(true);

        setTimeout(async () => {
            await loadDict();
            const whalesnote_info = await window.electronAPI.readJsonSync({
                file_path: `${curDataPath}/whalesnote_info.json`,
            });

            const newWhalesnote: whalesnoteObjType = {
                repos_key: [],
                repos_obj: {},
            };

            for await (const repo_key of whalesnote_info.repos_key) {
                const repo_info = await window.electronAPI.readJsonSync({
                    file_path: `${curDataPath}/${repo_key}/repo_info.json`,
                });
                if (repo_info) {
                    newWhalesnote.repos_key.push(repo_key);
                    newWhalesnote.repos_obj[repo_key] = {
                        repo_name: repo_info.repo_name,
                        folders_key: repo_info.folders_key,
                        folders_obj: {},
                    };
                    for await (const folder_key of repo_info.folders_key) {
                        const folder_info = await window.electronAPI.readJsonSync({
                            file_path: `${curDataPath}/${repo_key}/${folder_key}/folder_info.json`,
                        });
                        folder_info.folder_name = repo_info.folders_obj[folder_key].folder_name;
                        if (folder_info) {
                            newWhalesnote.repos_obj[repo_key].folders_obj[folder_key] = folder_info;
                        }
                    }
                }
            }

            const documents: {
                id: string;
                type: string;
                title: string;
                folder_name: string;
                content: string;
            }[] = [];

            for (const repo_key of newWhalesnote.repos_key) {
                if (newWhalesnote.repos_obj[repo_key]) {
                    const folders_obj = newWhalesnote.repos_obj[repo_key].folders_obj;
                    for (const folder_key of newWhalesnote.repos_obj[repo_key].folders_key) {
                        if (folders_obj[folder_key]) {
                            const folder_name = folders_obj[folder_key].folder_name;
                            for (const note_key of folders_obj[folder_key].notes_key) {
                                const content = await window.electronAPI.readMdSync({
                                    file_path: `${curDataPath}/${repo_key}/${folder_key}/${note_key}.md`,
                                });
                                if (content) {
                                    const id = `${repo_key}-${folder_key}-${note_key}`;
                                    let title =
                                        folders_obj[folder_key]?.notes_obj[note_key]?.title || '';
                                    if (title === t('note.untitled')) title = '';
                                    documents.push({
                                        id,
                                        type: 'note',
                                        title,
                                        folder_name,
                                        content,
                                    });
                                }
                            }
                        }
                    }
                }
            }
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
    }, [curDataPath, whalesnote, notes, setShowUpdateIndexTips, setShowWaitingMask]);

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
