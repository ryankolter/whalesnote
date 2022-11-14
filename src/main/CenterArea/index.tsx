import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';
import cryptoRandomString from 'crypto-random-string';

import { useRecordValue } from '../../lib/useRecordValue';
import MarkdownEditor from './MarkdownEditor';
import MarkdownRender from './MarkdownRender';
import useRenderState from '../../lib/useRenderState';
import ToolBar from './ToolBar';

const CenterArea: React.FC<{}> = ({}) => {
    const {
        curDataPath,
        currentRepoKey,
        currentFolderKey,
        currentNoteKey,
        platformName,
        showKeySelect,
        showRepoPanel,
        showSearchPanel,
        manualBlur,
        manualFocus,
        setKeySelectNumArray,
        setShowKeySelect,
        setShowRepoPanel,
    } = useContext(GlobalContext);

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
            currentRepoKey &&
            currentFolderKey &&
            currentNoteKey &&
            renderScrollTops[currentRepoKey] &&
            renderScrollTops[currentRepoKey][currentFolderKey] &&
            renderScrollTops[currentRepoKey][currentFolderKey][currentNoteKey]
                ? renderScrollTops[currentRepoKey][currentFolderKey][currentNoteKey]
                : 0,
        [curDataPath, currentRepoKey, currentFolderKey, currentNoteKey, renderScrollTops]
    );

    const handleKeyDown = useCallback(
        async (e: any) => {
            if (platformName === 'darwin' || platformName === 'win32' || platformName === 'linux') {
                const modKey = platformName === 'darwin' ? e.metaKey : e.ctrlKey;

                // show A0,A1,...,AA,AB,...,Z tips for keyborard
                if (e.key === ',' && modKey) {
                    if (showKeySelect) {
                        setShowKeySelect(false);
                        setKeySelectNumArray([]);
                        if (currentNoteKey && !showRepoPanel) {
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
                        (showKeySelect || showSearchPanel) &&
                        currentNoteKey &&
                        mdRenderState !== 'all'
                    ) {
                        manualFocus(0);
                    }
                    setShowRepoPanel(false);
                }
            }
        },
        [
            currentNoteKey,
            showKeySelect,
            showRepoPanel,
            showSearchPanel,
            manualFocus,
            manualBlur,
            setShowKeySelect,
            setShowRepoPanel,
            nextMdRenderState,
        ]
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
            <MarkdownArea>
                <EditorPanel widthValue={editorWidth}>
                    <MarkdownEditor
                        cursorInRenderFlag={cursorInRenderFlag}
                        mdRenderState={mdRenderState}
                        renderScrollRatio={renderScrollRatio}
                        setEditorScrollRatio={setEditorScrollRatio}
                        setRenderNoteStr={setRenderNoteStr}
                    />
                </EditorPanel>
                <RenderPanel leftValue={renderLeft} widthValue={renderWidth}>
                    {mdRenderState !== 'hidden' ? (
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
                    ) : (
                        <></>
                    )}
                </RenderPanel>
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
    width: 'calc(100% - 29px)',
    paddingLeft: '24px',
    paddingBottom: '24px',
    boxSizing: 'border-box',
});

const EditorPanel = styled.div(
    {
        height: '100%',
    },
    (props: { widthValue: string }) => ({
        width: props.widthValue,
    })
);

const RenderPanel = styled.div(
    {
        position: 'absolute',
        top: '0',
        height: 'calc(100% + 2px)',
        boxSizing: 'border-box',
    },
    (props: { leftValue: string; widthValue: string }) => ({
        left: props.leftValue,
        width: props.widthValue,
    })
);

export default CenterArea;
