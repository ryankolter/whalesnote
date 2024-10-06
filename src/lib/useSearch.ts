import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '../GlobalProvider';
import { t } from 'i18next';
import MiniSearch, { AsPlainObject, SearchResult } from 'minisearch';
import { WhaleObject } from '../commonType';
import { useDataContext } from '@/context/DataProvider';
import { useAtom } from 'jotai';
import { searchPanelVisibleAtom } from '@/atoms';

const useSearch = () => {
    const { setShowSearchResultHighlight } = useContext(GlobalContext);

    const { curDataPath, whalesnote, switchNote } = useDataContext();

    const [searchPanelVisible, setSearchPanelVisible] = useAtom(searchPanelVisibleAtom);

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
            setSearchPanelVisible(false);
            setSearchResults([]);
            return;
        }
        if (searchModuleInitialized.current) searchCommit();
    }, [word]);

    const isInViewPort = useCallback((element: any) => {
        const { top } = element.getBoundingClientRect();
        return top >= 130 && top <= window.innerHeight - 80;
    }, []);

    const switchToResultNote = useCallback(
        (index: number) => {
            if (index >= 0 && index < searchResults.length) {
                setShowSearchResultHighlight(true);
                /* eslint-disable */
                const id = searchResults[index]['id'];
                /* eslint-enable */
                const arr = id.split('-');
                switchNote(arr[0], arr[1], arr[2]);
            }
        },
        [searchResults, setShowSearchResultHighlight, switchNote],
    );

    const clickOnSearchResult = useCallback(
        (index: number) => {
            setTimeout(() => {
                const targetResultEle = document.getElementById(`search-result-item-${index}`);
                if (targetResultEle && !isInViewPort(targetResultEle)) {
                    targetResultEle.scrollIntoView({
                        block: index > curSearchResultIndex ? 'start' : 'end',
                        behavior: 'smooth',
                    });
                }
            }, 50);

            if (index == curSearchResultIndex) {
                switchToResultNote(index);
            }

            setCurSearchResultIndex(index);
        },
        [curSearchResultIndex, setCurSearchResultIndex, switchToResultNote],
    );

    const nextSearchResult = useCallback(() => {
        if (curSearchResultIndex < searchResults.length - 1) {
            setTimeout(() => {
                const nextResultEle = document.getElementById(
                    `search-result-item-${curSearchResultIndex + 1}`,
                );
                if (nextResultEle && !isInViewPort(nextResultEle)) {
                    nextResultEle.scrollIntoView({ block: 'start', behavior: 'smooth' });
                }
            }, 50);

            setCurSearchResultIndex((_curSearchResultIndex) => _curSearchResultIndex + 1);
        }
    }, [curSearchResultIndex, searchResults, setCurSearchResultIndex, isInViewPort]);

    const prevSearchResult = useCallback(() => {
        if (curSearchResultIndex > 0) {
            setTimeout(() => {
                const prevResultEle = document.getElementById(
                    `search-result-item-${curSearchResultIndex - 1}`,
                );
                if (prevResultEle && !isInViewPort(prevResultEle)) {
                    prevResultEle.scrollIntoView({ block: 'end', behavior: 'smooth' });
                }
            }, 50);
            setCurSearchResultIndex((_curSearchResultIndex) => _curSearchResultIndex - 1);
        }
    }, [curSearchResultIndex, setCurSearchResultIndex, isInViewPort]);

    useEffect(() => {
        switchToResultNote(curSearchResultIndex);
    }, [curSearchResultIndex]);

    const loadDictionary = useCallback(async () => {
        if (!dictionaryLoaded.current) {
            await window.electronAPI.loadNodejiebaDict();
            dictionaryLoaded.current = true;
        }
    }, []);

    const loadSearchJson = useCallback(async () => {
        window.electronAPI
            .readJsonAsync(`${curDataPath}/search.json`)
            .then((search: AsPlainObject) => {
                setInitProgress(75);
                setNeedGenerateIndex(false);
                setTimeout(() => {
                    miniSearch.current = MiniSearch.loadJS(search, {
                        fields: ['title', 'content'],
                        storeFields: ['id', 'type', 'title', 'folder_name'],
                        tokenize: (str, _fieldName) => {
                            const result = window.electronAPI.nodejieba(str);
                            return result;
                        },
                        searchOptions: {
                            boost: { title: 2 },
                            fuzzy: 0.2,
                            tokenize: (str: string) => {
                                let result = window.electronAPI.nodejieba(str);
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
            if (searchPanelVisible) {
                await initSearchModule();
            }
        })();
    }, [searchPanelVisible]);

    const updateMiniSearch = useCallback(() => {
        setShowWaitingMask(true);

        setTimeout(async () => {
            await loadDictionary();
            const whalesnote_info = await window.electronAPI.readJsonSync(
                `${curDataPath}/whalesnote_info.json`,
            );

            const newWhalesnote: WhaleObject = {
                path: '',
                repo_keys: [],
                repo_map: {},
            };

            for await (const repo_key of whalesnote_info.repos_key) {
                const repo_info = await window.electronAPI.readJsonSync(
                    `${curDataPath}/${repo_key}/repo_info.json`,
                );
                if (repo_info) {
                    newWhalesnote.repo_keys.push(repo_key);
                    newWhalesnote.repo_map[repo_key] = {
                        repo_name: repo_info.repo_name,
                        folder_keys: repo_info.folders_key,
                        folder_map: {},
                    };
                    for await (const folder_key of repo_info.folders_key) {
                        const folder_info = await window.electronAPI.readJsonSync(
                            `${curDataPath}/${repo_key}/${folder_key}/folder_info.json`,
                        );
                        if (repo_info.folders_obj[folder_key]) {
                            folder_info.folder_name = repo_info.folders_obj[folder_key].folder_name;
                        }
                        if (folder_info) {
                            newWhalesnote.repo_map[repo_key].folder_map[folder_key] = folder_info;
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

            for (const repo_key of newWhalesnote.repo_keys) {
                if (newWhalesnote.repo_map[repo_key]) {
                    const folder_map = newWhalesnote.repo_map[repo_key].folder_map;
                    for (const folder_key of newWhalesnote.repo_map[repo_key].folder_keys) {
                        if (folder_map[folder_key]) {
                            const folder_name = folder_map[folder_key].folder_name;
                            for (const note_key of folder_map[folder_key].note_keys) {
                                const content = await window.electronAPI.readMdSync(
                                    `${curDataPath}/${repo_key}/${folder_key}/${note_key}.md`,
                                );
                                if (content) {
                                    const id = `${repo_key}-${folder_key}-${note_key}`;
                                    let title =
                                        folder_map[folder_key]?.note_map[note_key]?.title || '';
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
                tokenize: (str, _fieldName) => {
                    const result: string[] = window.electronAPI.nodejieba(str);
                    return result;
                },
                searchOptions: {
                    boost: { title: 2 },
                    fuzzy: 0.2,
                    tokenize: (str: string) => {
                        let result = window.electronAPI.nodejieba(str);
                        result = result.filter((w: string) => w !== ' ');
                        return result;
                    },
                },
            });
            miniSearch.current.addAll(documents);

            await window.electronAPI.writeStr(
                `${curDataPath}/search.json`,
                JSON.stringify(miniSearch.current),
            );

            setNeedGenerateIndex(false);
            setShowWaitingMask(false);
            searchCommit();
        }, 50);
    }, [curDataPath, whalesnote, searchCommit, setNeedGenerateIndex, setShowWaitingMask]);

    return [
        curSearchResultIndex,
        initProgress,
        needGenerateIndex,
        searchResults,
        searchModuleInitialized,
        showWaitingMask,
        showInitTips,
        showUpdateIndexBtn,
        clickOnSearchResult,
        nextSearchResult,
        prevSearchResult,
        setWord,
        updateMiniSearch,
    ] as const;
};

export default useSearch;
