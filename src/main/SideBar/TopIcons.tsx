import { useCallback, useContext, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';

import SvgIcon from '../../components/SvgIcon';

import exportIcon from '../../resources/icon/sideBar/exportIcon.svg';

const TopIcons: React.FC<{}> = ({}) => {
    const { currentTitle } = useContext(GlobalContext);
    const [showSwitchExportPanel, setShowSwitchExportPanel] = useState(false);

    const ExportNote = useCallback(
        async (type: string) => {
            switch (type) {
                case 'html':
                    // ipcRenderer.send('open-save-dialog', {
                    //     file_name: currentTitle,
                    //     file_types: ['html'],
                    //     response_event_name: 'saveNoteToHtml',
                    // });
                    const htmlFilePath = await window.electronAPI.openSaveDialog({
                        file_name: currentTitle,
                        file_types: ['html'],
                    });
                    console.log(htmlFilePath);
                    break;
                case 'md':
                    // ipcRenderer.send('open-save-dialog', {
                    //     file_name: currentTitle,
                    //     file_types: ['md'],
                    //     response_event_name: 'saveNoteToMd',
                    // });
                    const mdFilePath = await window.electronAPI.openSaveDialog({
                        file_name: currentTitle,
                        file_types: ['md'],
                    });
                    console.log(mdFilePath);
                    break;
                case 'png':
                    // ipcRenderer.send('open-save-dialog', {
                    //     file_name: currentTitle,
                    //     file_types: ['png'],
                    //     response_event_name: 'saveNoteToPng',
                    // });
                    const pngFilePath = await window.electronAPI.openSaveDialog({
                        file_name: currentTitle,
                        file_types: ['png'],
                    });
                    console.log(pngFilePath);
                    break;
                case 'default':
                    break;
            }
        },
        [currentTitle]
    );

    const ExportFolder = useCallback(async (type: string) => {
        switch (type) {
            case 'html':
                const filePath = await window.electronAPI.openDirectoryDialog();
                // ipcRenderer.send('open-directory-dialog', {
                //     response_event_name: 'saveFolderToHtml',
                // });
                break;
            case 'default':
                break;
        }
    }, []);

    return (
        <TopIconsContainer>
            <SwitchExport>
                <SvgIcon
                    iconWidth={33}
                    iconHeight={28}
                    iconPadding={12}
                    iconSrc={exportIcon}
                    onClick={() => {
                        setShowSwitchExportPanel(
                            (_showSwitchExportPanel) => !_showSwitchExportPanel
                        );
                    }}
                />
                {showSwitchExportPanel ? (
                    <SwitchExportPanel>
                        <ModeOption
                            onClick={() => {
                                setShowSwitchExportPanel(false);
                                ExportFolder('html');
                            }}
                        >
                            Folder to .html
                        </ModeOption>
                        <ModeOption
                            onClick={() => {
                                setShowSwitchExportPanel(false);
                                ExportNote('html');
                            }}
                        >
                            Note to.html
                        </ModeOption>
                        <ModeOption
                            onClick={() => {
                                setShowSwitchExportPanel(false);
                                ExportNote('png');
                            }}
                        >
                            Note to .png
                        </ModeOption>
                        <ModeOption
                            onClick={() => {
                                setShowSwitchExportPanel(false);
                                ExportNote('md');
                            }}
                        >
                            Note to .md
                        </ModeOption>
                    </SwitchExportPanel>
                ) : (
                    <></>
                )}
            </SwitchExport>
        </TopIconsContainer>
    );
};

const TopIconsContainer = styled.div({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '15px',
});

const SwitchExport = styled.div({
    position: 'relative',
    display: 'flex',
    flexDirection: 'row-reverse',
    cursor: 'pointer',
});

const SwitchExportPanel = styled.div({
    position: 'absolute',
    top: '0',
    right: '42px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '5px 0',
    borderRadius: '4px',
    zIndex: '4000',
    border: '1px solid var(--float-panel-border-color)',
    backgroundColor: 'var(--float-panel-bg-color)',
});

const ModeOption = styled.div({
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    padding: '5px',
});

export default TopIcons;
