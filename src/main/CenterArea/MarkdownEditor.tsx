import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
    MouseEvent,
    useImperativeHandle,
    forwardRef,
} from 'react';
import { useTranslation } from 'react-i18next';

import styled from '@emotion/styled';
import { useDropzone } from 'react-dropzone';
import { EditorView, ViewUpdate } from '@codemirror/view';

import useCodeMirror from '@/lib/useCodeMirror';
import useContextMenu from '@/lib/useContextMenu';
import useEditorPosition from '@/lib/useEditorPosition';
import { updateNote } from '@/lib/notes';
import { useAtomValue, useSetAtom } from 'jotai';
import {
    activeWhaleIdAtom,
    editorFontSizeAtom,
    keySelectActiveAtom,
    platformAtom,
    repoPanelVisibleAtom,
} from '@/atoms';
import { join as pathJoin } from 'path-browserify';
import { useDataContext } from '@/context/DataProvider';

export interface MarkdownEditorRef {
    focus: () => void;
    blur: () => void;
}

interface IMarkdownEditor {
    cursorInRenderFlag: boolean;
    mdRenderState: string;
    renderScrollRatio: number;
    setEditorScrollRatio: React.Dispatch<React.SetStateAction<number>>;
    setRenderNoteStr: React.Dispatch<React.SetStateAction<string>>;
}

