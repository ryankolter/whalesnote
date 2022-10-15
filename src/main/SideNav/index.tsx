const { ipcRenderer } = window.require('electron');
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';
import cryptoRandomString from 'crypto-random-string';

import FolderList from './FolderList';
import NoteList from './NoteList';
import GlobalMenu from '../GlobalMenu';
import WaitingMaskStatic from '../../components/WaitingMaskStatic';

import useSearch from '../../lib/useSearch';
import useData from '../../lib/useData';

import searchIcon from '../../resources/icon/searchIcon.svg';
import menuBtnIcon from '../../resources/icon/menuBtnIcon.svg';
import { useDropAnimation } from '@dnd-kit/core/dist/components/DragOverlay/hooks';

type SideNavProps = Record<string, unknown>;

const SideNav: React.FC<SideNavProps> = ({}) => {
    console.log('SideNav render');
    const {
        curDataPath,
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
        setFocus,
        keySelect,
        setKeySelect,
    } = useContext(GlobalContext);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const resizeFolderOffsetX = useRef<number>(0);
    const resizeNoteOffsetX = useRef<number>(0);

    const [folderWidth, setFolderWidth] = useState(
        Number(window.localStorage.getItem('folder_width')) || 186
    );
    const [noteWidth, setNoteWidth] = useState(
        Number(window.localStorage.getItem('note_width')) || 250
    );
    const [word, setWord] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchPanel, setShowSearchPanel] = useState(false);
    const [showGlobalMenu, setShowGlobalMenu] = useState(false);

    const [showUpdateIndexTips, showWaitingMask, updateMiniSearch, searchNote] = useSearch();

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

    return (
        <LeftPanel className={'left-panel-color'}>
            <GlobalMenu showGlobalMenu={showGlobalMenu} setShowGlobalMenu={setShowGlobalMenu} />
            <ToolBar className="child-border-color">
                {/* <MenuIcon onClick={() => setShowGlobalMenu(true)}>
                    <MenuIconImg src={menuBtnIcon} alt="" />
                </MenuIcon> */}
                <Search>
                    <SearchIcon>
                        <SearchIconImg src={searchIcon} alt="" />
                    </SearchIcon>
                    <SearchInput
                        className="search-input"
                        ref={searchInputRef}
                        onChange={handleSearchInputChange}
                        onKeyDown={handleSearchInputEnter}
                        onFocus={handleSearchInputFocus}
                        placeholder="搜索"
                    />
                </Search>
                {showSearchPanel ? (
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
                    <FolderList width={folderWidth} />
                    <ResizeFolderWidth
                        left={folderWidth}
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
                    ></ResizeFolderWidth>
                    <NoteList width={noteWidth} />
                    <ResizeNoteWidth
                        left={folderWidth + noteWidth}
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
                    ></ResizeNoteWidth>
                </List>
            </SelectArea>
            <WaitingMaskStatic show={showWaitingMask} word={'请等待......'}></WaitingMaskStatic>
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
    padding: '10px 30px 10px 40px',
    borderBottomWidth: '1.5px',
    borderBottomStyle: 'solid',
});

const MenuIcon = styled.div({
    width: '26px',
    height: '18px',
    padding: '10px',
    cursor: 'pointer',
});

const MenuIconImg = styled.img({
    width: '26px',
    height: '18px',
    filter: 'invert(65%) sepia(0%) saturate(593%) hue-rotate(346deg) brightness(93%) contrast(77%)',
});

const Search = styled.div({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: '1',
    minWidth: '0',
});

const SearchIcon = styled.div({
    width: '14px',
    height: '14px',
    marginBottom: '6px',
});

const SearchIconImg = styled.img({
    width: '14px',
    height: '14px',
});

const SearchInput = styled.input({
    border: 'none',
    outline: 'none',
    fontFamily: 'PingFang SC',
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '20px',
    letterSpacing: '1px',
    width: '100%',
    padding: '9px 0 9px 20px',
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

export default SideNav;
