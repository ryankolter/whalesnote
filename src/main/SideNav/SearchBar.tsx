const { ipcRenderer } = window.require('electron');
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';
import cryptoRandomString from 'crypto-random-string';

import useSearch from '../../lib/useSearch';

import WaitingMaskStatic from '../../components/WaitingMaskStatic';
import searchIcon from '../../resources/icon/searchIcon.svg';

const SearchBar: React.FC<Record<string, unknown>> = ({}) => {
    const {
        repoSwitch,
        folderSwitch,
        noteSwitch,
        currentNoteKey,
        repos_obj,
        keySelect,
        setKeySelect,
    } = useContext(GlobalContext);

    const searchInputRef = useRef<HTMLInputElement>(null);

    const [word, setWord] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [curResultIndex, setCurResultIndex] = useState(-1);
    const [showResultHighlight, setShowResultHighlight] = useState(false);
    const [showSearchPanel, setShowSearchPanel] = useState(false);
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
            setShowResultHighlight(true);
            const arr = id.split('-');
            repoSwitch(arr[0]);
            folderSwitch(arr[0], arr[1]);
            noteSwitch(arr[2]);
        },
        [setShowResultHighlight, repoSwitch, folderSwitch, noteSwitch]
    );

    useEffect(() => {
        setShowResultHighlight(false);
        setCurResultIndex(-1);
        if (word === '') {
            setShowSearchPanel(false);
            setSearchResults([]);
            return;
        }
        search();
    }, [word]);

    const nextSearchResult = useCallback(() => {
        if (curResultIndex < searchResults.length) {
            setCurResultIndex((curResultIndex) => curResultIndex + 1);
        }
    }, [curResultIndex, searchResults]);

    const prevSearchResult = useCallback(() => {
        if (curResultIndex > 0) {
            setCurResultIndex((curResultIndex) => curResultIndex - 1);
        }
    }, [curResultIndex, searchResults]);

    useEffect(() => {
        if (curResultIndex >= 0 && curResultIndex <= searchResults.length) {
            console.log(searchResults[curResultIndex]);
            /* eslint-disable */
            resultSwitch(searchResults[curResultIndex]['id']);
            /* eslint-enable */
        }
    }, [curResultIndex]);

    const handleKeyDown = useCallback(
        (e: any) => {
            if (
                process.platform === 'darwin' ||
                process.platform === 'win32' ||
                process.platform === 'linux'
            ) {
                const modKey = process.platform === 'darwin' ? e.metaKey : e.ctrlKey;

                if (e.keyCode === 70 && modKey && e.shiftKey) {
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

                // arrow bottom 40
                if (e.keyCode === 40 && showSearchPanel) {
                    console.log('next');
                    nextSearchResult();
                }

                // arrow top 38
                if (e.keyCode === 38 && showSearchPanel) {
                    console.log('prev');
                    prevSearchResult();
                }
            }
        },
        [showSearchPanel, prevSearchResult, nextSearchResult]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    return (
        <SearchBarContainer className="child-border-color">
            <WaitingMaskStatic show={showWaitingMask} word={'请等待......'}></WaitingMaskStatic>
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
                            searchResults.map((result: any, index: number) => {
                                return (
                                    <SearchResult
                                        onClick={() => {
                                            setCurResultIndex(index);
                                            resultSwitch(result.id);
                                        }}
                                        key={result.id}
                                        style={{
                                            backgroundColor:
                                                currentNoteKey === result.id.split('-')[2] &&
                                                showResultHighlight
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
        </SearchBarContainer>
    );
};

const SearchBarContainer = styled.div({
    position: 'relative',
    display: 'flex',
    padding: '5px 30px 5px 40px',
    borderBottomWidth: '1.5px',
    borderBottomStyle: 'solid',
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
    top: '48px',
    left: '0',
    display: 'flex',
    flexDirection: 'column',
    width: 'calc(100%)',
    height: 'calc(100vh - 48px)',
    padding: '15px',
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

export default SearchBar;
