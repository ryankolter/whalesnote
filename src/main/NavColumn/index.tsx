import { useCallback, useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';

import SearchBar from './SearchBar';
import FolderList from './FolderList';
import NoteList from './NoteList';
import RepoPanel from './RepoPanel';
import { useDataContext } from '@/context/DataProvider';
import { useAtom, useAtomValue } from 'jotai';
import {
    keySelectActiveAtom,
    keySelectNumArrAtom,
    platformAtom,
    repoPanelVisibleAtom,
} from '@/atoms';

const NavColumn: React.FC<{}> = ({}) => {
    const { curRepoKey, whalesnote } = useDataContext();

    const platform = useAtomValue(platformAtom);
    const [repoPanelVisible, setRepoPanelVisible] = useAtom(repoPanelVisibleAtom);
    const keySelectActive = useAtomValue(keySelectActiveAtom);
    const [keySelectNumArr, setKeySelectNumArr] = useAtom(keySelectNumArrAtom);

    const resizeFolderOffsetX = useRef<number>(0);
    const resizeNoteOffsetX = useRef<number>(0);
    const lastFolderPageX = useRef<number>(0);
    const lastNotePageX = useRef<number>(0);
    const [folderWidth, setFolderWidth] = useState(
        Number(window.localStorage.getItem('folder_width')) || 160,
    );
    const [noteWidth, setNoteWidth] = useState(
        Number(window.localStorage.getItem('note_width')) || 220,
    );

    const handleKeyDown = useCallback(
        async (e: KeyboardEvent) => {
            if (platform === 'darwin' || platform === 'win32' || platform === 'linux') {
                const modKey = platform === 'darwin' ? e.metaKey : e.ctrlKey;

                const lowercase_re = /^[a-hm-y]$/;
                if (e.key.match(lowercase_re) && !modKey && keySelectActive) {
                    const num = e.key.charCodeAt(0) - 32;
                    if (keySelectNumArr.length === 0) {
                        setKeySelectNumArr((state: any) => state.concat([num]));
                    } else {
                        setKeySelectNumArr((state: any) => state.concat([num]));
                    }
                }

                const uppercase_re = /^[A-HM-Y]$/;
                if (e.key.match(uppercase_re) && !modKey && keySelectActive) {
                    const num = e.key.charCodeAt(0);
                    if (keySelectNumArr.length === 0) {
                        setKeySelectNumArr((state: any) => state.concat([num]));
                    } else {
                        setKeySelectNumArr((state: any) => state.concat([num]));
                    }
                }

                const number_re = /^[0-9]$/;
                if (e.key.match(number_re) && !modKey && keySelectActive) {
                    const num = e.key.charCodeAt(0);
                    if (keySelectNumArr.length === 1) {
                        setKeySelectNumArr((state: any) => state.concat([num]));
                    }
                }
            }
        },
        [keySelectNumArr, keySelectActive],
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    return (
        <LeftPanel>
            <FolderAndRepo width={folderWidth}>
                <DragArea></DragArea>
                <FolderBox>
                    <FolderList />
                </FolderBox>
                <RepoBox>
                    <CurRepoNameTag
                        onClick={() => {
                            setRepoPanelVisible((_showAllRepo) => !_showAllRepo);
                        }}
                    >
                        <RepoNameLabel>
                            {whalesnote.repo_map && curRepoKey && whalesnote.repo_map[curRepoKey]
                                ? whalesnote.repo_map[curRepoKey].repo_name
                                : ''}
                        </RepoNameLabel>
                        {keySelectActive ? <RepoPanelKeyTab>Z</RepoPanelKeyTab> : <></>}
                    </CurRepoNameTag>
                </RepoBox>
                <AllRepo
                    style={{
                        maxWidth: `calc(100% - ${folderWidth}px - 40px)`,
                        bottom: `${repoPanelVisible ? '20px' : '-400px'}`,
                    }}
                    left={folderWidth}
                >
                    <RepoPanel />
                </AllRepo>
            </FolderAndRepo>
            <ResizeFolderWidth
                left={folderWidth}
                onDragStart={(e) => {
                    resizeFolderOffsetX.current = e.pageX - folderWidth;
                }}
                onDrag={(e) => {
                    if (Math.abs(e.pageX - lastFolderPageX.current) < 5) return;
                    lastFolderPageX.current = e.pageX;
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
            />
            {whalesnote.repo_keys && whalesnote.repo_keys.length > 0 ? (
                <SearchAndNote>
                    <SearchBarAndNote width={noteWidth}>
                        <SearchBarBox>
                            <SearchBar />
                        </SearchBarBox>
                        <NoteBox>
                            <NoteList />
                        </NoteBox>
                    </SearchBarAndNote>
                    <ResizeNoteWidth
                        left={folderWidth + noteWidth}
                        onDragStart={(e) => {
                            resizeNoteOffsetX.current = e.pageX - noteWidth;
                        }}
                        onDrag={(e) => {
                            if (Math.abs(e.pageX - lastNotePageX.current) < 5) return;
                            lastNotePageX.current = e.pageX;
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
                    />
                </SearchAndNote>
            ) : (
                <></>
            )}
        </LeftPanel>
    );
};

const LeftPanel = styled.div({
    display: 'flex',
    height: '100%',
    boxSizing: 'border-box',
    color: 'var(--main-text-color)',
});

const DragArea = styled.div(
    {
        height: '40px',
        width: '100%',
    },
    `
    app-region: drag;
`,
);

const FolderAndRepo = styled.div(
    {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--main-folder-and-repo-bg-color)',
    },
    (props: { width: number }) => ({
        width: props.width,
    }),
);

const FolderBox = styled.div({
    flex: '1',
    minHeight: 0,
    width: '100%',
});

const RepoBox = styled.div({
    width: '100%',
    padding: '0 20px 20px 20px',
    boxSizing: 'border-box',
});

const CurRepoNameTag = styled.div({
    position: 'relative',
    height: '32px',
    lineHeight: '32px',
    borderRadius: '5px',
    cursor: 'pointer',
    overflow: 'hidden !important',
    textOverflow: 'ellipsis',
    wordBreak: 'break-all',
    color: 'var(--main-text-color)',
    backgroundColor: 'var(--second-selected-bg-color)',
});

const RepoPanelKeyTab = styled.div({
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '12px',
    height: '14px',
    lineHeight: '14px',
    fontSize: '14px',
    letterSpacing: '1px',
});

const RepoNameLabel = styled.div({
    flex: 1,
    fontSize: '16px',
    padding: '0 10px',
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
});

const AllRepo = styled.div(
    {
        width: '900px',
        position: 'fixed',
        padding: '10px 15px',
        boxSizing: 'border-box',
        borderRadius: '8px',
        zIndex: '3400',
        border: '0.5px solid var(--float-panel-border-color)',
        backgroundColor: 'var(--repo-panel-bg-color)',
    },
    (props: { left: number }) => ({
        left: props.left - 20,
    }),
);

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
    }),
);

const SearchAndNote = styled.div({
    display: 'flex',
    background: 'var(--render-main-bg-color) !important',
});

const SearchBarAndNote = styled.div(
    {
        display: 'flex',
        flexDirection: 'column',
        minWidth: '100px',
    },
    (props: { width: number }) => ({
        width: props.width,
    }),
);

const SearchBarBox = styled.div(
    {
        width: '100%',
        boxSizing: 'border-box',
        padding: '18px 0 10px 0',
        borderRight: '0.5px solid var(--main-border-color)',
    },
    `
    app-region: drag;
`,
);

const NoteBox = styled.div({
    width: '100%',
    flex: '1',
    minHeight: '0',
});

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
    }),
);

export default NavColumn;
