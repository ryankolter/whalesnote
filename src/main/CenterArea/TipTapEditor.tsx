import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';

import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight/lib/core';
import { createMarkdownEditor } from 'tiptap-markdown';
const TiptapMarkdownEditor = createMarkdownEditor(Editor);

import { notes } from '../../lib/notes';

const TipTapEditor: React.FC<{}> = ({}) => {
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
        if (domRef.current) {
            const value =
                currentRepoKey &&
                currentFolderKey &&
                currentNoteKey &&
                notes[currentRepoKey] &&
                notes[currentRepoKey][currentFolderKey] &&
                notes[currentRepoKey][currentFolderKey][currentNoteKey]
                    ? notes[currentRepoKey][currentFolderKey][currentNoteKey]
                    : '';

            editorRef.current = new TiptapMarkdownEditor({
                element: domRef.current as HTMLDivElement,
                extensions: [
                    StarterKit,
                    CodeBlockLowlight.configure({
                        lowlight,
                    }),
                ],
                content: value,
            });
        }

        return () => {
            editorRef.current?.destroy();
        };
    }, []);

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

        editorRef.current?.commands.setContent(value);
    }, [currentRepoKey, currentFolderKey, currentNoteKey]);

    return (
        <MilkdownEditorContainer fontSizeValue={editorFontSize}>
            <MilkdownEditorBox ref={domRef} spellCheck={false} />
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

export default TipTapEditor;
