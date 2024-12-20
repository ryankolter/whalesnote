import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import styled from '@emotion/styled';
import { SearchResult } from 'minisearch';

import useSearch from './useSearch';
import WaitingMaskStatic from '@/components/WaitingMaskStatic';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
    activeWhaleIdAtom,
    keySelectActiveAtom,
    platformAtom,
    searchPanelVisibleAtom,
} from '@/atoms';
import { useDataContext } from '@/context/DataProvider';
import { SearchIcon } from 'lucide-react';

const SearchBar: React.FC<Record<string, unknown>> = ({}) => {
    const { t } = useTranslation();

    const { curNoteKey } = useDataContext();

    const id = useAtomValue(activeWhaleIdAtom);
    const platform = useAtomValue(platformAtom);
    const [searchPanelVisible, setSearchPanelVisible] = useAtom(searchPanelVisibleAtom);
    const setKeySelectActive = useSetAtom(keySelectActiveAtom);

    const searchBarRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const setWordTimerObj = useRef<NodeJS.Timeout>();
    const composing = useRef(false);

    const [
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
    ] = useSearch();

    const handleSearchInputChange = useCallback(
        (e: any) => {
            if (setWordTimerObj.current) clearTimeout(setWordTimerObj.current);

            setWordTimerObj.current = setTimeout(
                () => setWord(e.target.value),
                searchPanelVisible ? 300 : 0,
            );

            if (searchModuleInitialized.current) setSearchPanelVisible(true);
        },
        [searchPanelVisible, setWord, setSearchPanelVisible],
    );

    const handleSearchInputFocus = useCallback(() => {
        if (searchPanelVisible) return;

        if (searchModuleInitialized.current) setSearchPanelVisible(true);
        searchInputRef.current?.setSelectionRange(0, searchInputRef.current.value.length);
    }, [searchPanelVisible, setSearchPanelVisible]);

    useEffect(() => {
        setWord('');
        if (searchInputRef.current) searchInputRef.current.value = '';
        searchModuleInitialized.current = false;
    }, [id]);

    const handleKeyDown = useCallback(
        async (e: KeyboardEvent) => {
            if (platform === 'darwin' || platform === 'win32' || platform === 'linux') {
                const modKey = platform === 'darwin' ? e.metaKey : e.ctrlKey;

                if ((e.key === 'f' || e.key === 'F') && modKey && e.shiftKey) {
                    searchInputRef.current?.focus();
                    setKeySelectActive(false);
                }

                if (
                    (!composing.current && e.key === 'Enter' && curSearchResultIndex !== -1) ||
                    e.key === 'Escape'
                ) {
                    if (searchPanelVisible) {
                        setSearchPanelVisible(false);
                        if (searchInputRef.current) {
                            searchInputRef.current.blur();
                        }
                    }
                }

                if (!composing.current && e.key === 'Enter' && curSearchResultIndex === -1) {
                    if (
                        !searchModuleInitialized.current &&
                        document.activeElement?.id === 'search-input-id'
                    ) {
                        setSearchPanelVisible(true);
                    } else if (searchPanelVisible) {
                        nextSearchResult();
                    }
                }

                // arrow bottom 40
                if (e.key === 'ArrowDown' && !modKey && searchPanelVisible) {
                    e.preventDefault();
                    nextSearchResult();
                }

                // arrow top 38
                if (e.key === 'ArrowUp' && !modKey && searchPanelVisible) {
                    e.preventDefault();
                    prevSearchResult();
                }
            }
        },
        [
            searchPanelVisible,
            curSearchResultIndex,
            nextSearchResult,
            prevSearchResult,
            setKeySelectActive,
            setSearchPanelVisible,
        ],
    );

    const handleClick = useCallback(
        (event: MouseEvent) => {
            if (!searchBarRef.current?.contains(event.target as Node)) {
                setSearchPanelVisible(false);
            }
        },
        [setSearchPanelVisible],
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
            <EmptyArea onClick={() => setSearchPanelVisible(false)}></EmptyArea>
            <Search>
                <SearchIcon
                    width="16"
                    height="16"
                    className="translate-y-[1px]"
                    onClick={() => {
                        setSearchPanelVisible(true);
                        if (searchModuleInitialized.current) {
                            searchInputRef.current?.focus();
                        }
                    }}
                />
                <SearchInput
                    id="search-input-id"
                    ref={searchInputRef}
                    onChange={handleSearchInputChange}
                    onFocus={handleSearchInputFocus}
                    placeholder={t('search.placeholder') || ''}
                    readOnly={showInitTips}
                />
            </Search>
            <EmptyArea onClick={() => setSearchPanelVisible(false)}></EmptyArea>
            {searchPanelVisible ? (
                <SearchPanel>
                    {showUpdateIndexBtn ? (
                        <SearchTool>
                            <UpdateIndex>
                                <UpdateIndexBtn
                                    onClick={() => {
                                        updateMiniSearch();
                                    }}
                                >
                                    {needGenerateIndex ? (
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
                    {showUpdateIndexBtn && needGenerateIndex ? (
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
                                        id={`search-result-item-${index}`}
                                        onClick={() => {
                                            clickOnSearchResult(index);
                                        }}
                                        key={result.id}
                                        style={{
                                            backgroundColor:
                                                curNoteKey === result.id.split('-')[2] &&
                                                curSearchResultIndex !== -1
                                                    ? 'var(--second-selected-bg-color)'
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
                        {searchResults && searchResults.length > 0 ? (
                            <SearchResultsEnd>
                                <SearchResultsEndText>
                                    —— {t('search.results_end')} ——
                                </SearchResultsEndText>
                            </SearchResultsEnd>
                        ) : (
                            <></>
                        )}
                    </SearchResultList>
                    {showInitTips ? (
                        <LoadingSearch>
                            <LoadingSearchTips>
                                {`(${initProgress}%)`}
                                {t('search.initing')}
                            </LoadingSearchTips>
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

const SearchBarContainer = styled.div(
    {
        position: 'relative',
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
    },
    `
    app-region: no-drag;
`,
);

const EmptyArea = styled.div({
    width: '30px',
    height: '32px',
});

const Search = styled.div({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: '1',
    minWidth: '0',
    gap: '12px',
    padding: '6px 0 6px',
});

const SearchInput = styled.input(
    {
        border: 'none',
        outline: 'none',
        fontFamily:
            'PingFang SC, -apple-system, Helvetica, Tahoma, Arial, "Microsoft YaHei", sans-serif',
        fontSize: '14px',
        lineHeight: '20px',
        letterSpacing: '1px',
        width: '100%',
        boxSizing: 'border-box',
        color: 'var(--input-text-color) !important',
        backgroundColor: 'var(--render-main-bg-color) !important',
    },
    `
    &::-webkit-input-placeholder {
        color: var(--input-placeholder-text-color) !important;
        font-size: 13px;
    }
`,
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
    left: '-5px',
    display: 'flex',
    flexDirection: 'column',
    width: 'calc(100% + 10px)',
    height: 'calc(100vh - 60px)',
    padding: '15px',
    boxSizing: 'border-box',
    zIndex: '3500',
    borderRadius: '10px',
    border: '0.5px solid var(--float-panel-border-color)',
    backgroundColor: 'var(--search-panel-bg-color)',
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
    backgroundColor: 'var(--second-btn-bg-color)',
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
`,
);

const SearchResultsEnd = styled.div({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 0',
});

const SearchResultsEndText = styled.div({
    fontSize: '14px',
});

const SearchResultDiv = styled.div({
    display: 'flex',
    height: '36px',
    lineHeight: '36px',
    padding: '0 10px',
    fontSize: '14px',
    borderRadius: '3px',
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
