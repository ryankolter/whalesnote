import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';

import { useRecordValue } from '../../lib/useRecordValue';
import MarkdownEditor from './MarkdownEditor';
import MarkdownRender from './MarkdownRender';
// import TipTapEditor from './TipTapEditor';
import useRenderState from '../../lib/useRenderState';
import ToolBar from './ToolBar';
import { notes } from '../../lib/notes';
import { useDataContext } from '@/context/DataProvider';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
    activeWhaleIdAtom,
    platformAtom,
    repoPanelVisibleAtom,
    searchPanelVisibleAtom,
} from '@/atoms';

const CenterArea: React.FC<{}> = ({}) => {
    const {
        showKeySelect,
        showSearchResultHighlight,
        manualBlur,
        manualFocus,
        setKeySelectNumArray,
        setShowKeySelect,
    } = useContext(GlobalContext);

    const { curDataPath, curRepoKey, curFolderKey, curNoteKey } = useDataContext();

    const platform = useAtomValue(platformAtom);
    const id = useAtomValue(activeWhaleIdAtom);
    const [searchPanelVisible, setSearchPanelVisible] = useAtom(searchPanelVisibleAtom);
    const [repoPanelVisible, setRepoPanelVisible] = useAtom(repoPanelVisibleAtom);

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
                    if (showKeySelect) {
                        setShowKeySelect(false);
                        setKeySelectNumArray([]);
                        if (curNoteKey && !repoPanelVisible) {
                            manualFocus(0);
                        }
                    } else {
                        setShowKeySelect(true);
                        setKeySelectNumArray([]);
                        //只有这里才会让它初始化为显示框框
                        manualBlur(0);
                    }
                }

                //switch among hidden, half, all
                if (e.key === '/' && modKey && !e.shiftKey) {
                    nextMdRenderState();
                }

                //normal enter and extra enter
                if (!composing.current && e.key === 'Enter') {
                    if (showKeySelect) {
                        setShowKeySelect(false);
                        setKeySelectNumArray([]);
                    }
                    if (
                        (showKeySelect || (searchPanelVisible && showSearchResultHighlight)) &&
                        curNoteKey &&
                        mdRenderState !== 'all'
                    ) {
                        manualFocus(0);
                    }
                    setRepoPanelVisible(false);
                }
            }
        },
        [
            curNoteKey,
            showKeySelect,
            repoPanelVisible,
            searchPanelVisible,
            showSearchResultHighlight,
            manualFocus,
            manualBlur,
            setShowKeySelect,
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
