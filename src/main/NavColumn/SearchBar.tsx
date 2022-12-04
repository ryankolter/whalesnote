import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import { useTranslation } from 'react-i18next';

import styled from '@emotion/styled';
import { SearchResult } from 'minisearch';

import useSearch from '../../lib/useSearch';
import WaitingMaskStatic from '../../components/WaitingMaskStatic';

const SearchBar: React.FC<Record<string, unknown>> = ({}) => {
    const {
        curDataPath,
        currentNoteKey,
        platformName,
        showSearchPanel,
        setShowKeySelect,
        setShowSearchPanel,
        setShowSearchResultHighlight,
        switchNote,
    } = useContext(GlobalContext);
    const { t } = useTranslation();

    const searchBarRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const setWordTimerObj = useRef<NodeJS.Timeout>();
    const composing = useRef(false);

    const [word, setWord] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [curSearchResultIndex, setCurSearchResultIndex] = useState(-1);

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
            setShowSearchPanel(true);
        },
        [setWord, setShowSearchPanel]
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
        setShowSearchPanel(true);
        const search_result = searchNote(word);
        setSearchResults(search_result);
    }, [word, searchNote, setShowSearchPanel, setSearchResults]);

    useEffect(() => {
        setWord('');
        if (searchInputRef.current) {
            searchInputRef.current.value = '';
        }
    }, [curDataPath]);

    useEffect(() => {
        setShowSearchResultHighlight(false);
        setCurSearchResultIndex(-1);
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

    const handleKeyDown = useCallback(
        async (e: KeyboardEvent) => {
            if (platformName === 'darwin' || platformName === 'win32' || platformName === 'linux') {
                const modKey = platformName === 'darwin' ? e.metaKey : e.ctrlKey;

                if ((e.key === 'f' || e.key === 'F') && modKey && e.shiftKey) {
                    searchInputRef.current?.focus();
                    setShowKeySelect(false);
                }

                if (
                    (!composing.current && e.key === 'Enter' && curSearchResultIndex !== -1) ||
                    e.key === 'Escape'
                ) {
                    if (showSearchPanel) {
                        setShowSearchPanel(false);
                        if (searchInputRef.current) {
                            searchInputRef.current.blur();
                        }
                    }
                }

                if (!composing.current && e.key === 'Enter' && curSearchResultIndex === -1) {
                    nextSearchResult();
                }

                // arrow bottom 40
                if (e.key === 'ArrowDown' && !modKey && showSearchPanel) {
                    e.preventDefault();
                    nextSearchResult();
                }

                // arrow top 38
                if (e.key === 'ArrowUp' && !modKey && showSearchPanel) {
                    e.preventDefault();
                    prevSearchResult();
                }
            }
        },
        [
            showSearchPanel,
            curSearchResultIndex,
            nextSearchResult,
            prevSearchResult,
            setShowKeySelect,
            setShowSearchPanel,
        ]
    );

    const handleClick = useCallback(
        (event: MouseEvent) => {
            //event.preventDefault();
            if (!searchBarRef.current?.contains(event.target as Node)) {
                setShowSearchPanel(false);
            }
        },
        [setShowSearchPanel]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('click', handleClick);
        document.addEventListener('compositionstart', () => {
            composing.current = true;
        });
        document.addEventListener('compositionend', () => {
            composing.current = false;
        });
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('click', handleClick);
            document.removeEventListener('compositionstart', () => {
                composing.current = true;
            });
            document.removeEventListener('compositionend', () => {
                composing.current = false;
            });
        };
    }, [handleKeyDown]);

    return (
        <SearchBarContainer ref={searchBarRef}>
            <WaitingMaskStatic
                show={showWaitingMask}
                word={t('tips.please_wait')}
            ></WaitingMaskStatic>
            <Search>
                <SearchIcon
                    className="ri-search-line"
                    onClick={() => {
                        searchInputRef.current?.focus();
                    }}
                ></SearchIcon>
                <SearchInput
                    ref={searchInputRef}
                    onChange={handleSearchInputChange}
                    onFocus={handleSearchInputFocus}
                    placeholder={t('search.placeholder') || ''}
                    readOnly={showLoadingSearch}
                />
            </Search>
            {showSearchPanel ? (
                <SearchPanel>
                    {!showLoadingSearch ? (
                        <SearchTool>
                            <UpdateIndex>
                                <UpdateIndexBtn
                                    onClick={() => {
                                        updateMiniSearch();
                                        search();
                                    }}
                                >
                                    {showUpdateIndexTips ? (
                                        <div>{t('search.generate_search_tree')}</div>
                                    ) : (
                                        <div>{t('search.regenerate_search_tree')}</div>
                                    )}
                                </UpdateIndexBtn>
                            </UpdateIndex>
                        </SearchTool>
                    ) : (
                        <></>
                    )}
                    {showUpdateIndexTips && !showLoadingSearch ? (
                        <UpdateIndexTips>
                            <div>{t('tips.click_btn_to')}</div>
                            <div>{t('tips.activate_searching')}</div>
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
                                            setCurSearchResultIndex(index);
                                        }}
                                        key={result.id}
                                        style={{
                                            backgroundColor:
                                                currentNoteKey === result.id.split('-')[2] &&
                                                curSearchResultIndex !== -1
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
                    {showLoadingSearch ? (
                        <LoadingSearch>
                            <LoadingSearchTips>{t('search.initing')}</LoadingSearchTips>
                        </LoadingSearch>
                    ) : (
                        <></>
                    )}
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
    padding: '18px 30px 10px 30px',
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
    fontSize: '14px',
    width: '14px',
    height: '14px',
    color: 'var(--input-text-color) !important',
});

const SearchInput = styled.input(
    {
        border: 'none',
        outline: 'none',
        fontFamily:
            '-apple-system, BlinkMacSystemFont, PingFang SC, Helvetica, Tahoma, Arial, "Microsoft YaHei", sans-serif',
        fontSize: '14px',
        fontWeight: 500,
        lineHeight: '20px',
        letterSpacing: '1px',
        width: '100%',
        padding: '6px 0 6px 16px',
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

const LoadingSearchTips = styled.div({
    margin: '0 25px',
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
    zIndex: '3500',
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
