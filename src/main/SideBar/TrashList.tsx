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
    const { curDataPath } = useContext(GlobalContext);

    const editor = useRef<HTMLDivElement>(null);
    const view = useRef<EditorView>();
    const noteScrollRef = useRef<HTMLDivElement>(null);

    const trash = useRef({});
    const [curTrashKey, setCurTrashKey] = useState('---');

    const outerRef = useRef(null);
    const { xPos, yPos, menu } = useContextMenu(outerRef);

    const fullDeleteNote = useCallback((trash_key: string) => {}, []);

    const handleEmptyTrash = useCallback(() => {
        const result = ipcRenderer.sendSync('remove', {
            file_path: `${curDataPath}/trash.cson`,
        });

        if (result) {
            setCurTrashKey('---');
            trash.current = {};
        }
    }, [curDataPath, setCurTrashKey]);

    useEffect(() => {
        const read_trash = ipcRenderer.sendSync('readCson', {
            file_path: `${curDataPath}/trash.cson`,
        });

        trash.current = read_trash ? read_trash : {};
        const len = Object.keys(trash.current).length;
        if (len > 0) {
            setCurTrashKey(Object.keys(trash.current)[len - 1]);
        }
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

    return (
        <NoteListContainer>
            <TrashTool>
                <CloseTrashListBtn
                    onClick={() => {
                        closeAssistantPanel();
                    }}
                >
                    x
                </CloseTrashListBtn>
            </TrashTool>
            <ChildPart>
                <PartTitle>
                    <PartTitleName>已删除笔记</PartTitleName>
                    <EmptyTrash>
                        <EmptyTrashBtn
                            onClick={() => {
                                handleEmptyTrash();
                            }}
                        >
                            <div>清空</div>
                        </EmptyTrashBtn>
                    </EmptyTrash>
                </PartTitle>
            </ChildPart>
            <NotesScroll ref={noteScrollRef}>
                <Notes ref={outerRef}>
                    {Object.keys(trash.current)
                        ?.reverse()
                        .map((trash_key: string) => {
                            const arr = trash_key.split('-');
                            return (
                                <NoteItem
                                    key={arr[2]}
                                    style={
                                        curTrashKey === trash_key
                                            ? { backgroundColor: 'var(--main-selected-bg-color)' }
                                            : {}
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
                        <MenuUl top={yPos} left={xPos}>
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
            <CodeMirrorContainer
                style={{ visibility: curTrashKey === '---' ? 'hidden' : 'visible' }}
            >
                <div ref={editor} className={'wn-theme-cm'} />
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
    justifyContent: 'flex-end',
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

const ChildPart = styled.div({
    padding: '10px',
});

const PartTitle = styled.div({
    display: 'flex',
    alignItem: 'center',
    justifyContent: 'space-between',
    fontSize: '18px',
    fontWeight: '500',
    marginBottom: '15px',
    paddingBottom: '4px',
    borderBottom: '1px solid var(--main-border-color)',
});

const PartTitleName = styled.div({
    height: '28px',
    lineHeight: '28px',
});

const EmptyTrash = styled.div({
    display: 'flex',
    flexDirection: 'row',
    alignItem: 'center',
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
    backgroundColor: 'var(--main-btn-bg-color)',
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
        height: 'calc(4 * 36px)',
    },
    `
    &::-webkit-scrollbar {
        display: none;
    }
`
);

const NoteItem = styled.div(
    {
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
    },
    `
    &:hover {
        color: var(--main-text-hover-color);
    }
`
);

const MenuUl = styled.ul(
    {
        listStyleType: 'none',
        position: 'fixed',
        padding: '4px',
        borderRadius: '5px',
        zIndex: '4000',
        border: '1px solid var(--menu-border-color)',
        color: 'var(--menu-text-color)',
        backgroundColor: 'var(--menu-bg-color)',
    },
    (props: { top: string; left: string }) => ({
        top: props.top,
        left: props.left,
    })
);

const MenuLi = styled.li(
    {
        padding: '0 10px',
        fontSize: '13px',
        fontWeight: '500',
        lineHeight: '22px',
        letterSpacing: '1px',
        cursor: 'pointer',
    },
    `
    &:hover {
        border-radius: 4px;
        background-color: var(--menu-hover-color);
    }
`
);

const CodeMirrorContainer = styled.div({
    flex: '1',
    minHeight: '0',
    overflowY: 'auto',
    margin: '15px 15px 0 15px',
});

export default TrashList;
