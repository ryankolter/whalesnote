import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';

import { basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';
import { indentUnit } from '@codemirror/language';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';

import { usePopUp } from '@/lib/usePopUp';
import { AlertPopUp } from '@/components/AlertPopUp';
import { useDataContext } from '@/context/DataProvider';

const TrashList: React.FC<{}> = ({}) => {
    const { curDataPath } = useDataContext();
    const { t } = useTranslation();
    const editor = useRef<HTMLDivElement>(null);
    const view = useRef<EditorView>();
    const noteScrollRef = useRef<HTMLDivElement>(null);
    const trash = useRef({});
    const [curTrashKey, setCurTrashKey] = useState('---');
    const [emptyPopUp, setEmptyPopUp, emptyMask] = usePopUp(500);

    const handleEmptyTrash = useCallback(async () => {
        const result = await window.electronAPI.remove(`${curDataPath}/trash.json`);

        if (result) {
            setCurTrashKey('---');
            trash.current = {};
        }
    }, [curDataPath, setCurTrashKey]);

    const emptyTrashListConfirm = useCallback(() => {
        handleEmptyTrash();
        setEmptyPopUp(false);
    }, [handleEmptyTrash, setEmptyPopUp]);

    useEffect(() => {
        (async () => {
            const read_trash = await window.electronAPI.readJsonSync(`${curDataPath}/trash.json`);

            trash.current = read_trash ? read_trash : {};
            const len = Object.keys(trash.current).length;
            if (len > 0) {
                setCurTrashKey(Object.keys(trash.current)[len - 1]);
            }
        })();
    }, []);

    const getExtensions = [
        basicSetup,
        oneDark,
        keymap.of([indentWithTab]),
        EditorView.lineWrapping,
        indentUnit.of('    '),
        markdown({ base: markdownLanguage, addKeymap: false, codeLanguages: languages }),
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
            content = content || t('assistant.trash.content_empty');
            const newState = EditorState.create({
                doc: content,
                extensions: [...getExtensions],
            });
            view.current?.setState(newState);
        }
    }, [curTrashKey]);

    const handleWhell = useCallback((e: WheelEvent) => {
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
            <ChildPart>
                <PartTitle>
                    <PartTitleName>{t('assistant.trash.deleted')}</PartTitleName>
                    <EmptyTrash>
                        <EmptyTrashBtn
                            onClick={() => {
                                setEmptyPopUp(true);
                            }}
                        >
                            <div>{t('assistant.trash.empty_btn')}</div>
                        </EmptyTrashBtn>
                    </EmptyTrash>
                </PartTitle>
            </ChildPart>
            <NotesScroll ref={noteScrollRef}>
                <Notes>
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
                </Notes>
            </NotesScroll>
            <CodeMirrorContainer
                style={{ visibility: curTrashKey === '---' ? 'hidden' : 'visible' }}
            >
                <div ref={editor} className={'wn-theme-cm'} />
            </CodeMirrorContainer>
            <AlertPopUp
                popupState={emptyPopUp}
                maskState={emptyMask}
                content={t('tips.about_to_empty_the_trash')}
                onCancel={() => setEmptyPopUp(false)}
                onConfirm={emptyTrashListConfirm}
            ></AlertPopUp>
        </NoteListContainer>
    );
};

const NoteListContainer = styled.div({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '0 5px',
});

const ChildPart = styled.div({
    padding: '10px',
});

const PartTitle = styled.div({
    display: 'flex',
    alignItem: 'center',
    justifyContent: 'space-between',
    fontSize: '15px',
    fontWeight: '500',
    marginBottom: '5px',
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
        background-color: inherit;
    }
    &::-webkit-scrollbar-thumb {
        background-color: var(--main-scroller-bg-color);
        border-radius: 3px;
    }
`,
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
`,
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
`,
);

const CodeMirrorContainer = styled.div({
    flex: '1',
    minHeight: '0',
    overflowY: 'auto',
    margin: '15px 15px 0 15px',
});

export default TrashList;
