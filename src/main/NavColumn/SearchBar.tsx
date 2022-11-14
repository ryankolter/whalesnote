import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';

import { SearchResult } from 'minisearch';
import useSearch from '../../lib/useSearch';
import WaitingMaskStatic from '../../components/WaitingMaskStatic';
import searchIcon from '../../resources/icon/searchIcon.svg';

const SearchBar: React.FC<Record<string, unknown>> = ({}) => {
    const {
        curDataPath,
        currentNoteKey,
        platformName,
        showKeySelect,
        showSearchPanel,
        setShowKeySelect,
        setShowSearchPanel,
        switchNote,
    } = useContext(GlobalContext);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const setWordTimerObj = useRef<NodeJS.Timeout>();
    const composing = useRef(false);

    const [word, setWord] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [curResultIndex, setCurResultIndex] = useState(-1);
    const [showResultHighlight, setShowResultHighlight] = useState(false);

    const [
        showUpdateIndexTips,
        showWaitingMask,
        showLoadingSearch,
        loadSearchFileJson,
        updateMiniSearch,
        searchNote,
    ] = useSearch();

    const handleSearchInputChange = useCallback(
        (e: any) => {
            if (setWordTimerObj.current) {
                clearTimeout(setWordTimerObj.current);
            }
            setWordTimerObj.current = setTimeout(() => {
                setWord(e.target.value);
            }, 300);
            if (!showSearchPanel) setShowSearchPanel(true);
        },
        [setWord, showSearchPanel, setShowSearchPanel]
    );

    const handleSearchInputFocus = useCallback(() => {
        if (!showSearchPanel) {
            setShowSearchPanel(true);
            if (searchInputRef.current) {
                searchInputRef.current.setSelectionRange(0, searchInputRef.current.value.length);
            }
        }
    }, [showSearchPanel, setShowSearchPanel]);

    const search = useCallback(() => {
        if (word === '' || word === '　') {
            setSearchResults([]);
            return;
        }
        if (!showSearchPanel) setShowSearchPanel(true);
        const search_result = searchNote(word);
        setSearchResults(search_result);
    }, [word, showSearchPanel, searchNote, setShowSearchPanel, setSearchResults]);

    const resultSwitch = useCallback(
        async (id: string) => {
            setShowResultHighlight(true);
            const arr = id.split('-');
            await switchNote(arr[0], arr[1], arr[2]);
        },
        [setShowResultHighlight, switchNote]
    );

    useEffect(() => {
        setWord('');
        if (searchInputRef.current) {
            searchInputRef.current.value = '';
        }
    }, [curDataPath]);

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

    useEffect(() => {
        (async () => {
            if (showSearchPanel) {
                await loadSearchFileJson();
            }
        })();
    }, [showSearchPanel]);

    const nextSearchResult = useCallback(() => {
        if (curResultIndex < searchResults.length - 1) {
            setCurResultIndex((curResultIndex) => curResultIndex + 1);
        }
    }, [curResultIndex, searchResults, setCurResultIndex]);

    const prevSearchResult = useCallback(() => {
        if (curResultIndex > 0) {
            setCurResultIndex((curResultIndex) => curResultIndex - 1);
        }
    }, [curResultIndex, setCurResultIndex]);

    useEffect(() => {
        if (curResultIndex >= 0 && curResultIndex < searchResults.length) {
            /* eslint-disable */
            resultSwitch(searchResults[curResultIndex]['id']);
            /* eslint-enable */
        }
    }, [curResultIndex]);

    const handleKeyDown = useCallback(
        async (e: KeyboardEvent) => {
            if (platformName === 'darwin' || platformName === 'win32' || platformName === 'linux') {
                const modKey = platformName === 'darwin' ? e.metaKey : e.ctrlKey;

                if ((e.key === 'f' || e.key === 'F') && modKey && e.shiftKey) {
                    searchInputRef.current?.focus();
                    if (showKeySelect) setShowKeySelect(false);
                }

                if ((!composing.current && e.key === 'Enter') || e.key === 'Escape') {
                    if (showSearchPanel) {
                        setShowSearchPanel(false);
                        if (searchInputRef.current) {
                            searchInputRef.current.blur();
                        }
                    }
                }

                // arrow bottom 40
                if (e.key === 'ArrowDown' && showSearchPanel) {
                    e.preventDefault();
                    nextSearchResult();
                }

                // arrow top 38
                if (e.key === 'ArrowUp' && showSearchPanel) {
                    e.preventDefault();
                    prevSearchResult();
                }
            }
        },
        [showSearchPanel, prevSearchResult, nextSearchResult, setWord]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('compositionstart', () => {
            composing.current = true;
        });
        document.addEventListener('compositionend', () => {
            composing.current = false;
        });
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('compositionstart', () => {
                composing.current = true;
            });
            document.removeEventListener('compositionend', () => {
                composing.current = false;
            });
        };
    }, [handleKeyDown]);

    return (
        <SearchBarContainer>
            <WaitingMaskStatic show={showWaitingMask} word={'请等待......'}></WaitingMaskStatic>
            <Search>
                <SearchIcon
                    onClick={() => {
                        searchInputRef.current?.focus();
                    }}
                >
                    <SearchIconImg src={searchIcon} alt="" />
                </SearchIcon>
                <SearchInput
                    ref={searchInputRef}
                    onChange={handleSearchInputChange}
                    onFocus={handleSearchInputFocus}
                    placeholder="搜索"
                    readOnly={showLoadingSearch}
                />
            </Search>
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
                            searchResults.map((result: SearchResult, index: number) => {
                                return (
                                    <SearchResultDiv
                                        onClick={() => {
                                            setCurResultIndex(index);
                                            resultSwitch(result.id);
                                        }}
                                        key={result.id}
                                        style={{
                                            backgroundColor:
                                                currentNoteKey === result.id.split('-')[2] &&
                                                showResultHighlight
                                                    ? 'var(--main-selected-bg-color)'
                                                    : '',
                                        }}
                                    >
                                        <TitleName>{result.title}</TitleName>
                                    </SearchResultDiv>
                                );
                            })
                        ) : (
                            <></>
                        )}
                    </SearchResultList>
                    {showLoadingSearch ? <LoadingSearch>搜索模块初始化中...</LoadingSearch> : <></>}
                </SearchPanel>
            ) : (
                <></>
            )}
        </SearchBarContainer>
    );
};

