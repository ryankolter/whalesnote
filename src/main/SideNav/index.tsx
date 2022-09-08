import { useState, useCallback, useEffect, useRef, useMemo, useContext } from 'react';
import cryptoRandomString from 'crypto-random-string';
import styled from '@emotion/styled';
import DirectoryBtn from './DirectoryBtn';
import FolderList from './FolderList';
import NoteList from './NoteList';

import initData from '../../lib/init';

import MiniSearch from 'minisearch';

import { GlobalContext } from '../../GlobalProvider';

const { ipcRenderer } = window.require('electron');

const SideNav: React.FC<SideNavProps> = ({
    keySelect,
    setFocus,
    setBlur,
    setKeySelect,
    setShowWaitingMask,
}) => {
    console.log('SideNav render');
    const {
        dataPath,
        setDataPath,
        dxnote,
        initDxnote,
        repoSwitch,
        folderSwitch,
        noteSwitch,
        currentNoteKey,
        repos_obj,
        initRepo,
        repoNotesFetch,
        folderNotesFetch,
        initNotes,
    } = useContext(GlobalContext);

    const miniSearch = useRef<any>();

    const [folderWidth, setFolderWidth] = useState(130);
    const [noteWidth, setNoteWidth] = useState(200);
    const [word, setWord] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchPanel, setShowSearchPanel] = useState(false);
    const [showAddPathTips, setShowAddPathTips] = useState(false);
    const [showUpdateIndexTips, setShowUpdateIndexTips] = useState(true);

    useEffect(() => {
        const new_data = initData(dataPath);
        if (new_data) {
            initDxnote(new_data.dxnote);
            initRepo(new_data.repos);
            initNotes(new_data.notes);
            const search = ipcRenderer.sendSync('readJson', {
                file_path: `${dataPath}/search.json`,
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
        } else {
            setShowAddPathTips(true);
        }
    }, []);

    const updateMiniSearch = useCallback(() => {
        console.log('updateMiniSearch begin');
        setShowWaitingMask(true);

        const all_notes = {};
        const repos_key = dxnote.repos_key;
        repos_key.forEach((repo_key: string) => {
            if (!all_notes[repo_key]) {
                all_notes[repo_key] = {};
            }
            const folders_key = repos_obj[repo_key].folders_key;
            folders_key.forEach((folder_key: string) => {
                if (!all_notes[repo_key][folder_key]) {
                    const folder_info = ipcRenderer.sendSync('readJson', {
                        file_path: `${dataPath}/${repo_key}/${folder_key}/folder_info.json`,
                    });
                    if (folder_info && folder_info.notes_obj) {
                        all_notes[repo_key][folder_key] = {};
                        Object.keys(folder_info.notes_obj).forEach((note_key) => {
                            const note_info = ipcRenderer.sendSync('readCson', {
                                file_path: `${dataPath}/${repo_key}/${folder_key}/${note_key}.cson`,
                            });
                            if (note_info) {
                                all_notes[repo_key][folder_key][note_key] = note_info.content;
                            }
                        });
                    }
                }
            });
        });

        const documents: any = [];
        Object.keys(all_notes).forEach((repo_key: string) => {
            const folders_obj = repos_obj[repo_key].folders_obj;
            Object.keys(all_notes[repo_key]).forEach((folder_key: string) => {
                const folder_name = folders_obj[folder_key].folder_name;
                Object.keys(all_notes[repo_key][folder_key]).forEach((note_key: string) => {
                    const id = `${repo_key}-${folder_key}-${note_key}`;
                    let title =
                        repos_obj[repo_key].folders_obj[folder_key].notes_obj[note_key].title;
                    if (title === '新建文档') title = '';
                    const content = all_notes[repo_key][folder_key][note_key];
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
        miniSearch.current.addAll(documents);

        ipcRenderer.sendSync('writeJsonStr', {
            file_path: `${dataPath}/search.json`,
            str: JSON.stringify(miniSearch.current),
        });

        setShowUpdateIndexTips(false);
        setShowWaitingMask(false);

        console.log('updateMiniSearch success');
    }, [dataPath, dxnote, repos_obj, setShowUpdateIndexTips, setShowWaitingMask]);

    const searchNote = (word: string) => {
        if (!miniSearch.current) return [];
        return miniSearch.current.search(word, {
            filter: (result: any) => result.type === 'note',
        });
    };

    useMemo(() => {
        ipcRenderer.on('selectedFolder', (event: any, path: string) => {
            window.localStorage.setItem('dxnote_data_path', path);
            setDataPath(path);
        });
    }, [setDataPath]);

    const addDataPath = () => {
        ipcRenderer.send('open-directory-dialog');
    };

    const handleSearchInputChange = useCallback(
        (event: any) => {
            setWord(event.target.value);
            if (!showSearchPanel) setShowSearchPanel(true);
        },
        [setWord, showSearchPanel, setShowSearchPanel]
    );

    const handleSearchInputEnter = useCallback(
        (event: any) => {
            if (event.keyCode === 13) {
                setWord(event.target.value);
                if (!showSearchPanel) setShowSearchPanel(true);
            }
        },
        [setWord, showSearchPanel, setShowSearchPanel]
    );

    const handleSearchInputFocus = useCallback(() => {
        if (!showSearchPanel) setShowSearchPanel(true);
    }, [showSearchPanel, setShowSearchPanel]);

    const search = useCallback(() => {
        if (word === '' || word === '　') {
            setSearchResults([]);
            return;
        }
        if (!showSearchPanel) setShowSearchPanel(true);
        const search_result = searchNote(word);
        setSearchResults(search_result);
    }, [word, showSearchPanel, setShowSearchPanel, setSearchResults, searchNote]);

    const resultSwitch = useCallback(
        (id: string) => {
            const arr = id.split('-');
            repoSwitch(arr[0]);
            folderSwitch(arr[0], arr[1]);
            noteSwitch(arr[2]);
        },
        [repoSwitch, folderSwitch, noteSwitch]
    );

    useEffect(() => {
        if (word === '') {
            setShowSearchPanel(false);
            setSearchResults([]);
            return;
        }
        search();
        console.log(word);
    }, [word]);

    return (
        <LeftPanel>
            <ToolBar>
                <DirectoryBtnArea>
                    {dataPath ? (
                        <DirectoryBtn
                            data_path={dataPath}
                            addDataPath={addDataPath}
                            panelWidth={folderWidth + noteWidth}
                        />
                    ) : (
                        <PathAddBtn
                            onClick={() => {
                                addDataPath();
                            }}
                        >
                            设置数据目录
                        </PathAddBtn>
                    )}
                </DirectoryBtnArea>
                {dataPath ? (
                    <Search>
                        <SearchInput
                            onChange={handleSearchInputChange}
                            onKeyDown={handleSearchInputEnter}
                            onFocus={handleSearchInputFocus}
                            placeholder="搜索"
                        />
                        {showSearchPanel ? (
                            <SearchPanel>
                                <SearchTool>
                                    <UpdateIndex>
                                        <UpdateIndexBtn
                                            onClick={() => {
                                                updateMiniSearch();
                                                search();
                                            }}
                                        >
                                            {showUpdateIndexTips ? (
                                                <div>生成搜索树</div>
                                            ) : (
                                                <div>更新搜索树</div>
                                            )}
                                        </UpdateIndexBtn>
                                    </UpdateIndex>
                                    <CloseSearchPanelBtn
                                        onClick={() => {
                                            setShowSearchPanel(false);
                                        }}
                                    >
                                        x
                                    </CloseSearchPanelBtn>
                                </SearchTool>
                                {showUpdateIndexTips ? (
                                    <UpdateIndexTips>
                                        <div>搜索功能需要搜索树</div>
                                        <div>请点击上方生成</div>
                                    </UpdateIndexTips>
                                ) : (
                                    <></>
                                )}
                                <SearchResultList>
                                    {searchResults && searchResults.length > 0 ? (
                                        searchResults.map((result: any) => {
                                            return (
                                                <SearchResult
                                                    onClick={() => {
                                                        resultSwitch(result.id);
                                                    }}
                                                    key={result.id}
                                                    style={{
                                                        backgroundColor:
                                                            currentNoteKey ===
                                                            result.id.split('-')[2]
                                                                ? '#3a404c'
                                                                : '',
                                                    }}
                                                >
                                                    <FolderName>{result.folder_name}</FolderName>
                                                    <Seperator>&gt;</Seperator>
                                                    <TitleName>{result.title}</TitleName>
                                                </SearchResult>
                                            );
                                        })
                                    ) : (
                                        <></>
                                    )}
                                </SearchResultList>
                            </SearchPanel>
                        ) : (
                            <></>
                        )}
                    </Search>
                ) : (
                    <></>
                )}
            </ToolBar>
            <SelectArea>
                <List>
                    <FolderList keySelect={keySelect} setFocus={setFocus} width={folderWidth} />
                    <NoteList
                        keySelect={keySelect}
                        setFocus={setFocus}
                        setKeySelect={setKeySelect}
                        width={noteWidth}
                    />
                </List>
            </SelectArea>
        </LeftPanel>
    );
};

const LeftPanel = styled.div({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '10px',
    boxSizing: 'border-box',
});

const ToolBar = styled.div({
    display: 'flex',
    margin: '0 0 0 5px',
});

const Search = styled.div({
    position: 'relative',
    flex: '1',
    minWidth: '0',
});

const SearchInput = styled.input({
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    lineHeight: '20px',
    letterSpacing: '1px',
    width: '100%',
    padding: '10px',
    boxSizing: 'border-box',
});

const SearchPanel = styled.div({
    position: 'absolute',
    top: '40px',
    left: '-62px',
    display: 'flex',
    flexDirection: 'column',
    width: 'calc(100% + 62px)',
    height: 'calc(90vh)',
    padding: '10px',
    boxSizing: 'border-box',
    border: '1px solid rgba(58, 64, 76, 0.8)',
    backgroundColor: '#2C3033',
    zIndex: '999999',
});

const SearchTool = styled.div({
    display: 'flex',
    alignItem: 'center',
});

const CloseSearchPanelBtn = styled.div({
    width: '20px',
    height: '20px',
    lineHeight: '18px',
    fontSize: '20px',
    color: '#939395',
    padding: '5px 10px',
    margin: '0 0 2px 0',
    cursor: 'pointer',
});

const UpdateIndex = styled.div({
    display: 'flex',
    flexDirection: 'row',
    alignItem: 'center',
    flex: '1',
    minWidth: '0',
});

const UpdateIndexBtn = styled.div({
    display: 'flex',
    alignItem: 'center',
    justifyContent: 'center',
    height: '28px',
    lineHeight: '28px',
    fontSize: '14px',
    padding: '0 8px',
    borderRadius: ' 4px',
    color: '#939395',
    backgroundColor: 'rgb(58, 64, 76)',
    cursor: 'pointer',
});

const UpdateIndexTips = styled.div({
    position: 'absolute',
    left: '10px',
    top: '40px',
    color: '#939395',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '140px',
    marginTop: '20px',
    fontSize: '14px',
    border: '1px dotted rgba(58, 64, 76)',
    padding: '5px 10px',
    borderRadius: '5px',
    background: 'rgba(47, 51, 56)',
});

const SearchResultList = styled.div({
    flex: '1',
    minHeight: '0',
    color: '#939395',
});

const SearchResult = styled.div({
    display: 'flex',
    height: '36px',
    lineHeight: '36px',
    padding: '0 10px',
    fontSize: '14px',
    color: '#939395',
    cursor: 'pointer',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
});

const FolderName = styled.div({
    width: '70px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
});

const Seperator = styled.div({
    width: '25px',
    marginLeft: '5px',
    display: 'flex',
});

const TitleName = styled.div({
    flex: '1',
    minWidth: '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
});

const SelectArea = styled.div({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    flex: '1',
    minHeight: '0',
    margin: '10px 0',
});

const DirectoryBtnArea = styled.div();

const PathAddBtn = styled.div({
    position: 'relative',
    height: '32px',
    lineHeight: '32px',
    display: 'flex',
    alignItem: 'center',
    justifyContent: 'center',
    padding: '0 10px',
    marginTop: '8px',
    borderRadius: '4px',
    color: '#939395',
    backgroundColor: 'rgb(58, 64, 76)',
    cursor: 'pointer',
});

const List = styled.div({
    display: 'flex',
    alignItem: 'center',
    flex: '1',
    minHeight: '0',
    borderBottomLeftRadius: '4px',
    padding: '0 0 0 5px',
});

type SideNavProps = {
    keySelect: boolean;
    setFocus: (focus: string) => void;
    setBlur: (focus: string) => void;
    setKeySelect: (keySelect: boolean) => void;
    setShowWaitingMask: (showWaitingMask: boolean) => void;
};

export default SideNav;
