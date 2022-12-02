import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';

import markdownIt from 'markdown-it';
import hljs from 'highlight.js/lib/common';
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

import SvgIcon from '../../components/SvgIcon';
import exportIcon from '../../resources/icon/sideBar/exportIcon.svg';

import { notes } from '../../lib/notes';
import { usePopUp } from '../../lib/usePopUp';
import { AlertPopUp } from '../../components/AlertPopUp';

const ExportPanel: React.FC<{}> = ({}) => {
    const {
        curDataPath,
        currentRepoKey,
        currentFolderKey,
        currentNoteKey,
        currentTitle,
        theme,
        whalenote,
    } = useContext(GlobalContext);
    const [showSwitchExportPanel, setShowSwitchExportPanel] = useState(false);

    const switchExportPanelBtnRef = useRef<HTMLDivElement>(null);
    const [exportFinishPopUp, setExportFinishPopUp, exportFinishMask] = usePopUp(500);

    const handleClick = useCallback(
        (event: MouseEvent) => {
            event.preventDefault();
            if (
                switchExportPanelBtnRef &&
                switchExportPanelBtnRef.current?.contains(event.target as Node)
            ) {
                setShowSwitchExportPanel((_showSwitchExportPanel) => !_showSwitchExportPanel);
            } else {
                setShowSwitchExportPanel(false);
            }
        },
        [setShowSwitchExportPanel]
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
            breaks: true,
            linkify: true,
            typographer: true,
            highlight: function (str, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return (
                            '<pre><code class="hljs" style="position: relative;">' +
                            hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                            '</code></pre>'
                        );
                    } catch (__) {}
                }

                return (
                    '<pre><code class="hljs">' +
                    mdPrint.current.utils.escapeHtml(str) +
                    '</code></pre>'
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
        <body style="height:100%; margin:0; font-family: PingFangSC-Regular, sans-serif;">
        <div class='${theme}-theme-global wn-theme-rd'>
            ${bodyContent}
        </div>
        </body></html>`;
            await window.electronAPI.writeStr({
                file_path: path,
                str: outerHtml,
            });
        },
        [print_str, theme]
    );

    const saveNoteToMd = useCallback(
        async (path: string) => {
            await window.electronAPI.writeStr({
                file_path: path,
                str: print_str,
            });
        },
        [print_str]
    );

    const ExportNote = useCallback(
        async (type: string) => {
            switch (type) {
                case 'html':
                    const htmlFilePath = await window.electronAPI.openSaveDialog({
                        file_name: currentTitle,
                        file_types: ['html'],
                    });
                    if (htmlFilePath !== '') await saveNoteToHtml(htmlFilePath);
                    break;
                case 'md':
                    const mdFilePath = await window.electronAPI.openSaveDialog({
                        file_name: currentTitle,
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
            for (const note_key of Object.keys(notes[currentRepoKey][currentFolderKey])) {
                let title =
                    whalenote.repos_obj[currentRepoKey]?.folders_obj &&
                    whalenote.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_obj
                        ? whalenote.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]
                              ?.notes_obj[note_key]?.title || ''
                        : '';
                if (title === '' || title === '空笔记') title = note_key;
                const content = notes[currentRepoKey][currentFolderKey][note_key];
                const bodyContent = mdPrint.current.render(content);
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
            <body style="height:100%; margin:0; font-family: PingFangSC-Regular, sans-serif;">
            <div class='${theme}-theme-global wn-theme-rd'>
                ${bodyContent}
            </div>
            </body></html>`;

                await window.electronAPI.writeStrToFile({
                    folder_path: path,
                    file_name: title + '.html',
                    str: outerHtml,
                });
            }
        },
        [whalenote, currentRepoKey, currentFolderKey, theme]
    );

    const ExportFolder = useCallback(
        async (type: string) => {
            switch (type) {
                case 'html':
                    const filePath = await window.electronAPI.openDirectoryDialog();
                    if (filePath !== '') await saveFolderToHtml(filePath);
                    break;
                case 'default':
                    break;
            }
        },
        [saveFolderToHtml]
    );

    return (
        <ExportPanelContainer>
            <SwitchExportPanelBtnBox ref={switchExportPanelBtnRef}>
                <SwitchExportPanelBtn className="ri-external-link-line"></SwitchExportPanelBtn>
            </SwitchExportPanelBtnBox>
            {showSwitchExportPanel ? (
                <SwitchExportPanel>
                    <ModeOption
                        onClick={() => {
                            setShowSwitchExportPanel(false);
                            ExportNote('html');
                        }}
                    >
                        导出笔记 [.html]
                    </ModeOption>
                    <ModeOption
                        onClick={() => {
                            setShowSwitchExportPanel(false);
                            ExportNote('md');
                        }}
                    >
                        导出笔记 [.md]
                    </ModeOption>
                    <ModeOption
                        onClick={() => {
                            setShowSwitchExportPanel(false);
                            ExportFolder('html');
                        }}
                    >
                        导出分类 [.html]
                    </ModeOption>
                </SwitchExportPanel>
            ) : (
                <></>
            )}
            <AlertPopUp
                popupState={exportFinishPopUp}
                maskState={exportFinishMask}
                content="导出成功"
                onConfirm={() => {
                    setExportFinishPopUp(false);
                }}
            ></AlertPopUp>
        </ExportPanelContainer>
    );
};

const ExportPanelContainer = styled.div({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
});

const SwitchExportPanelBtnBox = styled.div({
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    margin: '0 10px',
});

const SwitchExportPanelBtn = styled.div({
    fontSize: '23px',
    width: '22px',
    height: '22px',
    color: 'var(--main-icon-color)',
});

const SwitchExportPanel = styled.div({
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

export default ExportPanel;
