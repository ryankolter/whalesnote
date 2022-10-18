const { ipcRenderer } = window.require('electron');
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';

import { basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';
import { indentUnit } from '@codemirror/language';

import useContextMenu from '../../lib/useContextMenu';

const TrashList: React.FC<{ theme: string; closeAssistantPanel: () => void }> = ({
    theme,
    closeAssistantPanel,
}) => {
    const {
        repos_obj,
        curDataPath,
        currentRepoKey,
        currentFolderKey,
        currentNoteKey,
        repoSwitch,
        folderSwitch,
        noteSwitch,
        folderNotesFetch,
    } = useContext(GlobalContext);

    const editor = useRef<HTMLDivElement>(null);
    const view = useRef<EditorView>();
    const noteScrollRef = useRef<HTMLDivElement>(null);

    const trash = useRef({});
    const [curTrashKey, setCurTrashKey] = useState('---');

    const outerRef = useRef(null);
    const { xPos, yPos, menu } = useContextMenu(outerRef);

    const fullDeleteNote = useCallback((trash_key: string) => {}, []);

    const handleEmptyTrash = useCallback(() => {}, []);

    useEffect(() => {
        const read_trash = ipcRenderer.sendSync('readCson', {
            file_path: `${curDataPath}/trash.cson`,
        });

        trash.current = read_trash ? read_trash : {};
        const len = Object.keys(trash.current).length;
        if (len > 0) {
            setCurTrashKey(Object.keys(trash.current)[len - 1]);
        }
        console.log(trash.current);
    }, []);

    const getExtensions = [
        basicSetup,
        oneDark,
        keymap.of([indentWithTab]),
        EditorView.lineWrapping,
        indentUnit.of('    '),
    ];

    useEffect(() => {
        if (editor.current) {
            const defaultState = EditorState.create({
                doc: trash.current[curTrashKey],
                extensions: [...getExtensions],
            });
            view.current = new EditorView({
                state: defaultState,
                parent: editor.current,
            });
        }

        return () => {
            view.current?.destroy();
            view.current = undefined;
        };
    }, []);

    useEffect(() => {
        let content = trash.current[curTrashKey];
        if (content !== undefined) {
            content = content || '空';
            const newState = EditorState.create({
                doc: content,
                extensions: [...getExtensions],
            });
            view.current?.setState(newState);
        }
    }, [curTrashKey]);

    const handleWhell = useCallback((e: any) => {
        e.preventDefault();
        const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        if (noteScrollRef && noteScrollRef.current) {
            noteScrollRef.current.scrollLeft += delta * 0.5;
        }
    }, []);

    useEffect(() => {
        if (noteScrollRef && noteScrollRef.current) {
            noteScrollRef.current.addEventListener('wheel', handleWhell);
            return () => {
                noteScrollRef.current?.removeEventListener('wheel', handleWhell);
            };
        }
    }, [handleWhell]);

    const themeClassNames =
        typeof theme === 'string'
            ? `${theme}-theme-cm common-theme-cm`
            : 'grey-theme-cm common-theme-cm';

    return (
        <NoteListContainer>
            <TrashTool>
                <EmptyTrash>
                    <EmptyTrashBtn
                        className="btn-1-bg-color"
                        onClick={() => {
                            handleEmptyTrash();
                        }}
                    >
                        <div>清空废纸篓</div>
                    </EmptyTrashBtn>
                </EmptyTrash>
                <CloseTrashListBtn
                    onClick={() => {
                        closeAssistantPanel();
                    }}
                >
                    x
                </CloseTrashListBtn>
            </TrashTool>
            <NotesScroll ref={noteScrollRef}>
                <Notes ref={outerRef}>
                    {Object.keys(trash.current)
                        ?.reverse()
                        .map((trash_key: any) => {
                            const arr = trash_key.split('-');
                            return (
                                <NoteItem
                                    key={arr[2]}
                                    className={
                                        curTrashKey === trash_key
                                            ? 'item-selected-color item-hover-color'
                                            : 'item-hover-color'
                                    }
                                    onClick={() => {
                                        setCurTrashKey(trash_key);
                                    }}
                                    onContextMenu={() => {
                                        if (curTrashKey !== trash_key) setCurTrashKey(trash_key);
                                    }}
                                >
                                    {arr[3]}
                                </NoteItem>
                            );
                        })}
                    {menu && curTrashKey ? (
                        <MenuUl top={yPos} left={xPos} className="menu-ui-color">
                            <MenuLi
                                className="menu-li-color"
                                onClick={() => fullDeleteNote(curTrashKey)}
                            >
                                彻底删除
                            </MenuLi>
                        </MenuUl>
                    ) : (
                        <></>
                    )}
                </Notes>
            </NotesScroll>
            <CodeMirrorContainer>
                <div ref={editor} className={`${themeClassNames}`} />
            </CodeMirrorContainer>
        </NoteListContainer>
    );
};

const NoteListContainer = styled.div({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '5px',
});

const TrashTool = styled.div({
    display: 'flex',
    alignItem: 'center',
    margin: '5px 0 10px 10px',
});

const CloseTrashListBtn = styled.div({
    width: '20px',
    height: '20px',
    lineHeight: '18px',
    fontSize: '20px',
    padding: '5px 10px',
    margin: '0 0 2px 0',
    cursor: 'pointer',
});

const EmptyTrash = styled.div({
    display: 'flex',
    flexDirection: 'row',
    alignItem: 'center',
    flex: '1',
    minWidth: '0',
});

const EmptyTrashBtn = styled.div({
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

const NotesScroll = styled.div(
    {
        overflow: 'auto',
        margin: '0 10px',
    },
    `
    &::-webkit-scrollbar {
        height: 9px;
    }
    &::-webkit-scrollbar-track {
        background-color: #2C3033;
    }
    &::-webkit-scrollbar-thumb {
        background-color: hsla(0,0%,78%,.2);
        border-radius: 3px;
    }
`
);

const Notes = styled.div(
    {
        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'wrap',
        margin: '8px 0',
        height: 'calc(4 * 36px + 5px)',
    },
    `
    &::-webkit-scrollbar {
        display: none;
    }
`
);

const NoteItem = styled.div({
    position: 'relative',
    height: '36px',
    lineHeight: '36px',
    width: '33%',
    padding: '0 10px',
    margin: '0 10px',
    fontSize: '15px',
    cursor: 'pointer',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
});

const MenuUl = styled.ul(
    {
        listStyleType: 'none',
        position: 'fixed',
        padding: '4px 0',
        border: '1px solid #BABABA',
        color: '#000000',
        backgroundColor: '#FFFFFF',
        zIndex: '4000',
    },
    (props: { top: string; left: string }) => ({
        top: props.top,
        left: props.left,
    })
);

const MenuLi = styled.li(
    {
        padding: '0 22px',
        fontSize: '12px',
        lineHeight: '22px',
        cursor: 'pointer',
    },
    `&:hover {
background-color: #EBEBEB; 
}`
);

const CodeMirrorContainer = styled.div({
    flex: '1',
    minHeight: '0',
    overflowY: 'auto',
    margin: '15px 15px 0 15px',
});

export default TrashList;
