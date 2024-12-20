import { MutableRefObject, useCallback, useEffect, useMemo, useRef } from 'react';
import { basicSetup } from 'codemirror';
import { EditorState, StateEffect } from '@codemirror/state';
import { EditorView, keymap, ViewUpdate } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';
import { indentRange, indentUnit } from '@codemirror/language';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { Completion, autocompletion } from '@codemirror/autocomplete';

import { notes } from '../../../../lib/notes';
import { useAtomValue } from 'jotai';
import { activeWhaleIdAtom } from '@/atoms';

interface Props {
    curDataPath: string;
    curRepoKey: string;
    curFolderKey: string;
    curNoteKey: string;
    onDocChange?: (new_value: string, viewUpdate: ViewUpdate) => void;
    onSelectionSet?: (vu: ViewUpdate) => void;
}

export const useCodeMirror = <T extends Element>({
    curDataPath,
    curRepoKey,
    curFolderKey,
    curNoteKey,
    onDocChange,
    onSelectionSet,
}: Props): [MutableRefObject<T | null>, MutableRefObject<EditorView | null>] => {
    const editor = useRef<T | null>(null);
    const view = useRef<EditorView | null>(null);
    const forbidUpdate = useRef<boolean>(false);

    const id = useAtomValue(activeWhaleIdAtom);

    const defaultThemeOption = useMemo(
        () =>
            EditorView.theme({
                '&': {
                    height: '100%',
                },
            }),
        [],
    );

    const docUpdateListener = useMemo(
        () =>
            EditorView.updateListener.of((vu: ViewUpdate) => {
                if (vu.docChanged && onDocChange && typeof onDocChange === 'function') {
                    if (!forbidUpdate.current) {
                        const doc = vu.state.doc;
                        const value = doc.toString();
                        onDocChange(value, vu);
                    }
                }
            }),
        [onDocChange],
    );

    const cursorActiveListener = useMemo(
        () =>
            EditorView.updateListener.of((vu: ViewUpdate) => {
                if (vu.selectionSet && onSelectionSet && typeof onSelectionSet === 'function') {
                    onSelectionSet(vu);
                }
            }),
        [onSelectionSet],
    );

    const myCompletions = useCallback((CompletionContext: any) => {
        const word = CompletionContext.matchBefore(/\s*```[a-z]+/);
        const assistant_word = CompletionContext.matchBefore(/```[a-z]+/);

        if (!word || (word.from == word.to && !CompletionContext.explicit)) return null;

        const space_count = assistant_word.from - word.from;

        const langs = [
            'bash',
            'cpp',
            'css',
            'go',
            'html',
            'java',
            'js',
            'json',
            'md',
            'php',
            'python',
            'rust',
            'sql',
            'swift',
            'xml',
            'yaml',
        ];
        const options = [];
        const newPosOffset = assistant_word.from + 3;

        for (const lang of langs) {
            let label = '```' + lang + '\n';
            for (let i = 0; i < space_count; ++i) {
                label += ' ';
            }
            label += '\n';
            for (let i = 0; i < space_count; ++i) {
                label += ' ';
            }
            label += '```';
            label += '\n';
            for (let i = 0; i < space_count; ++i) {
                label += ' ';
            }
            options.push({
                label,
                apply: (view: EditorView, completion: Completion, from: number, to: number) => {
                    view.dispatch({
                        changes: {
                            from: word.from + space_count,
                            to: word.to,
                            insert: label,
                        },
                    });
                    view.dispatch({
                        selection: {
                            anchor: newPosOffset + lang.length + 1 + space_count,
                            head: newPosOffset + lang.length + 1 + space_count,
                        },
                    });
                },
            });
        }

        return {
            from: word.from + space_count,
            to: word.to,
            options,
        };
    }, []);

    const indentOnPasteExtension = useMemo(
        () =>
            EditorView.updateListener.of((update) => {
                if (update.transactions.some((tr) => tr.isUserEvent('input.paste'))) {
                    const { state, view } = update;

                    update.transactions.forEach((tr) => {
                        if (tr.isUserEvent('input.paste')) {
                            tr.changes.iterChanges((from) => {
                                const to = state.selection.ranges[0].to;
                                const safeFrom = Math.max(0, Math.min(from, state.doc.length));
                                const safeTo = Math.max(0, Math.min(to, state.doc.length));

                                if (safeFrom < safeTo) {
                                    const changes = indentRange(state, safeFrom, safeTo);
                                    if (changes) view.dispatch({ changes });
                                }
                            });
                        }
                    });
                }
            }),
        [],
    );

    const getExtensions = useMemo(
        () => [
            basicSetup,
            defaultThemeOption,
            oneDark,
            docUpdateListener,
            cursorActiveListener,
            keymap.of([indentWithTab]),
            EditorView.lineWrapping,
            markdown({ base: markdownLanguage, addKeymap: false, codeLanguages: languages }),
            indentUnit.of('  '),
            indentOnPasteExtension,
            autocompletion({
                activateOnTyping: true,
                aboveCursor: true,
                override: [myCompletions],
            }),
        ],
        [docUpdateListener, cursorActiveListener, indentOnPasteExtension, myCompletions],
    );

    useEffect(() => {
        if (editor.current) {
            const value =
                curRepoKey &&
                curFolderKey &&
                curNoteKey &&
                notes[id] &&
                notes[id][curRepoKey] &&
                notes[id][curRepoKey][curFolderKey] &&
                notes[id][curRepoKey][curFolderKey][curNoteKey]
                    ? notes[id][curRepoKey][curFolderKey][curNoteKey]
                    : '';
            const defaultState = EditorState.create({
                doc: value,
                extensions: [...getExtensions],
            });
            view.current = new EditorView({
                state: defaultState,
                parent: editor.current,
            });
        }

        return () => {
            view.current?.destroy();
            view.current = null;
        };
    }, []);

    useEffect(() => {
        view.current?.dispatch({
            effects: StateEffect.reconfigure.of([...getExtensions]),
        });
    }, [getExtensions]);

    useEffect(() => {
        forbidUpdate.current = true;
        setTimeout(() => {
            forbidUpdate.current = false;
        }, 500);

        const value =
            curRepoKey &&
            curFolderKey &&
            curNoteKey &&
            notes[id] &&
            notes[id][curRepoKey] &&
            notes[id][curRepoKey][curFolderKey] &&
            notes[id][curRepoKey][curFolderKey][curNoteKey]
                ? notes[id][curRepoKey][curFolderKey][curNoteKey]
                : '';

        const newState = EditorState.create({
            doc: value,
            extensions: [...getExtensions, EditorView.editable.of(false)],
        });
        view.current?.setState(newState);

        setTimeout(() => {
            view.current?.dispatch({
                effects: EditorView.scrollIntoView(0, {
                    y: 'start',
                }),
            });
        }, 0);

        setTimeout(() => {
            view.current?.dispatch({
                effects: StateEffect.reconfigure.of([
                    ...getExtensions,
                    EditorView.editable.of(true),
                ]),
            });
        }, 250);
    }, [curDataPath, curRepoKey, curFolderKey, curNoteKey]);

    return [editor, view];
};
