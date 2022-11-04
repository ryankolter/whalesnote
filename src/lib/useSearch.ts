import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '../GlobalProvider';
import cryptoRandomString from 'crypto-random-string';
import MiniSearch, { SearchResult } from 'minisearch';
import { notes, fetchNotesInAllRepo } from './notes';

const useSearch = () => {
    const { curDataPath, whalenote, setFocus } = useContext(GlobalContext);

    const miniSearch = useRef<MiniSearch | null>();
    const [showUpdateIndexTips, setShowUpdateIndexTips] = useState(true);
    const [showWaitingMask, setShowWaitingMask] = useState(false);

    useEffect(() => {
        (async () => {
            if (curDataPath) {
                const search = await window.electronAPI.readJson({
                    file_path: `${curDataPath}/search.json`,
                });
                if (search) {
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
                } else {
                    setShowUpdateIndexTips(true);
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
        })();
    }, [curDataPath]);

    const updateMiniSearch = useCallback(() => {
        console.log('updateMiniSearch begin');
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

            console.log('updateMiniSearch success');
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

    return [showUpdateIndexTips, showWaitingMask, updateMiniSearch, searchNote] as const;
};

export default useSearch;
