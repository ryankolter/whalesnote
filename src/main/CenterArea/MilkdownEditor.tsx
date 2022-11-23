import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';
import { defaultValueCtx, Editor, rootCtx } from '@milkdown/core';

import { commonmark } from '@milkdown/preset-commonmark';
import { block } from '@milkdown/plugin-block';
import { clipboard } from '@milkdown/plugin-clipboard';
import { cursor } from '@milkdown/plugin-cursor';
import { history } from '@milkdown/plugin-history';
/* eslint-disable */
//@ts-ignore
import { indent, indentPlugin } from '@milkdown/plugin-indent';
/* eslint-enable */
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { math } from '@milkdown/plugin-math';
import { prism } from '@milkdown/plugin-prism';
import { slash } from '@milkdown/plugin-slash';
import { gfm } from '@milkdown/preset-gfm';
import { nord } from '@milkdown/theme-nord';
import { menu } from '@milkdown/plugin-menu';

import 'prism-themes/themes/prism-solarized-dark-atom.min.css';

import { notes } from '../../lib/notes';

const MilkdownEditor: React.FC<{}> = ({}) => {
    const {
        blur,
        curDataPath,
        currentRepoKey,
        currentFolderKey,
        currentNoteKey,
        editorFontSize,
        focus,
        platformName,
        showRepoPanel,
        renameNote,
        setShowKeySelect,
    } = useContext(GlobalContext);

    const domRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<Editor>();

    useEffect(() => {
        const value =
            currentRepoKey &&
            currentFolderKey &&
            currentNoteKey &&
            notes[currentRepoKey] &&
            notes[currentRepoKey][currentFolderKey] &&
            notes[currentRepoKey][currentFolderKey][currentNoteKey]
                ? notes[currentRepoKey][currentFolderKey][currentNoteKey]
                : '';

        Editor.make()
            .use(nord)
            .use(history)
            .use(cursor)
            .use(clipboard)
            .use(block)
            .use(listener)
            .use(gfm)
            .use(prism)
            .use(slash)
            .use(
                indent.configure(indentPlugin, {
                    type: 'tab',
                    size: 4,
                })
            )
            .use(math)
            .config((ctx) => {
                ctx.set(rootCtx, domRef.current);
                ctx.set(defaultValueCtx, value);
            })
            .create()
            .then((editor) => {
                editorRef.current = editor;
            });

        return () => {
            editorRef.current?.destroy();
        };
    }, [currentRepoKey, currentFolderKey, currentNoteKey]);

    return (
        <MilkdownEditorContainer fontSizeValue={editorFontSize}>
            <MilkdownEditorBox ref={domRef} />
        </MilkdownEditorContainer>
    );
};

const MilkdownEditorContainer = styled.div(
    {
        height: '100%',
    },
    (props: { fontSizeValue: string }) => ({
        fontSize: props.fontSizeValue + 'px',
    })
);

const MilkdownEditorBox = styled.div({
    height: '100%',
});

export default MilkdownEditor;