const MarkdownEditor = forwardRef<MarkdownEditorRef, IMarkdownEditor>((props, ref) => {
    const {
        cursorInRenderFlag,
        mdRenderState,
        renderScrollRatio,
        setEditorScrollRatio,
        setRenderNoteStr,
    } = props;

    const { curDataPath, curRepoKey, curFolderKey, curNoteKey, renameNote } = useDataContext();

    const platform = useAtomValue(platformAtom);
    const id = useAtomValue(activeWhaleIdAtom);
    const repoPanelVisible = useAtomValue(repoPanelVisibleAtom);
    const setKeySelectActive = useSetAtom(keySelectActiveAtom);

    const { t } = useTranslation();

    const editorFontSize = useAtomValue(editorFontSizeAtom);

    const [topLinePos, cursorHeadPos, updateTopLinePos, updateCursorHeadPos] = useEditorPosition(
        curDataPath,
        curRepoKey,
        curFolderKey,
        curNoteKey,
    );

    const [showEditorScrollPos, setShowEditorScrollPos] = useState(false);
    const [cursorInEditor, setCursorInEditor] = useState(false);
    const autoScroll = useRef(false);
    const scrollSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const scrollRatioSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const { xPos, yPos, menu, showMenu } = useContextMenu(editorContainerRef);

    const onDocChange = useCallback(
        async (new_value: string, vu: ViewUpdate) => {
            await updateNote(id, curDataPath, curRepoKey, curFolderKey, curNoteKey, new_value);
            setRenderNoteStr(new_value);

            const prev_first_line = vu.startState.doc.lineAt(0).text;
            const new_first_line = vu.state.doc.lineAt(0).text;

            if (new_first_line !== prev_first_line) {
                let new_name = t('note.untitled');
                const replace_line = new_first_line.replace(/^[#\-\_*>\s]+/g, '');
                if (replace_line !== '') {
                    new_name = replace_line;
                }

                await renameNote(id, curRepoKey, curFolderKey, curNoteKey, new_name);
            }
        },
        [
            curDataPath,
            curRepoKey,
            curFolderKey,
            curNoteKey,
            id,
            renameNote,
            setRenderNoteStr,
            updateNote,
        ],
    );

    const onSelectionSet = useCallback(
        async (vu: ViewUpdate) => {
            if (view.current && vu.view.hasFocus) {
                setKeySelectActive(false);
                const cursorHeadPos = view.current.state.selection.main.head;
                await updateCursorHeadPos(curRepoKey, curFolderKey, curNoteKey, cursorHeadPos);
            }
        },
        [curDataPath, curRepoKey, curFolderKey, curNoteKey],
    );

    const [editor, view] = useCodeMirror<HTMLDivElement>({
        curDataPath,
        curRepoKey,
        curFolderKey,
        curNoteKey,
        onDocChange,
        onSelectionSet,
    });

    useImperativeHandle(ref, () => ({
        focus: () => {
            view.current?.focus();
        },
        blur: () => {
            view.current?.contentDOM.blur();
        },
    }));

    useEffect(() => {
        autoScroll.current = true;
        topLinePos && topLinePos > 10
            ? setShowEditorScrollPos(true)
            : setShowEditorScrollPos(false);
    }, [curDataPath, curRepoKey, curFolderKey, curNoteKey]);

    useEffect(() => {
        if (view.current && !Number.isNaN(renderScrollRatio)) {
            const offsetHeight = view.current.contentDOM.getBoundingClientRect().height;
            const scrollTop = offsetHeight * renderScrollRatio;
            const scrollPos = view.current.lineBlockAtHeight(scrollTop).from;
            setTimeout(() => {
                view.current?.dispatch({
                    effects: EditorView.scrollIntoView(scrollPos, {
                        y: 'start',
                    }),
                });
            }, 0);
        }
    }, [renderScrollRatio]);

    const autoScrollToLine = useCallback(() => {
        if (view.current) {
            if (topLinePos > 0) {
                const start_line = Math.min(topLinePos, view.current.state.doc.length);
                view.current?.dispatch({
                    effects: EditorView.scrollIntoView(start_line, {
                        y: 'start',
                    }),
                });
            }

            if (cursorHeadPos !== -1) {
                view.current?.focus();
                view.current?.dispatch({
                    selection: { anchor: cursorHeadPos },
                });
            }
        }

        setShowEditorScrollPos(false);
    }, [cursorHeadPos, topLinePos, setShowEditorScrollPos]);

    const copySelection = useCallback(() => {
        if (view.current) {
            const from = view.current.state.selection.main.from;
            const to = view.current.state.selection.main.to;
            if (from < to) {
                const slice_doc = view.current.state.sliceDoc(from, to);
                navigator.clipboard.writeText(slice_doc);
            }
        }
    }, []);

    const cutSelection = useCallback(() => {
        if (view.current) {
            const from = view.current.state.selection.main.from;
            const to = view.current.state.selection.main.to;
            if (from < to) {
                const slice_doc = view.current.state.sliceDoc(from, to);
                navigator.clipboard.writeText(slice_doc);
                view.current.dispatch({
                    changes: {
                        from: from,
                        to: to,
                        insert: '',
                    },
                });
                view.current.focus();
                view.current.dispatch({
                    selection: {
                        anchor: from,
                        head: from,
                    },
                });
            }
        }
    }, []);

    const pasteClipboard = useCallback(() => {
        navigator.clipboard.readText().then((clipText) => {
            if (view.current) {
                const from = view.current.state.selection.main.from;
                const to = view.current.state.selection.main.to;
                view.current.dispatch({
                    changes: {
                        from: from,
                        to: to,
                        insert: clipText,
                    },
                });
                view.current.dispatch({
                    selection: {
                        anchor: from + clipText.length,
                        head: from + clipText.length,
                    },
                });
            }
        });
    }, []);

    const addBacktick = useCallback((num: number) => {
        if (view.current && view.current.hasFocus) {
            const from = view.current.state.selection.main.from;
            const to = view.current.state.selection.main.to;
            view.current.dispatch({
                changes: {
                    from: from,
                    to: to,
                    insert: '`'.repeat(num),
                },
            });
            view.current.dispatch({
                selection: {
                    anchor: from + num,
                    head: from + num,
                },
            });
        }
    }, []);

    const jumpToNextBlock = useCallback(() => {
        if (view.current) {
            const max_position = view.current.state.doc.length;
            let position = view.current.state.selection.main.head;
            let flag = false;
            while (position < max_position) {
                const current_line = view.current.state.doc.lineAt(position);
                if (current_line.text.indexOf('```') !== -1) {
                    flag = true;
                    position = current_line.to + 1;
                    break;
                }
                position = current_line.to + 1;
            }
            if (flag && position <= max_position) {
                view.current.dispatch({
                    selection: {
                        anchor: position,
                        head: position,
                    },
                });
                const scroll_pos = Math.min(position, view.current.state.doc.length);
                view.current.dispatch({
                    effects: EditorView.scrollIntoView(scroll_pos, {
                        y: 'nearest',
                    }),
                });
            }
        }
    }, []);

    const jumpToPreviousBlock = useCallback(() => {
        if (view.current) {
            const min_position = 0;
            let position = view.current.state.selection.main.head;
            let time = 0;
            while (position > min_position) {
                const current_line = view.current.state.doc.lineAt(position);
                if (current_line.text.indexOf('```') !== -1 && time < 2) {
                    time++;
                    if (time === 2) {
                        position = current_line.to + 1;
                        break;
                    }
                }
                position = current_line.from - 1;
            }
            if (time > 0) {
                position = Math.max(position, 0);
                view.current.dispatch({
                    selection: {
                        anchor: position,
                        head: position,
                    },
                });
                view.current.dispatch({
                    effects: EditorView.scrollIntoView(position, {
                        y: 'nearest',
                    }),
                });
            }
        }
    }, []);

    const handleKeyDown = useCallback(
        async (e: KeyboardEvent) => {
            if (platform === 'darwin' || platform === 'win32' || platform === 'linux') {
                const modKey = platform === 'darwin' ? e.metaKey : e.ctrlKey;

                if (
                    e.key === 'j' &&
                    modKey &&
                    !e.shiftKey &&
                    mdRenderState !== 'all' &&
                    !repoPanelVisible
                ) {
                    autoScrollToLine();
                }

                if ((e.key === '1' || e.key === '3') && modKey) {
                    addBacktick(Number(e.key));
                } else if (e.key === '2' && modKey && !e.shiftKey) {
                    jumpToNextBlock();
                } else if (e.key === '2' && modKey && e.shiftKey) {
                    jumpToPreviousBlock();
                }
            }
        },
        [
            mdRenderState,
            platform,
            repoPanelVisible,
            autoScrollToLine,
            addBacktick,
            jumpToNextBlock,
            jumpToPreviousBlock,
        ],
    );

    const handleScroll = useCallback(
        (e: any) => {
            if (cursorInEditor) {
                if (scrollRatioSaveTimerRef.current) {
                    clearTimeout(scrollRatioSaveTimerRef.current);
                }
                scrollRatioSaveTimerRef.current = setTimeout(() => {
                    if (e.target) {
                        const offsetHeight = (e.target as HTMLDivElement).offsetHeight;
                        const scrollTop = (e.target as HTMLDivElement).scrollTop;
                        const scrollHeight = (e.target as HTMLDivElement).scrollHeight;
                        if ((scrollTop + offsetHeight) / scrollHeight > 0.99) {
                            setEditorScrollRatio((scrollTop + offsetHeight) / scrollHeight);
                        } else {
                            setEditorScrollRatio(scrollTop / scrollHeight);
                        }
                    }
                }, 100);
            }
            if (autoScroll.current) {
                setTimeout(() => {
                    autoScroll.current = false;
                }, 100);
                return;
            }
            if (scrollSaveTimerRef.current) {
                clearTimeout(scrollSaveTimerRef.current);
            }
            scrollSaveTimerRef.current = setTimeout(() => {
                if (view.current) {
                    const fromPos = view.current.elementAtHeight(
                        Math.abs(view.current.contentDOM.getBoundingClientRect().top) + 50,
                    ).from;

                    setShowEditorScrollPos(false);
                    updateTopLinePos(curRepoKey, curFolderKey, curNoteKey, fromPos);
                }
            }, 100);
        },
        [
            curRepoKey,
            curFolderKey,
            curNoteKey,
            cursorInEditor,
            setEditorScrollRatio,
            setShowEditorScrollPos,
            updateTopLinePos,
        ],
    );

    const handleMouseEnter = useCallback(() => {
        setCursorInEditor(true);
    }, [setCursorInEditor]);

    const handleMouseLeave = useCallback(() => {
        setCursorInEditor(false);
    }, [setCursorInEditor]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        editor.current?.addEventListener('scroll', handleScroll, true);
        editor.current?.addEventListener('mouseenter', handleMouseEnter);
        editor.current?.addEventListener('mouseleave', handleMouseLeave);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            editor.current?.removeEventListener('scroll', handleScroll, true);
            editor.current?.removeEventListener('mouseenter', handleMouseEnter);
            editor.current?.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [handleKeyDown, handleScroll, handleMouseEnter, handleMouseLeave]);

    const validImageFileType = useRef([
        'jpeg',
        'jpg',
        'png',
        'apng',
        'webp',
        'gif',
        'avif',
        'bmp',
        'tif',
        'tiff',
        'svg',
    ]);
    const validImageMimeType = useRef([
        'image/jpeg',
        'image/png',
        'image/apng',
        'image/webp',
        'image/gif',
        'image/avif',
        'image/bmp',
        'image/tiff',
        'image/svg+xml',
    ]);

    const addMultizero = useCallback((num: number | string, count: number) => {
        return String(num).padStart(count, '0');
    }, []);

    const generateTimeStamp = useCallback(() => {
        const time = new Date();
        const y = time.getFullYear();
        const m = time.getMonth() + 1;
        const d = time.getDate();
        const h = time.getHours();
        const mm = time.getMinutes();
        const s = time.getSeconds();
        const mi = time.getMilliseconds();

        return (
            y +
            addMultizero(m, 2) +
            addMultizero(d, 2) +
            '_' +
            addMultizero(h, 2) +
            addMultizero(mm, 2) +
            addMultizero(s, 2) +
            addMultizero(mi, 3)
        );
    }, []);

    const insertImageMdLink = useCallback(async (file_name_list: string[]) => {
        const md_link_string = file_name_list
            .map((file_name) => {
                const md_link = `![w500](${file_name} "${file_name.substring(
                    0,
                    file_name.lastIndexOf('.'),
                )}")`;
                return md_link;
            })
            .join('\n\n');

        if (view.current) {
            const from = view.current.state.selection.main.from;
            const line = view.current.state.doc.lineAt(from);
            const prefix = line && line.text ? '\n' : '';
            const to = view.current.state.selection.main.to;
            view.current.dispatch({
                changes: {
                    from: from,
                    to: to,
                    insert: prefix + md_link_string + '\n',
                },
            });
            const new_head = from + (prefix ? 1 : 0) + md_link_string.length + 1;
            view.current.dispatch({
                selection: {
                    anchor: new_head,
                    head: new_head,
                },
            });
        }
    }, []);

    const loadImages = useCallback(
        async (paths: string[]) => {
            const len = paths.length;
            const timeStamp = generateTimeStamp();
            const dest_file_name_list = [];
            for (const [index, path] of paths.entries()) {
                const dest_file_name =
                    timeStamp +
                    (len > 1 ? '_' + addMultizero(index, String(len).length) : '') +
                    '.' +
                    path.substring(path.lastIndexOf('.') + 1);
                const result = await window.electronAPI.copy(
                    path,
                    pathJoin(curDataPath + '/images', dest_file_name),
                );
                if (result) {
                    dest_file_name_list.push(dest_file_name);
                }
            }
            await insertImageMdLink(dest_file_name_list);
        },
        [curDataPath, addMultizero, generateTimeStamp, insertImageMdLink],
    );

    const handleLoadImage = useCallback(
        async (e: MouseEvent<HTMLSpanElement>) => {
            e.stopPropagation();
            e.preventDefault();
            showMenu(false);
            const paths = await window.electronAPI.openSelectImagesDialog(
                validImageFileType.current,
            );
            if (paths.length > 0) await loadImages(paths);
        },
        [loadImages, showMenu],
    );

    const handleZoneDrop = useCallback(
        async (acceptedFiles: any) => {
            const dest_file_name_list = [];
            const len = acceptedFiles.length;
            const timeStamp = generateTimeStamp();

            for (const [index, file] of acceptedFiles.entries()) {
                if (!validImageMimeType.current.includes(file.type)) {
                    return;
                }

                const dest_file_name =
                    timeStamp +
                    (len > 1 ? '_' + addMultizero(index, String(len).length) : '') +
                    '.' +
                    file.name.split('.').pop().toLowerCase();

                const result = await window.electronAPI.copy(
                    file.path,
                    pathJoin(curDataPath + '/images', dest_file_name),
                );

                if (result) {
                    dest_file_name_list.push(dest_file_name);
                }
            }
            await insertImageMdLink(dest_file_name_list);
        },
        [curDataPath, addMultizero, generateTimeStamp, insertImageMdLink],
    );

    const { getRootProps } = useDropzone({ onDrop: handleZoneDrop, noClick: true, multiple: true });

    return (
        <MarkdownEditorContainer ref={editorContainerRef} fontSizeValue={editorFontSize}>
            {showEditorScrollPos && mdRenderState !== 'all' ? (
                <LastScrollPos onClick={autoScrollToLine}>{t('editor.last_time')}</LastScrollPos>
            ) : (
                <></>
            )}
            <EditorDragZone {...getRootProps()}>
                <div
                    ref={editor}
                    className={`wn-theme-cm ${
                        cursorInRenderFlag ? 'editor-smooth' : 'editor-auto'
                    }`}
                />
            </EditorDragZone>
            {menu ? (
                <MenuUl top={yPos} left={xPos}>
                    <MenuLi className="menu-li-color" onClick={() => copySelection()}>
                        {t('editor.copy')}
                    </MenuLi>
                    <MenuLi className="menu-li-color" onClick={() => cutSelection()}>
                        {t('editor.cut')}
                    </MenuLi>
                    <MenuLi className="menu-li-color" onClick={() => pasteClipboard()}>
                        {t('editor.paste')}
                    </MenuLi>
                    <MenuLi className="menu-li-color" onClick={handleLoadImage}>
                        {t('editor.insert_image')}
                    </MenuLi>
                </MenuUl>
            ) : (
                <></>
            )}
        </MarkdownEditorContainer>
    );
});

const MarkdownEditorContainer = styled.div(
    {
        position: 'relative',
        width: '100%',
        height: '100%',
        fontSize: '15px',
    },
    (props: { fontSizeValue: string }) => ({
        fontSize: props.fontSizeValue + 'px',
    }),
);

const EditorDragZone = styled.div({
    width: '100%',
    height: '100%',
});

const LastScrollPos = styled.div(
    {
        position: 'absolute',
        left: '15px',
        bottom: '100px',
        height: '30px',
        lineHeight: '30px',
        fontSize: '16px',
        padding: '0 12px 0 6px',
        zIndex: 1000,
        cursor: 'pointer',
        backgroundColor: 'var(--main-btn-bg-color)',
    },
    `
    &:before {
        border: 15px dashed transparent;
        border-right: 15px solid var(--main-btn-bg-color);
        content: "";
        font-size: 0;
        height: 0;
        left: -15px;
        transform: translateX(-50%);
        overflow: hidden;
        position: absolute;
        top: 0;
        width: 0;
    }
`,
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
    }),
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
`,
);

export default MarkdownEditor;
