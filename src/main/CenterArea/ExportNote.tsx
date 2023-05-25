import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import markdownIt from 'markdown-it';
import { lowlight } from 'lowlight';
import { toHtml } from 'hast-util-to-html';
/* eslint-disable */
//@ts-ignore
import markdownItEmoji from 'markdown-it-emoji';
//@ts-ignore
import markdownItFootnote from 'markdown-it-footnote';
//@ts-ignore
import markdownItLinkAttributes from 'markdown-it-link-attributes';
//@ts-ignore
import markdownItSub from 'markdown-it-sub';
//@ts-ignore
import markdownItSup from 'markdown-it-sup';
//@ts-ignore
import markdownItTaskLists from 'markdown-it-task-lists';
//@ts-ignore
import markwodnItReplaceLink from 'markdown-it-replace-link';
/* eslint-enable */
import markdownItTable from 'markdown-it-multimd-table';

import { notes } from '../../lib/notes';
import { usePopUp } from '../../lib/usePopUp';
import { AlertPopUp } from '../../components/AlertPopUp';

const ExportNote: React.FC<{}> = ({}) => {
    const {
        curDataPath,
        currentRepoKey,
        currentFolderKey,
        currentNoteKey,
        currentTitle,
        theme,
        whalesnote,
    } = useContext(GlobalContext);
    const { t } = useTranslation();
    const [showSwitchExportNoteFunc, setShowSwitchExportNoteFunc] = useState(false);

    const switchExportNoteFuncBtnRef = useRef<HTMLDivElement>(null);
    const [exportFinishPopUp, setExportFinishPopUp, exportFinishMask] = usePopUp(500);

    const handleClick = useCallback(
        (event: MouseEvent) => {
            //event.preventDefault();
            if (
                switchExportNoteFuncBtnRef &&
                switchExportNoteFuncBtnRef.current?.contains(event.target as Node)
            ) {
                setShowSwitchExportNoteFunc(
                    (_showSwitchExportNoteFunc) => !_showSwitchExportNoteFunc
                );
            } else {
                setShowSwitchExportNoteFunc(false);
            }
        },
        [setShowSwitchExportNoteFunc]
    );

    useEffect(() => {
        document.addEventListener('click', handleClick);
        return () => {
            document.removeEventListener('click', handleClick);
        };
    }, [handleClick]);

    const mdPrint = useRef<markdownIt>(markdownIt());

    mdPrint.current = useMemo(() => {
        return markdownIt({
            html: true,
            breaks: true,
            linkify: true,
            typographer: true,
            highlight: function (str, lang) {
                if (lang) {
                    try {
                        return (
                            '<pre><code class="hljs" style="position: relative;"><pre>' +
                            toHtml(lowlight.highlight(lang, str, {})) +
                            '</pre></code></pre>'
                        );
                    } catch (__) {}
                }

                return (
                    '<pre><code class="hljs"><pre>' +
                    mdPrint.current.utils.escapeHtml(str) +
                    '</pre></code></pre>'
                );
            },
        })
            .use(markdownItEmoji)
            .use(markdownItFootnote)
            .use(markdownItSub)
            .use(markdownItSup)
            .use(markdownItTaskLists)
            .use(markdownItLinkAttributes, {
                attrs: {
                    target: '_blank',
                },
            })
            .use(markdownItTable, {
                multiline: false,
                rowspan: true,
                headerless: false,
                multibody: true,
                aotolabel: true,
            })
            .use(markwodnItReplaceLink, {
                replaceLink: function (link: string, env: string) {
                    return curDataPath + '/images/' + link;
                },
            });
    }, [curDataPath]);

    const print_str = useMemo(() => {
        return currentRepoKey &&
            currentFolderKey &&
            currentNoteKey &&
            notes[currentRepoKey] &&
            notes[currentRepoKey][currentFolderKey] &&
            notes[currentRepoKey][currentFolderKey][currentNoteKey]
            ? notes[currentRepoKey][currentFolderKey][currentNoteKey]
            : '';
    }, [curDataPath, currentRepoKey, currentFolderKey, currentNoteKey]);

    const saveNoteToHtml = useCallback(
        async (path: string) => {
            const bodyContent = mdPrint.current.render(print_str);
            const colorStyle =
                (await window.electronAPI.readCssSync({
                    file_name: '/theme/color_variable.css',
                })) || '';
            const hljsStyle =
                (await window.electronAPI.readCssSync({
                    file_name: `/hljs_theme/${theme}.css`,
                })) || '';
            const renderStyle =
                (await window.electronAPI.readCssSync({
                    file_name: '/theme/render.css',
                })) || '';
            const outerHtml = `<!DOCTYPE html><html style="height: 100%">
        <head>
        <meta charset="UTF-8">
        <meta name = "viewport" content = "width = device-width, initial-scale = 1.5, maximum-scale = 1">
        <style>
        ${colorStyle}
        ${hljsStyle}
        ${renderStyle}
        </style>
        </head>
        <body style="height:100%; margin:0; font-family: -apple-system, BlinkMacSystemFont, PingFang SC, Helvetica, Tahoma, Arial, "Microsoft YaHei", sans-serif;">
        <div class='${theme}-theme-global wn-theme-rd'>
            ${bodyContent}
        </div>
        </body></html>`;
            await window.electronAPI.writeStr({
                file_path: path,
                str: outerHtml,
            });
            setExportFinishPopUp(true);
        },
        [print_str, theme, setExportFinishPopUp]
    );

    const saveNoteToMd = useCallback(
        async (path: string) => {
            await window.electronAPI.writeMd({
                file_path: path,
                str: print_str,
            });
            setExportFinishPopUp(true);
        },
        [print_str, setExportFinishPopUp]
    );

    const ExportNoteFunc = useCallback(
        async (type: string) => {
            switch (type) {
                case 'html':
                    const htmlFilePath = await window.electronAPI.openSaveDialog({
                        file_name: currentTitle.replace(/[\\\/:*?"<>|]+/g, '_'),
                        file_types: ['html'],
                    });
                    if (htmlFilePath !== '') await saveNoteToHtml(htmlFilePath);
                    break;
                case 'md':
                    const mdFilePath = await window.electronAPI.openSaveDialog({
                        file_name: currentTitle.replace(/[\\\/:*?"<>|]+/g, '_'),
                        file_types: ['md'],
                    });
                    if (mdFilePath !== '') await saveNoteToMd(mdFilePath);
                    break;
                case 'default':
                    break;
            }
        },
        [currentTitle, saveNoteToHtml, saveNoteToMd]
    );

    const addMultizero = useCallback((num: number | string, count: number) => {
        return String(num).padStart(count, '0');
    }, []);

    const saveFolderToHtml = useCallback(
        async (path: string) => {
            const colorStyle =
                (await window.electronAPI.readCssSync({
                    file_name: '/theme/color_variable.css',
                })) || '';
            const hljsStyle =
                (await window.electronAPI.readCssSync({
                    file_name: `/hljs_theme/${theme}.css`,
                })) || '';
            const renderStyle =
                (await window.electronAPI.readCssSync({
                    file_name: '/theme/render.css',
                })) || '';
            const len =
                whalesnote.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_key
                    ?.length;
            for (const [index, note_key] of whalesnote.repos_obj[currentRepoKey]?.folders_obj[
                currentFolderKey
            ]?.notes_key.entries()) {
                let title =
                    whalesnote.repos_obj[currentRepoKey]?.folders_obj &&
                    whalesnote.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_obj
                        ? whalesnote.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]
                              ?.notes_obj[note_key]?.title || ''
                        : '';
                let repeated_time = 0;
                for (const comp_note_key of whalesnote.repos_obj[currentRepoKey]?.folders_obj[
                    currentFolderKey
                ]?.notes_key) {
                    const comp_title =
                        whalesnote.repos_obj[currentRepoKey]?.folders_obj &&
                        whalesnote.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]
                            ?.notes_obj
                            ? whalesnote.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]
                                  ?.notes_obj[comp_note_key]?.title || ''
                            : '';
                    if (title === comp_title) repeated_time++;
                }
                if (repeated_time > 1) title += '' + note_key;
                const content = notes[currentRepoKey][currentFolderKey][note_key];
                console.log(content);
                const bodyContent = mdPrint.current.render(content);
                console.log(bodyContent);
                const outerHtml = `<!DOCTYPE html><html style="height: 100%">
            <head>
            <meta charset="UTF-8">
            <meta name = "viewport" content = "width = device-width, initial-scale = 1, maximum-scale = 1">
            <style>
            ${colorStyle}
            ${hljsStyle}
            ${renderStyle}
            </style>
            </head>
            <body style="height:100%; margin:0; font-family: -apple-system, BlinkMacSystemFont, PingFang SC, Helvetica, Tahoma, Arial, "Microsoft YaHei", sans-serif;">
            <div class='${theme}-theme-global wn-theme-rd'>
                ${bodyContent}
            </div>
            </body></html>`;

                await window.electronAPI.writeStrToFile({
                    folder_path: path,
                    file_name:
                        addMultizero(index, String(len).length) +
                        '.' +
                        title.replace(/[\\\/:*?"<>|]+/g, '_') +
                        '.html',
                    str: outerHtml,
                });
            }
            setExportFinishPopUp(true);
        },
        [whalesnote, currentRepoKey, currentFolderKey, theme, setExportFinishPopUp]
    );

    const saveFolderToMd = useCallback(
        async (path: string) => {
            const len =
                whalesnote.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_key
                    ?.length;
            for (const [index, note_key] of whalesnote.repos_obj[currentRepoKey]?.folders_obj[
                currentFolderKey
            ]?.notes_key.entries()) {
                let title =
                    whalesnote.repos_obj[currentRepoKey]?.folders_obj &&
                    whalesnote.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_obj
                        ? whalesnote.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]
                              ?.notes_obj[note_key]?.title || ''
                        : '';
                let repeated_time = 0;
                for (const comp_note_key of whalesnote.repos_obj[currentRepoKey]?.folders_obj[
                    currentFolderKey
                ]?.notes_key) {
                    const comp_title =
                        whalesnote.repos_obj[currentRepoKey]?.folders_obj &&
                        whalesnote.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]
                            ?.notes_obj
                            ? whalesnote.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]
                                  ?.notes_obj[comp_note_key]?.title || ''
                            : '';
                    if (title === comp_title) repeated_time++;
                }
                if (repeated_time > 1) title += '' + note_key;
                const content = notes[currentRepoKey][currentFolderKey][note_key];
                await window.electronAPI.writeStrToFile({
                    folder_path: path,
                    file_name:
                        addMultizero(index, String(len).length) +
                        '.' +
                        title.replace(/[\\\/:*?"<>|]+/g, '_') +
                        '.md',
                    str: content,
                });
            }
            setExportFinishPopUp(true);
        },
        [whalesnote, currentRepoKey, currentFolderKey, setExportFinishPopUp]
    );

    const ExportNotesInFolderFunc = useCallback(
        async (type: string) => {
            switch (type) {
                case 'html':
                    const htmlFilePath = await window.electronAPI.openDirectoryDialog();
                    if (htmlFilePath !== '') await saveFolderToHtml(htmlFilePath);
                    break;
                case 'md':
                    const mdFilePath = await window.electronAPI.openDirectoryDialog();
                    if (mdFilePath !== '') await saveFolderToMd(mdFilePath);
                    break;
                case 'default':
                    break;
            }
        },
        [saveFolderToHtml, saveFolderToMd]
    );

    return (
        <ExportNoteContainer>
            <SwitchExportNoteFuncBtnBox ref={switchExportNoteFuncBtnRef}>
                <SwitchExportNoteFuncBtn className="ri-external-link-line"></SwitchExportNoteFuncBtn>
            </SwitchExportNoteFuncBtnBox>
            {showSwitchExportNoteFunc ? (
                <SwitchExportNoteFunc>
                    <ModeOption
                        onClick={() => {
                            setShowSwitchExportNoteFunc(false);
                            ExportNoteFunc('md');
                        }}
                    >
                        {t('export_note.export_note_as_md')}
                    </ModeOption>
                    <ModeOption
                        onClick={() => {
                            setShowSwitchExportNoteFunc(false);
                            ExportNoteFunc('html');
                        }}
                    >
                        {t('export_note.export_note_as_html')}
                    </ModeOption>
                    <ModeOption
                        onClick={() => {
                            setShowSwitchExportNoteFunc(false);
                            ExportNotesInFolderFunc('md');
                        }}
                    >
                        {t('export_note.export_category_as_md')}
                    </ModeOption>
                    <ModeOption
                        onClick={() => {
                            setShowSwitchExportNoteFunc(false);
                            ExportNotesInFolderFunc('html');
                        }}
                    >
                        {t('export_note.export_category_as_html')}
                    </ModeOption>
                </SwitchExportNoteFunc>
            ) : (
                <></>
            )}
            <AlertPopUp
                popupState={exportFinishPopUp}
                maskState={exportFinishMask}
                content={t('tips.export_success')}
                onConfirm={() => {
                    setExportFinishPopUp(false);
                }}
            ></AlertPopUp>
        </ExportNoteContainer>
    );
};

const ExportNoteContainer = styled.div(
    {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
    `
    app-region: no-drag;
`
);

const SwitchExportNoteFuncBtnBox = styled.div({
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    margin: '0 10px',
});

const SwitchExportNoteFuncBtn = styled.div({
    fontSize: '23px',
    width: '22px',
    height: '22px',
    color: 'var(--main-icon-color)',
    cursor: 'pointer',
});

const SwitchExportNoteFunc = styled.div({
    position: 'absolute',
    top: '31px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '140px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: '14px',
    padding: '5px 0',
    borderRadius: '4px',
    zIndex: '4000',
    backgroundColor: 'var(--main-btn-bg-color)',
    cursor: 'pointer',
});

const ModeOption = styled.div({
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    padding: '5px',
});

export default ExportNote;
