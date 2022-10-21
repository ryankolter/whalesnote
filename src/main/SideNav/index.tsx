const { ipcRenderer } = window.require('electron');
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';

import SearchBar from './SearchBar';
import FolderList from './FolderList';
import NoteList from './NoteList';

type SideNavProps = Record<string, unknown>;

const SideNav: React.FC<SideNavProps> = ({}) => {
    console.log('SideNav render');
    const { numArray, setNumArray, keySelect } = useContext(GlobalContext);

    const resizeFolderOffsetX = useRef<number>(0);
    const resizeNoteOffsetX = useRef<number>(0);

    const [folderWidth, setFolderWidth] = useState(
        Number(window.localStorage.getItem('folder_width')) || 186
    );
    const [noteWidth, setNoteWidth] = useState(
        Number(window.localStorage.getItem('note_width')) || 250
    );

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
            }
        },
        [numArray, keySelect]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    return (
        <LeftPanel className={'left-panel-color'}>
            <SearchBar />
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
        </LeftPanel>
    );
};

const LeftPanel = styled.div({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    boxSizing: 'border-box',
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
