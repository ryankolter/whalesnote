import { useCallback, useEffect, useRef, useState } from 'react';
import { t } from 'i18next';
import MiniSearch, { AsPlainObject, SearchResult } from 'minisearch';
import { WhaleObject } from '@/interface';
import { useDataContext } from '@/context/DataProvider';
import { useAtom, useSetAtom } from 'jotai';
import { searchListFocusedAtom, searchPanelVisibleAtom } from '@/atoms';

const useSearch = () => {
    const setSearchListFocused = useSetAtom(searchListFocusedAtom);

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
        setSearchListFocused(false);
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
                setSearchListFocused(true);
                /* eslint-disable */
                const id = searchResults[index]['id'];
                /* eslint-enable */
                const arr = id.split('-');
                switchNote(arr[0], arr[1], arr[2]);
            }
        },
        [searchResults, setSearchListFocused, switchNote],
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
            if (searchPanelVisible) await initSearchModule();
        })();
    }, [searchPanelVisible]);

    const updateMiniSearch = useCallback(() => {
        setShowWaitingMask(true);

        setTimeout(async () => {
            await loadDictionary();
            const whaleInfo = await window.electronAPI.readJsonSync(
                `${curDataPath}/whalesnote_info.json`,
            );

            const whale: WhaleObject = {
                path: curDataPath,
                repo_keys: [],
                repo_map: {},
            };

            for await (const repo_key of whaleInfo.repo_keys) {
                const repoInfo = await window.electronAPI.readJsonSync(
                    `${curDataPath}/${repo_key}/repo_info.json`,
                );
                if (!repoInfo) continue;

                whale.repo_keys.push(repo_key);
                whale.repo_map[repo_key] = repoInfo;

                for await (const folder_key of repoInfo.folder_keys) {
                    const folderInfo = await window.electronAPI.readJsonSync(
                        `${curDataPath}/${repo_key}/${folder_key}/folder_info.json`,
                    );
                    if (!folderInfo) continue;

                    whale.repo_map[repo_key].folder_map[folder_key] = {
                        ...whale.repo_map[repo_key].folder_map[folder_key],
                        ...folderInfo,
                    };
                }
            }

            const documents: {
                id: string;
                type: string;
                title: string;
                folder_name: string;
                content: string;
            }[] = [];

            let folderMap;
            for (const repoKey of whale.repo_keys) {
                folderMap = whale.repo_map[repoKey].folder_map;
                for (const folderKey of whale.repo_map[repoKey].folder_keys) {
                    for (const noteKey of folderMap[folderKey].note_keys) {
                        const content = await window.electronAPI.readMdSync(
                            `${curDataPath}/${repoKey}/${folderKey}/${noteKey}.md`,
                        );
                        if (!content) continue;

                        let title = folderMap[folderKey]?.note_map[noteKey]?.title || '';
                        if (title === t('note.untitled')) title = '';
                        documents.push({
                            id: `${repoKey}-${folderKey}-${noteKey}`,
                            type: 'note',
                            title,
                            folder_name: folderMap[folderKey].folder_name,
                            content,
                        });
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
