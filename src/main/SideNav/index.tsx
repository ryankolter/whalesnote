import styled from "@emotion/styled";
import DirectoryBtn from "./DirectoryBtn";
import FolderList from "./FolderList";
import NoteList from "./NoteList";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
const { ipcRenderer } = window.require("electron");

const SideNav: React.FC<SideNavProps> = ({
    data_path,
    repos_key,
    repos_obj,
    folders_key,
    folders_obj,
    notes_key,
    notes_obj,
    currentRepoKey,
    currentFolderKey,
    currentNoteKey,
    keySelect,
    repoSwitch,
    folderSwitch,
    noteSwitch,
    updateDxnote,
    updateRepos,
    changeNotesAfterNew,
    setDataPath,
    reorderRepo,
    reorderFolder,
    reorderNote,
    setFocus,
    setBlur,
    setKeySelect,
    updateMiniSearch,
    searchNote,
}) => {
    let [folderWidth, setFolderWidth] = useState(130);
    let [noteWidth, setNoteWidth] = useState(200);
    let [word, setWord] = useState("");
    let [searchResults, setSearchResults] = useState([]);
    let [showSearchPanel, setShowSearchPanel] = useState(false);

    useMemo(() => {
        ipcRenderer.on("selectedFolder", (event: any, path: string) => {
            window.localStorage.setItem("dxnote_data_path", path);
            setDataPath(path);
        });
    }, [setDataPath]);

    const addDataPath = () => {
        ipcRenderer.send("open-directory-dialog");
    };

    const handleSearchInputChange = useCallback(
        (event: any) => {
            setWord(event.target.value);
        },
        [setWord]
    );

    const handleSearchInputEnter = useCallback(
        (event: any) => {
            if (event.keyCode === 13) {
                setWord(event.target.value);
            }
        },
        [setWord]
    );

    const search = useCallback(() => {
        if (word === "" || word === "　") {
            setSearchResults([]);
            return;
        }
        if (!showSearchPanel) setShowSearchPanel(true);
        setSearchResults(searchNote(word));
    }, [word, showSearchPanel, setShowSearchPanel, setSearchResults, searchNote]);

    useEffect(() => {
        search();
    }, [word]);

    return (
        <LeftPanel>
            <ToolBar>
                <DirectoryBtnArea>
                    {data_path ? (
                        <DirectoryBtn
                            data_path={data_path}
                            addDataPath={addDataPath}
                            panelWidth={folderWidth + noteWidth}
                        />
                    ) : (
                        <PathAddBtn onClick={addDataPath}>设置数据目录</PathAddBtn>
                    )}
                </DirectoryBtnArea>
                {data_path ? (
                    <Search>
                        <SearchInput
                            onKeyDown={handleSearchInputEnter}
                            onChange={handleSearchInputChange}
                            placeholder='搜索'
                        />
                        {showSearchPanel ? (
                            <SearchPanel>
                                <SearchTool>
                                    <CloseSearchPanelBtn
                                        onClick={() => {
                                            setShowSearchPanel(false);
                                        }}
                                    >
                                        x
                                    </CloseSearchPanelBtn>
                                    <UpdateIndex>
                                        <UpdateIndexBtn
                                            onClick={() => {
                                                updateMiniSearch();
                                                search();
                                            }}
                                        >
                                            更新索引
                                        </UpdateIndexBtn>
                                    </UpdateIndex>
                                </SearchTool>
                                <SearchResults>
                                    {searchResults && searchResults.length > 0 ? (
                                        searchResults.map((result: any) => {
                                            return <div key={result.id}>{result.title}</div>;
                                        })
                                    ) : (
                                        <></>
                                    )}
                                </SearchResults>
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
                    <FolderList
                        data_path={data_path}
                        folders_key={folders_key}
                        folders_obj={folders_obj}
                        currentRepoKey={currentRepoKey}
                        currentFolderKey={currentFolderKey}
                        keySelect={keySelect}
                        repoSwitch={repoSwitch}
                        folderSwitch={folderSwitch}
                        noteSwitch={noteSwitch}
                        updateRepos={updateRepos}
                        changeNotesAfterNew={changeNotesAfterNew}
                        reorderFolder={reorderFolder}
                        setFocus={setFocus}
                        width={folderWidth}
                    />
                    <NoteList
                        data_path={data_path}
                        notes_key={notes_key}
                        notes_obj={notes_obj}
                        currentRepoKey={currentRepoKey}
                        currentFolderKey={currentFolderKey}
                        currentNoteKey={currentNoteKey}
                        keySelect={keySelect}
                        repoSwitch={repoSwitch}
                        folderSwitch={folderSwitch}
                        noteSwitch={noteSwitch}
                        updateRepos={updateRepos}
                        changeNotesAfterNew={changeNotesAfterNew}
                        reorderNote={reorderNote}
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
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: "10px",
    boxSizing: "border-box",
});

const ToolBar = styled.div({
    display: "flex",
    margin: "0 0 0 5px",
});

const Search = styled.div({
    position: "relative",
    flex: "1",
    minWidth: "0",
});

const SearchInput = styled.input({
    border: "none",
    outline: "none",
    fontSize: "14px",
    lineHeight: "20px",
    letterSpacing: "1px",
    width: "100%",
    padding: "10px",
    boxSizing: "border-box",
});

const SearchPanel = styled.div({
    position: "absolute",
    top: "40px",
    left: "-62px",
    display: "flex",
    flexDirection: "column",
    width: "calc(100% + 62px)",
    height: "calc(90vh)",
    padding: "10px",
    boxSizing: "border-box",
    border: "1px solid rgba(58, 64, 76, 0.8)",
    backgroundColor: "#2C3033",
    zIndex: "999999",
});

const SearchTool = styled.div({
    display: "flex",
    alignItem: "center",
    height: "40px",
});

const CloseSearchPanelBtn = styled.div({
    width: "20px",
    height: "20px",
    lineHeight: "18px",
    fontSize: "20px",
    color: "#939395",
    padding: "5px 10px",
    margin: "0 0 2px 0",
    cursor: "pointer",
});

const UpdateIndex = styled.div({
    display: "flex",
    flexDirection: "row-reverse",
    alignItem: "center",
    flex: "1",
    minWidth: "0",
});

const UpdateIndexBtn = styled.div({
    display: "flex",
    alignItem: "center",
    justifyContent: "center",
    width: "60px",
    height: "28px",
    lineHeight: "28px",
    fontSize: "14px",
    padding: "0 4px",
    borderRadius: " 4px",
    color: "#939395",
    backgroundColor: "rgb(58, 64, 76)",
});

const SearchResults = styled.div({
    flex: "1",
    minHeight: "0",
    color: "#939395",
});

const SelectArea = styled.div({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    flex: "1",
    minHeight: "0",
    margin: "10px 0",
});

const DirectoryBtnArea = styled.div();

const PathAddBtn = styled.div({
    position: "relative",
    height: "32px",
    lineHeight: "32px",
    display: "flex",
    alignItem: "center",
    justifyContent: "center",
    padding: "0 10px",
    marginTop: "8px",
    borderRadius: "4px",
    color: "#939395",
    backgroundColor: "rgb(58, 64, 76)",
    cursor: "pointer",
});

const List = styled.div({
    display: "flex",
    alignItem: "center",
    flex: "1",
    minHeight: "0",
    borderBottomLeftRadius: "4px",
    padding: "0 0 0 5px",
});

type SideNavProps = {
    data_path: string;
    repos_key: string[] | undefined;
    repos_obj: object | undefined;
    folders_key: string[] | undefined;
    folders_obj: object | undefined;
    notes_key: string[] | undefined;
    notes_obj: object | undefined;
    currentRepoKey: string | undefined;
    currentFolderKey: string | undefined;
    currentNoteKey: string;
    keySelect: boolean;
    repoSwitch: (repoKey: string | undefined) => void;
    folderSwitch: (repo_key: string | undefined, folderKey: string | undefined) => void;
    noteSwitch: (data_path: string | null, note_key: string | undefined) => void;
    updateDxnote: (data_path: string) => void;
    updateRepos: (action_name: string, obj: object) => void;
    changeNotesAfterNew: (action_name: string, obj: object) => void;
    setDataPath: (path: string) => void;
    reorderRepo: (data_path: string, repo_key: string, new_repos_key: string[]) => void;
    reorderFolder: (data_path: string, repo_key: string, new_folders_key: string[]) => void;
    reorderNote: (
        data_path: string,
        repo_key: string,
        folder_key: string,
        new_notes_key: string[]
    ) => void;
    setFocus: (focus: string) => void;
    setBlur: (focus: string) => void;
    setKeySelect: (keySelect: boolean) => void;
    updateMiniSearch: () => void;
    searchNote: (word: string) => any;
};

export default SideNav;
