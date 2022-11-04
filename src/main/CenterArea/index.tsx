import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';
import cryptoRandomString from 'crypto-random-string';

import { useRecordValue } from '../../lib/useRecordValue';
import { MarkdownEditor } from './MarkdownEditor';
import { MarkdownRender } from './MarkdownRender';
import useRenderState from '../../lib/useRenderState';
import BottomRow from './BottomRow';

const CenterArea: React.FC<{}> = ({}) => {
    const {
        dataPathChangeFlag,
        curDataPath,
        currentRepoKey,
        currentFolderKey,
        currentNoteKey,
        whalenote,
        theme,
        platformName,
        setNumArray,
        setFocus,
        setBlur,
        keySelect,
        setKeySelect,
    } = useContext(GlobalContext);

    const [
        editorWidth,
        renderWidth,
        renderLeft,
        mdRenderState,
        setMdRenderState,
        nextMdRenderState,
    ] = useRenderState();
    const [cursorInRender, setCursorInRender] = useState(false);
    const [editorScrollRatio, setEditorScrollRatio] = useState(0);
    const [renderScrollRatio, setRenderScrollRatio] = useState(0);
    const [renderNoteStr, setRenderNoteStr] = useState<string>('');
    const [renderScrollTops, { updateRecordValue: updateRenderScrollTop }] =
        useRecordValue<number>();

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

                // normal number 0 and extra number 0
                if ((e.keyCode === 48 || e.keyCode === 96) && modKey) {
                    if (keySelect) {
                        setKeySelect(false);
                        setNumArray([]);
                        if (currentNoteKey) {
                            setTimeout(() => {
                                setFocus(
                                    cryptoRandomString({
                                        length: 24,
                                        type: 'alphanumeric',
                                    })
                                );
                            }, 0);
                        }
                    } else {
                        setKeySelect(true);
                        setNumArray([]);
                        //只有这里才会让它初始化为显示框框
                        setBlur(
                            cryptoRandomString({
                                length: 24,
                                type: 'alphanumeric',
                            })
                        );
                    }
                }

                //switch among hidden, half, all
                if (e.key === '/' && modKey && !e.shiftKey) {
                    nextMdRenderState();
                }
            }
        },
        [currentNoteKey, keySelect, setBlur, setFocus, setKeySelect, nextMdRenderState]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    return (
        <CenterAreaContainer>
            <TopRow>
                <EditorTools></EditorTools>
            </TopRow>
            <MarkdownArea>
                <EditorPanel widthValue={editorWidth}>
                    <MarkdownEditor
                        cursorInRender={cursorInRender}
                        mdRenderState={mdRenderState}
                        renderScrollRatio={renderScrollRatio}
                        setEditorScrollRatio={setEditorScrollRatio}
                        setRenderNoteStr={setRenderNoteStr}
                    />
                </EditorPanel>
                <RenderPanel leftValue={renderLeft} widthValue={renderWidth}>
                    {mdRenderState !== 'hidden' ? (
                        <MarkdownRender
                            cursorInRender={cursorInRender}
                            setCursorInRender={setCursorInRender}
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
            {dataPathChangeFlag > 0 ? (
                <BottomRow
                    mdRenderState={mdRenderState}
                    setMdRenderState={setMdRenderState}
                ></BottomRow>
            ) : (
                <></>
            )}
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

const TopRow = styled.div(
    {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        height: '49px',
        borderBottom: '1px solid var(--main-border-color)',
        paddingRight: '30px',
        boxSizing: 'border-box',
    },
    `
    -webkit-app-region: drag;
`
);

const EditorTools = styled.div({
    display: 'flex',
    alignItems: 'center',
    flex: '1',
    minWidth: '0',
});

const MarkdownArea = styled.div({
    position: 'relative',
    flex: '1',
    minHeight: '0',
    width: 'calc(100% - 29px)',
    paddingLeft: '24px',
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
