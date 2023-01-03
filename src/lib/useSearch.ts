import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '../GlobalProvider';
import { t } from 'i18next';
import MiniSearch, { AsPlainObject, SearchResult } from 'minisearch';
import { notes } from './notes';
import { whalesnoteObjType } from '../commonType';

const useSearch = () => {
    const {
        curDataPath,
        showSearchPanel,
        whalesnote,
        setShowSearchPanel,
        setShowSearchResultHighlight,
        switchNote,
    } = useContext(GlobalContext);

    const miniSearch = useRef<MiniSearch | null>();

    const searchModuleInitialized = useRef<boolean>(false);
    const dictionaryLoaded = useRef<boolean>(false);
    const [showInitTips, setShowInitTips] = useState(false);
    const [initProgress, setInitProgress] = useState(0);

    const [showUpdateIndexBtn, setShowUpdateIndexBtn] = useState(false);
    const [needGenerateIndex, setNeedGenerateIndex] = useState(true);
    const [showWaitingMask, setShowWaitingMask] = useState(false);

    const [word, setWord] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [curSearchResultIndex, setCurSearchResultIndex] = useState(-1);

    const querySearchResult = (word: string, type: string) => {
        if (!miniSearch.current) return [];
        return miniSearch.current.search(word, {
            filter: (result: SearchResult) => result.type === type,
        });
    };

    const searchCommit = useCallback(() => {
        if (word === '' || word === '　') {
            setSearchResults([]);
            return;
        }
        const search_result = querySearchResult(word, 'note');
        setSearchResults(search_result);
    }, [word, querySearchResult, setSearchResults]);

    useEffect(() => {
        setShowSearchResultHighlight(false);
        setCurSearchResultIndex(-1);
        if (word === '') {
            setShowSearchPanel(false);
            setSearchResults([]);
            return;
        }
        if (searchModuleInitialized.current) searchCommit();
    }, [word]);

    const nextSearchResult = useCallback(() => {
        if (curSearchResultIndex < searchResults.length - 1) {
            setCurSearchResultIndex((_curSearchResultIndex) => _curSearchResultIndex + 1);
        }
    }, [curSearchResultIndex, searchResults, setCurSearchResultIndex]);

    const prevSearchResult = useCallback(() => {
        if (curSearchResultIndex > 0) {
            setCurSearchResultIndex((_curSearchResultIndex) => _curSearchResultIndex - 1);
        }
    }, [curSearchResultIndex, setCurSearchResultIndex]);

    useEffect(() => {
        if (curSearchResultIndex >= 0 && curSearchResultIndex < searchResults.length) {
            setShowSearchResultHighlight(true);
            /* eslint-disable */
            const id = searchResults[curSearchResultIndex]['id'];
            /* eslint-enable */
            const arr = id.split('-');
            switchNote(arr[0], arr[1], arr[2]);
        }
    }, [curSearchResultIndex]);

    const loadDictionary = useCallback(async () => {
        if (!dictionaryLoaded.current) {
            await window.electronAPI.loadNodejiebaDict();
            dictionaryLoaded.current = true;
        }
    }, []);

    const loadSearchJson = useCallback(async () => {
        window.electronAPI
            .readJsonAsync({
                file_path: `${curDataPath}/search.json`,
            })
            .then((search: AsPlainObject) => {
                setInitProgress(75);
                setNeedGenerateIndex(false);
                setTimeout(() => {
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
                    setInitProgress(100);
                    setShowUpdateIndexBtn(true);
                    setShowInitTips(false);
                    searchModuleInitialized.current = true;
                    searchCommit();
                }, 50);
            })
            .catch((err: false) => {
                setShowUpdateIndexBtn(true);
                setNeedGenerateIndex(true);
                setShowInitTips(false);
                searchModuleInitialized.current = true;
                miniSearch.current = null;
            });
    }, [nextSearchResult, searchCommit, setInitProgress, setNeedGenerateIndex, setShowInitTips]);

    const initSearchModule = useCallback(async () => {
        if (!searchModuleInitialized.current && curDataPath) {
            setShowInitTips(true);
            setInitProgress(10);
            setTimeout(async () => {
                await loadDictionary();
                setInitProgress(35);
                await loadSearchJson();
            }, 20);
        }
    }, [curDataPath, loadDictionary, loadSearchJson, setInitProgress, setShowInitTips]);

    useEffect(() => {
        (async () => {
            if (showSearchPanel) {
                await initSearchModule();
            }
        })();
    }, [showSearchPanel]);

    const updateMiniSearch = useCallback(() => {
        setShowWaitingMask(true);

        setTimeout(async () => {
            await loadDictionary();
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

            setNeedGenerateIndex(false);
            setShowWaitingMask(false);
            searchCommit();
        }, 50);
    }, [curDataPath, whalesnote, notes, searchCommit, setNeedGenerateIndex, setShowWaitingMask]);

    return [
        curSearchResultIndex,
        initProgress,
        needGenerateIndex,
        searchResults,
        searchModuleInitialized,
        showWaitingMask,
        showInitTips,
        showUpdateIndexBtn,
        nextSearchResult,
        prevSearchResult,
        setWord,
        setCurSearchResultIndex,
        updateMiniSearch,
    ] as const;
};

export default useSearch;
