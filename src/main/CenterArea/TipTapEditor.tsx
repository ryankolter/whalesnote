import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight/lib/core';
import { createMarkdownEditor, MarkdownEditor } from 'tiptap-markdown';
const TiptapMarkdownEditor = createMarkdownEditor(Editor);

import { notes, updateNote } from '../../lib/notes';

const TipTapEditor: React.FC<{
    setEditorScrollRatio: React.Dispatch<React.SetStateAction<number>>;
    setRenderScrollRatio: React.Dispatch<React.SetStateAction<number>>;
    setRenderNoteStr: React.Dispatch<React.SetStateAction<string>>;
}> = ({ setEditorScrollRatio, setRenderScrollRatio, setRenderNoteStr }) => {
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
    const { t } = useTranslation();

    const domRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<MarkdownEditor>();

    useEffect(() => {
        if (focus !== '') {
            setTimeout(() => {
                editorRef.current?.commands.focus();
            }, 0);
        }
    }, [focus]);

    useEffect(() => {
        if (blur !== '') {
            setTimeout(() => {
                editorRef.current?.commands.blur();
            }, 0);
        }
    }, [blur]);

    useEffect(() => {
        if (domRef.current) {
            editorRef.current = new TiptapMarkdownEditor({
                element: domRef.current as HTMLDivElement,
                extensions: [
                    StarterKit.configure({
                        codeBlock: false,
                    }),
                    CodeBlockLowlight.configure({
                        lowlight,
                    }),
                ],
                content: '',
            });
        }

        return () => {
            editorRef.current?.destroy();
        };
    }, []);

    const onDocChange = useCallback(() => {
        if (editorRef.current) {
            const new_value = editorRef.current.getMarkdown();
            updateNote(curDataPath, currentRepoKey, currentFolderKey, currentNoteKey, new_value);
            setRenderNoteStr(new_value);

            let line = '';
            const is_with_lf = new_value.indexOf('\n') !== -1;
            if (is_with_lf) {
                let index = 0;
                let max_count = 500;
                while ((line === '' || line === '\n') && index !== -1) {
                    const next_index = new_value.indexOf('\n', index + 1);
                    if (next_index === -1) {
                        line = new_value.substring(index);
                        break;
                    }
                    line = new_value.substring(index, next_index);
                    index = next_index;
                    if (--max_count < 0) break;
                }
            } else {
                line = new_value;
            }

            let new_name = t('note.untitled');
            if (line !== '' && !line.startsWith('\\#')) {
                const replace_line = line.replace(/^[#\-\_*>\s]+/g, '');
                if (replace_line !== '' && !replace_line.startsWith('\\#')) new_name = replace_line;
            }

            renameNote(curDataPath, currentRepoKey, currentFolderKey, currentNoteKey, new_name);
        }
    }, [curDataPath, currentRepoKey, currentFolderKey, currentNoteKey, setRenderNoteStr]);

    useEffect(() => {
        editorRef.current?.on('update', onDocChange);
        return () => {
            editorRef.current?.off('update', onDocChange);
        };
    }, [onDocChange]);
    // onSelectionSet,

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

    const handleScroll = useCallback(
        (e: any) => {},
        [currentRepoKey, currentFolderKey, currentNoteKey, setEditorScrollRatio]
    );

    useEffect(() => {
        domRef.current?.addEventListener('scroll', handleScroll, true);
        return () => {
            domRef.current?.removeEventListener('scroll', handleScroll, true);
        };
    }, [handleScroll]);

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
