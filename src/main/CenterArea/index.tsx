import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';

import { useRecordValue } from '@/lib/useRecordValue';
import MarkdownEditor, { MarkdownEditorRef } from './MarkdownEditor';
import MarkdownRender from './MarkdownRender';
// import TipTapEditor from './TipTapEditor';
import useRenderState from '@/lib/useRenderState';
import ToolBar from './ToolBar';
import { notes } from '@/lib/notes';
import { useDataContext } from '@/context/DataProvider';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
    activeWhaleIdAtom,
    editorRefAtom,
    keySelectActiveAtom,
    keySelectNumArrAtom,
    platformAtom,
    repoPanelVisibleAtom,
    searchListFocusedAtom,
    searchPanelVisibleAtom,
} from '@/atoms';

const CenterArea: React.FC<{}> = () => {
    const { curDataPath, curRepoKey, curFolderKey, curNoteKey } = useDataContext();

    const platform = useAtomValue(platformAtom);
    const id = useAtomValue(activeWhaleIdAtom);
    const [searchPanelVisible, setSearchPanelVisible] = useAtom(searchPanelVisibleAtom);
    const searchListFocused = useAtomValue(searchListFocusedAtom);
    const [repoPanelVisible, setRepoPanelVisible] = useAtom(repoPanelVisibleAtom);
    const [keySelectActive, setKeySelectActive] = useAtom(keySelectActiveAtom);
    const setKeySelectNumArr = useSetAtom(keySelectNumArrAtom);

    const [
        editorWidth,
        renderWidth,
        renderLeft,
        mdRenderState,
        setMdRenderState,
        nextMdRenderState,
    ] = useRenderState();
    const [cursorInRenderFlag, setCursorInRenderFlag] = useState(false);
    const [editorScrollRatio, setEditorScrollRatio] = useState(0);
    const [renderScrollRatio, setRenderScrollRatio] = useState(0);
    const [renderNoteStr, setRenderNoteStr] = useState('');
    const [renderScrollTops, { updateRecordValue: updateRenderScrollTop }] =
        useRecordValue<number>();

    const composing = useRef(false);
    const editorRef = useAtomValue(editorRefAtom);

    const renderScrollTop = useMemo(
        () =>
            curRepoKey &&
            curFolderKey &&
            curNoteKey &&
            renderScrollTops[curRepoKey] &&
            renderScrollTops[curRepoKey][curFolderKey] &&
            renderScrollTops[curRepoKey][curFolderKey][curNoteKey]
                ? renderScrollTops[curRepoKey][curFolderKey][curNoteKey]
                : 0,
        [curDataPath, curRepoKey, curFolderKey, curNoteKey, renderScrollTops],
    );

    useEffect(() => {
        const str =
            curRepoKey &&
            curFolderKey &&
            curNoteKey &&
            notes[id][curRepoKey] &&
            notes[id][curRepoKey][curFolderKey] &&
            notes[id][curRepoKey][curFolderKey][curNoteKey]
                ? notes[id][curRepoKey][curFolderKey][curNoteKey]
                : '';
        setRenderNoteStr(str);
    }, [curDataPath, curRepoKey, curFolderKey, curNoteKey]);

    const handleKeyDown = useCallback(
        async (e: any) => {
            if (platform === 'darwin' || platform === 'win32' || platform === 'linux') {
                const modKey = platform === 'darwin' ? e.metaKey : e.ctrlKey;

                // show A0,A1,...,AA,AB,...,Z tips for keyborard
                if (e.key === ',' && modKey) {
                    if (keySelectActive) {
                        setKeySelectActive(false);
                        setKeySelectNumArr([]);
                        if (curNoteKey && !repoPanelVisible) {
                            editorRef.current?.focus();
                        }
                    } else {
                        setKeySelectActive(true);
                        setKeySelectNumArr([]);
                        //只有这里才会让它初始化为显示框框
                        editorRef.current?.blur();
                    }
                }

                //switch among hidden, half, all
                if (e.key === '.' && modKey && !e.shiftKey) {
                    nextMdRenderState();
                }

                //normal enter and extra enter
                if (!composing.current && e.key === 'Enter') {
                    if (keySelectActive) {
                        setKeySelectActive(false);
                        setKeySelectNumArr([]);
                    }
                    if (
                        (keySelectActive || (searchPanelVisible && searchListFocused)) &&
                        curNoteKey &&
                        mdRenderState !== 'all'
                    ) {
                        editorRef.current?.focus();
                    }
                    setRepoPanelVisible(false);
                }
            }
        },
        [
            curNoteKey,
            editorRef,
            keySelectActive,
            repoPanelVisible,
            searchPanelVisible,
            searchListFocused,
            setKeySelectActive,
            setRepoPanelVisible,
            nextMdRenderState,
        ],
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('compositionstart', () => {
            composing.current = true;
        });
        document.addEventListener('compositionend', () => {
            composing.current = false;
        });
        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('compositionstart', () => {
                composing.current = true;
            });
            document.removeEventListener('compositionend', () => {
                composing.current = false;
            });
        };
    }, [handleKeyDown]);

    return (
        <CenterAreaContainer>
            <ToolBar mdRenderState={mdRenderState} setMdRenderState={setMdRenderState} />
            <MarkdownArea
                onClick={() => {
                    setRepoPanelVisible(false);
                    setSearchPanelVisible(false);
                }}
            >
                {/* <TipTapEditor
                    setRenderNoteStr={setRenderNoteStr}
                    setEditorScrollRatio={setEditorScrollRatio}
                    setRenderScrollRatio={setRenderScrollRatio}
                /> */}
                {mdRenderState === 'hidden' || mdRenderState === 'half' ? (
                    <EditorPanel widthValue={editorWidth}>
                        <MarkdownEditor
                            ref={editorRef}
                            cursorInRenderFlag={cursorInRenderFlag}
                            mdRenderState={mdRenderState}
                            renderScrollRatio={renderScrollRatio}
                            setEditorScrollRatio={setEditorScrollRatio}
                            setRenderNoteStr={setRenderNoteStr}
                        />
                    </EditorPanel>
                ) : (
                    <></>
                )}
                {mdRenderState === 'all' || mdRenderState === 'half' ? (
                    <RenderPanel leftValue={renderLeft} widthValue={renderWidth}>
                        <MarkdownRender
                            cursorInRenderFlag={cursorInRenderFlag}
                            setCursorInRenderFlag={setCursorInRenderFlag}
                            mdRenderState={mdRenderState}
                            editorScrollRatio={editorScrollRatio}
                            setRenderScrollRatio={setRenderScrollRatio}
                            renderScrollTop={renderScrollTop}
                            updateRenderScrollTop={updateRenderScrollTop}
                            renderNoteStr={renderNoteStr}
                        />
                    </RenderPanel>
                ) : (
                    <></>
                )}
            </MarkdownArea>
        </CenterAreaContainer>
    );
};

const CenterAreaContainer = styled.div({
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    flex: '1',
    minWidth: '0',
    height: '100%',
    boxSizing: 'border-box',
});

const MarkdownArea = styled.div({
    position: 'relative',
    flex: '1',
    minHeight: '0',
    width: '100%',
    paddingLeft: '20px',
    paddingRight: '20px',
    boxSizing: 'border-box',
    background: 'var(--editor-main-bg-color) !important',
});

const EditorPanel = styled.div(
    {
        height: '100%',
    },
    (props: { widthValue: string }) => ({
        width: props.widthValue,
    }),
);

const RenderPanel = styled.div(
    {
        position: 'absolute',
        top: '0',
        height: '100%',
        boxSizing: 'border-box',
    },
    (props: { leftValue: string; widthValue: string }) => ({
        left: props.leftValue,
        width: props.widthValue,
    }),
);

export default CenterArea;