const SearchBarContainer = styled.div({
    position: 'relative',
    width: '100%',
    padding: '10px 30px 10px 30px',
    boxSizing: 'border-box',
    display: 'flex',
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
});

const SearchIconImg = styled.img({
    width: '14px',
    height: '14px',
});

const SearchInput = styled.input(
    {
        border: 'none',
        outline: 'none',
        fontFamily: 'PingFang SC',
        fontSize: '14px',
        fontWeight: 500,
        lineHeight: '20px',
        letterSpacing: '1px',
        width: '100%',
        padding: '12px 0 6px 16px',
        boxSizing: 'border-box',
        color: 'var(--input-text-color) !important',
        backgroundColor: 'var(--main-bg-color) !important',
    },
    `
    &::-webkit-input-placeholder {
        color: var(--input-placeholder-text-color) !important;
    }
`
);

const LoadingSearch = styled.div({
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    transform: 'translate(-15px, -15px)',
    borderRadius: '10px',
    backgroundColor: 'var(--main-waiting-bg-color)',
});

const SearchPanel = styled.div({
    position: 'absolute',
    top: '40px',
    left: '0',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: 'calc(100vh - 140px)',
    padding: '15px',
    boxSizing: 'border-box',
    zIndex: '3000',
    borderRadius: '10px',
    border: '1px solid var(--float-panel-border-color)',
    backgroundColor: 'var(--float-panel-bg-color)',
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
    backgroundColor: 'var(--main-btn-bg-color)',
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
    border: '1px dotted var(--main-tips-border-color)',
    backgroundColor: 'var(--main-tips-bg-color)',
});

const SearchResultList = styled.div(
    {
        flex: '1',
        minHeight: '0',
        overflowY: 'auto',
    },
    `
    &::-webkit-scrollbar {
        display: none;
    }
`
);

const SearchResultDiv = styled.div({
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

const TitleName = styled.div({
    flex: '1',
    minWidth: '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
});

export default SearchBar;