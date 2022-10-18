const { ipcRenderer } = window.require('electron');
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';
import cryptoRandomString from 'crypto-random-string';

import AssistantPanel from './AssistantPanel';

import SvgIcon from '../../components/SvgIcon';
import exportIcon from '../../resources/icon/sideBar/exportIcon.svg';
import dataPanelIcon from '../../resources/icon/sideBar/dataPanelIcon.svg';
import mobilePanelIcon from '../../resources/icon/sideBar/mobilePanelIcon.svg';
import modelPanelIcon from '../../resources/icon/sideBar/modelPanelIcon.svg';
import trashPanelIcon from '../../resources/icon/sideBar/trashPanelIcon.svg';
import settingPanelIcon from '../../resources/icon/sideBar/settingPanelIcon.svg';

const SideBar: React.FC<{}> = ({}) => {
    const { currentTitle } = useContext(GlobalContext);
    const [showAssistantPanel, setShowAssistantPanel] = useState(false);
    const [curAssistantPanelName, setCurAssistantPanelName] = useState('none');

    const [showSwitchExportPanel, setShowSwitchExportPanel] = useState(false);

    const ExportNote = useCallback(
        (type: string) => {
            switch (type) {
                case 'html':
                    ipcRenderer.send('open-save-dialog', {
                        file_name: currentTitle,
                        file_types: ['html'],
                        response_event_name: 'saveNoteToHtml',
                    });
                    break;
                case 'md':
                    ipcRenderer.send('open-save-dialog', {
                        file_name: currentTitle,
                        file_types: ['md'],
                        response_event_name: 'saveNoteToPng',
                    });
                    break;
                case 'png':
                    ipcRenderer.send('open-save-dialog', {
                        file_name: currentTitle,
                        file_types: ['png'],
                        response_event_name: 'saveNoteToPng',
                    });
                    break;
                case 'default':
                    break;
            }
        },
        [currentTitle]
    );

    const ExportFolder = useCallback((type: string) => {
        switch (type) {
            case 'html':
                ipcRenderer.send('open-directory-dialog', {
                    response_event_name: 'saveFolderToHtml',
                });
                break;
            case 'default':
                break;
        }
    }, []);

    return (
        <SideBarContainer>
            {showAssistantPanel ? (
                <AssistantPanel curAssistantPanelName={curAssistantPanelName} />
            ) : (
                <></>
            )}
            <SideBarColumn className="side-bar-color">
                <SideBarTopIcons>
                    <SwitchExport>
                        <SvgIcon
                            iconWidth={33}
                            iconHeight={28}
                            iconSrc={exportIcon}
                            onClick={() => {
                                setShowSwitchExportPanel(
                                    (_showSwitchExportPanel) => !_showSwitchExportPanel
                                );
                            }}
                        />
                        {showSwitchExportPanel ? (
                            <SwitchExportPanel className="float-panel-color">
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
                </SideBarTopIcons>
                <SideBarBottomIcons>
                    <SvgIcon
                        iconWidth={29}
                        iconHeight={32}
                        iconSrc={dataPanelIcon}
                        onClick={() => {
                            setShowAssistantPanel(
                                (_showAssistantPanel: boolean) => !_showAssistantPanel
                            );
                            setCurAssistantPanelName('data_panel');
                        }}
                    />
                    <IconPadding />
                    <SvgIcon iconWidth={27} iconHeight={33} iconSrc={mobilePanelIcon} />
                    <IconPadding />
                    <SvgIcon iconWidth={30} iconHeight={26} iconSrc={modelPanelIcon} />
                    <IconPadding />
                    <SvgIcon iconWidth={26} iconHeight={33} iconSrc={trashPanelIcon} />
                    <IconPadding />
                    <SvgIcon iconWidth={32} iconHeight={32} iconSrc={settingPanelIcon} />
                </SideBarBottomIcons>
            </SideBarColumn>
        </SideBarContainer>
    );
};

const SideBarContainer = styled.div({
    display: 'flex',
});

const SideBarColumn = styled.div({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '48px',
});

const SideBarTopIcons = styled.div({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '30px',
});

const SwitchExport = styled.div({
    position: 'relative',
    display: 'flex',
    flexDirection: 'row-reverse',
    cursor: 'pointer',
});

const ExportBtn = styled.div({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '32px',
    lintHeight: '32px',
    boxSizing: 'border-box',
    padding: '0 10px',
    borderRadius: '4px',
    fontSize: '16px',
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
});

const ModeOption = styled.div({
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    padding: '5px',
});

const SideBarBottomIcons = styled.div({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '30px',
});

const IconPadding = styled.div({
    height: '26px',
});

export default SideBar;
