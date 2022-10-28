import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';

import SearchBar from './SearchBar';
import FolderList from './FolderList';
import NoteList from './NoteList';

const SideNav: React.FC<Record<string, unknown>> = ({}) => {
    const { numArray, setNumArray, keySelect } = useContext(GlobalContext);

    const resizeFolderOffsetX = useRef<number>(0);
    const resizeNoteOffsetX = useRef<number>(0);
    const lastFolderPageX = useRef<number>(0);
    const lastNotePageX = useRef<number>(0);
    const [folderWidth, setFolderWidth] = useState(
        Number(window.localStorage.getItem('folder_width')) || 186
    );
    const [noteWidth, setNoteWidth] = useState(
        Number(window.localStorage.getItem('note_width')) || 250
    );

    const handleKeyDown = useCallback(
        async (e: any) => {
            const process_platform = await window.electronAPI.getPlatform();
            if (
                process_platform === 'darwin' ||
                process_platform === 'win32' ||
                process_platform === 'linux'
            ) {
                const modKey = process_platform === 'darwin' ? e.metaKey : e.ctrlKey;

                if (
                    ((e.keyCode >= 65 && e.keyCode <= 72) ||
                        (e.keyCode >= 77 && e.keyCode <= 89)) &&
                    !modKey &&
                    keySelect
                ) {
                    const num = parseInt(e.keyCode);
                    if (numArray.length === 0) {
                        setNumArray((state: any) => state.concat([num]));
                    } else {
                        setNumArray((state: any) => state.concat([num]));
                    }
                }

                if (e.keyCode >= 48 && e.keyCode <= 57 && !modKey && keySelect) {
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
        <LeftPanel>
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
                    ></ResizeFolderWidth>
                    <NoteList width={noteWidth} />
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
    color: 'var(--main-text-color)',
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
