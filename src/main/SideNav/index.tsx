import { useState, useCallback, useEffect, useRef, useMemo, useContext } from 'react';
import cryptoRandomString from 'crypto-random-string';
import styled from '@emotion/styled';
import DirectoryBtn from './DirectoryBtn';
import FolderList from './FolderList';
import NoteList from './NoteList';
import GlobalMenu from '../GlobalMenu';
import menuBtnIcon from '../../resources/icon/menuBtnIcon.svg';

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
        notes,
        initRepo,
        allRepoNotesFetch,
        repoNotesFetch,
        folderNotesFetch,
        initNotes,
        numArray,
        setNumArray,
    } = useContext(GlobalContext);

    const miniSearch = useRef<any>();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const resizeFolderOffsetX = useRef<number>(0);
    const resizeNoteOffsetX = useRef<number>(0);

    const [folderWidth, setFolderWidth] = useState(
        Number(window.localStorage.getItem('folder_width')) || 140
    );
    const [noteWidth, setNoteWidth] = useState(
        Number(window.localStorage.getItem('note_width')) || 250
    );
    const [word, setWord] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchPanel, setShowSearchPanel] = useState(false);
    const [showAddPathTips, setShowAddPathTips] = useState(false);
    const [showUpdateIndexTips, setShowUpdateIndexTips] = useState(true);
    const [showGlobalMenu, setShowGlobalMenu] = useState(false);

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
    }, [dataPath]);

    const updateMiniSearch = useCallback(() => {
        console.log('updateMiniSearch begin');
        setShowWaitingMask(true);

        setTimeout(() => {
            allRepoNotesFetch(dataPath, dxnote, repos_obj);

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
                file_path: `${dataPath}/search.json`,
                str: JSON.stringify(miniSearch.current),
            });

            setShowUpdateIndexTips(false);
            setShowWaitingMask(false);

            console.log('updateMiniSearch success');
        }, 200);
    }, [
        dataPath,
        dxnote,
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

    useMemo(() => {
        ipcRenderer.on('checkoutDataPath', (event: any, path: string) => {
            window.localStorage.setItem('dxnote_data_path', path);
            setDataPath(path);
        });
    }, [setDataPath]);

    const addDataPath = () => {
        ipcRenderer.send('open-directory-dialog', {
            response_event_name: 'checkoutDataPath',
        });
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

    const handleKeyDown = useCallback(
        (e: any) => {
            if (process.platform === 'darwin') {
                if (
                    ((e.keyCode >= 65 && e.keyCode <= 72) ||
                        (e.keyCode >= 77 && e.keyCode <= 89)) &&
                    !e.metaKey &&
                    keySelect
                ) {
                    const num = parseInt(e.keyCode);
                    if (numArray.length === 0) {
                        setNumArray((state: any) => state.concat([num]));
                    } else {
                        setNumArray((state: any) => state.concat([num]));
                    }
                }

                if (e.keyCode >= 48 && e.keyCode <= 57 && !e.metaKey && keySelect) {
                    const num = parseInt(e.keyCode);
                    if (numArray.length === 1) {
                        setNumArray((state: any) => state.concat([num]));
                    }
                }

                if (e.keyCode === 70 && e.metaKey && e.shiftKey) {
                    searchInputRef.current?.focus();
                    if (keySelect) setKeySelect(false);
                }

                //esc
                if (e.keyCode === 27) {
                    if (showSearchPanel) {
                        setShowSearchPanel(false);
                    }
                    searchInputRef.current?.blur();
                }
            }
            if (process.platform === 'win32' || process.platform === 'linux') {
                if (
                    ((e.keyCode >= 65 && e.keyCode <= 72) ||
                        (e.keyCode >= 77 && e.keyCode <= 89)) &&
                    !e.ctrlKey &&
                    keySelect
                ) {
                    const num = parseInt(e.keyCode);
                    if (numArray.length === 0) {
                        setNumArray((state: any) => state.concat([num]));
                    } else {
                        setNumArray((state: any) => state.concat([num]));
                    }
                }

                if (e.keyCode >= 48 && e.keyCode <= 57 && !e.ctrlKey && keySelect) {
                    const num = parseInt(e.keyCode);
                    if (numArray.length === 1) {
                        setNumArray((state: any) => state.concat([num]));
                    }
                }

                if (e.keyCode === 70 && e.ctrlKey && e.shiftKey) {
                    searchInputRef.current?.focus();
                    if (keySelect) setKeySelect(false);
                }

                //esc
                if (e.keyCode === 27) {
                    if (showSearchPanel) {
                        setShowSearchPanel(false);
                    }
                    searchInputRef.current?.blur();
                }
            }
        },
        [numArray, keySelect, setKeySelect, showSearchPanel]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    useEffect(() => {
        console.log(showGlobalMenu);
    }, [showGlobalMenu]);

    return (
        <LeftPanel className={'left-panel-color'}>
            <GlobalMenu
                data_path={dataPath}
                addDataPath={addDataPath}
                showGlobalMenu={showGlobalMenu}
                setShowGlobalMenu={setShowGlobalMenu}
            />
            <ToolBar>
                <MenuIcon onClick={() => setShowGlobalMenu(true)}>
                    <MenuIconImg src={menuBtnIcon} alt="" />
                </MenuIcon>

                {/* <DirectoryBtnArea>
                    {dataPath ? (
                        <DirectoryBtn
                            data_path={dataPath}
                            addDataPath={addDataPath}
                            panelWidth={folderWidth + noteWidth}
                        />
                    ) : (
                        <PathAddBtn
                            className="btn-1-bg-color"
                            onClick={() => {
                                addDataPath();
                            }}
                        >
                            设置数据目录
                        </PathAddBtn>
                    )}
                </DirectoryBtnArea> */}
                {dataPath ? (
                    <Search>
                        <SearchInput
                            className="search-input"
                            ref={searchInputRef}
                            onChange={handleSearchInputChange}
                            onKeyDown={handleSearchInputEnter}
                            onFocus={handleSearchInputFocus}
                            placeholder="搜索"
                        />
                    </Search>
                ) : (
                    <></>
                )}
                {dataPath && showSearchPanel ? (
                    <SearchPanel className="float-panel-color ">
                        <SearchTool>
                            <UpdateIndex>
                                <UpdateIndexBtn
                                    className="btn-1-bg-color"
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
                            <UpdateIndexTips className="tips-1-bg-color tips-1-border-color">
                                <div>搜索功能需要搜索树</div>
                                <div>请点击上方生成</div>
                            </UpdateIndexTips>
                        ) : (
                            <></>
                        )}
                        <SearchResultList className="no-scroller">
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
                                                    currentNoteKey === result.id.split('-')[2]
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
            </ToolBar>
            <SelectArea className={'select-area-border'}>
                <List>
                    <FolderList keySelect={keySelect} setFocus={setFocus} width={folderWidth} />
                    <ResizeFolderWidth
                        onDragStart={(e) => {
                            resizeFolderOffsetX.current = e.pageX - folderWidth;
                        }}
                        onDrag={(e) => {
                            if (e.pageX > 0) {
                                const newFolderWidth = e.pageX - resizeFolderOffsetX.current;
                                if (newFolderWidth >= 60 && newFolderWidth <= 400) {
                                    setFolderWidth(newFolderWidth);
                                }
                            }
                        }}
                        onDragEnd={(e) => {
                            window.localStorage.setItem('folder_width', folderWidth.toString());
                        }}
                        draggable="true"
                        left={folderWidth}
                    ></ResizeFolderWidth>
                    <NoteList
                        keySelect={keySelect}
                        setFocus={setFocus}
                        setKeySelect={setKeySelect}
                        width={noteWidth}
                    />
                    <ResizeNoteWidth
                        onDragStart={(e) => {
                            resizeNoteOffsetX.current = e.pageX - noteWidth;
                        }}
                        onDrag={(e) => {
                            if (e.pageX > 0) {
                                const newNoteWidth = e.pageX - resizeNoteOffsetX.current;
                                if (newNoteWidth > 100 && newNoteWidth <= 600) {
                                    setNoteWidth(newNoteWidth);
                                }
                            }
                        }}
                        onDragEnd={(e) => {
                            window.localStorage.setItem('note_width', noteWidth.toString());
                        }}
                        draggable="true"
                        left={folderWidth + noteWidth}
                    ></ResizeNoteWidth>
                </List>
            </SelectArea>
        </LeftPanel>
    );
};

const LeftPanel = styled.div({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    boxSizing: 'border-box',
});

const ToolBar = styled.div({
    position: 'relative',
    display: 'flex',
    padding: '5px 15px 0 10px',
});

const MenuIcon = styled.div({
    width: '26px',
    height: '32px',
    padding: '10px',
    cursor: 'pointer',
});

const MenuIconImg = styled.img({
    width: '26px',
    height: '32px',
    filter: 'invert(65%) sepia(0%) saturate(593%) hue-rotate(346deg) brightness(93%) contrast(77%)',
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
    padding: '16px',
    boxSizing: 'border-box',
});

const SearchPanel = styled.div({
    position: 'absolute',
    top: '55px',
    left: '15px',
    display: 'flex',
    flexDirection: 'column',
    width: 'calc(100% - 15px)',
    height: 'calc(100vh - 55px)',
    padding: '10px',
    boxSizing: 'border-box',
    zIndex: '3000',
});

const SearchTool = styled.div({
    display: 'flex',
    alignItem: 'center',
    marginBottom: '5px',
});

const CloseSearchPanelBtn = styled.div({
    width: '20px',
    height: '20px',
    lineHeight: '18px',
    fontSize: '20px',
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
    cursor: 'pointer',
});

const UpdateIndexTips = styled.div({
    position: 'absolute',
    left: '10px',
    top: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '140px',
    marginTop: '20px',
    fontSize: '14px',
    padding: '5px 10px',
    borderRadius: '5px',
});

const SearchResultList = styled.div({
    flex: '1',
    minHeight: '0',
    overflowY: 'auto',
});

const SearchResult = styled.div({
    display: 'flex',
    height: '36px',
    lineHeight: '36px',
    padding: '0 10px',
    fontSize: '14px',
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
});

const List = styled.div({
    display: 'flex',
    alignItem: 'center',
    flex: '1',
    minHeight: '0',
    borderBottomLeftRadius: '4px',
});

const ResizeFolderWidth = styled.div(
    {
        width: '8px',
        cursor: 'col-resize',
        position: 'absolute',
        top: '0',
        height: '100%',
        zIndex: 1000,
    },
    (props: { left: number }) => ({
        left: props.left - 4,
    })
);

const ResizeNoteWidth = styled.div(
    {
        width: '8px',
        cursor: 'col-resize',
        position: 'absolute',
        top: '0',
        height: '100%',
        zIndex: 1000,
    },
    (props: { left: number }) => ({
        left: props.left - 4,
    })
);

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
    cursor: 'pointer',
});

type SideNavProps = {
    keySelect: boolean;
    setFocus: (focus: string) => void;
    setBlur: (focus: string) => void;
    setKeySelect: (keySelect: boolean) => void;
    setShowWaitingMask: (showWaitingMask: boolean) => void;
};

export default SideNav;
