import styled from '@emotion/styled';
import cryptoRandomString from 'crypto-random-string';
import { useCallback, useRef } from 'react';
import { useEffect } from 'react';
import useContextMenu from '../../lib/useContextMenu';
const { ipcRenderer } = window.require('electron');

const TrashList: React.FC<TrashListProps> = ({
    repos,
    data_path,
    currentRepoKey,
    currentFolderKey,
    currentNoteKey,
    repoSwitch,
    folderSwitch,
    noteSwitch,
    folderNotesFetch,
    width,
}) => {
    const outerRef = useRef(null);
    const { xPos, yPos, menu } = useContextMenu(outerRef);

    const deleteNote = (note_key: string) => {
        const folder_info = ipcRenderer.sendSync('readJson', {
            file_path: `${data_path}/${currentRepoKey}/${currentFolderKey}/folder_info.json`,
        });

        folder_info.notes_obj[note_key].isTrashed = true;

        ipcRenderer.sendSync('writeJson', {
            file_path: `${data_path}/${currentRepoKey}/${currentFolderKey}/folder_info.json`,
            obj: folder_info,
        });
    };

    return (
        <NoteListContainer width={width}>
            <Notes ref={outerRef}>
                {Array.from(repos.TRASHED_LIST)?.map((str: any) => {
                    const arr = str.split('-');
                    return (
                        <NoteItem
                            key={arr[2]}
                            style={{
                                backgroundColor: currentNoteKey === arr[2] ? '#3a404c' : '',
                            }}
                            onClick={() => {
                                repoSwitch(data_path, arr[0]);
                                folderNotesFetch(data_path, arr[0], arr[1]);
                                folderSwitch(data_path, arr[0], arr[1]);
                                noteSwitch(data_path, arr[2]);
                            }}
                            // onContextMenu={()=>noteSwitch(data_path, arr[2])}
                        >
                            {arr[3]}
                        </NoteItem>
                    );
                })}
                {menu && currentNoteKey ? (
                    <MenuUl top={yPos} left={xPos}>
                        <MenuLi onClick={() => deleteNote(currentNoteKey)}>彻底删除</MenuLi>
                    </MenuUl>
                ) : (
                    <></>
                )}
            </Notes>
        </NoteListContainer>
    );
};

const NoteListContainer = styled.div(
    {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
    (props: { width: number }) => ({
        width: props.width,
    })
);

const ColumnHeader = styled.div({
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row-reverse',
    margin: '10px 16px',
});

const iconBtnStyle = {
    width: '16px',
    height: '16px; ',
    display: 'flex',
    alignItem: 'center',
    justifyContent: 'center',
    color: '#939395',
    cursor: 'pointer',
};

const NoteAddBtn = styled.div(iconBtnStyle);

const Notes = styled.div(
    {
        overflowY: 'scroll',
        flex: '1',
        minHeight: '0',
    },
    `
    &::-webkit-scrollbar {
        display: none;
    }
`
);

const NoteItem = styled.div`
    height: 40px;
    line-height: 40px;
    padding: 0 5px;
    margin: 0 15px;
    color: #939395;
    cursor: pointer;
    border-bottom: 1px solid rgba(58, 64, 76, 0.6);
    &:hover {
        color: #ddd;
        background-color: rgba(47, 51, 56, 0.2);
    }
`;

const MenuUl = styled.ul(
    {
        listStyleType: 'none',
        position: 'fixed',
        padding: '4px 0',
        border: '1px solid #BABABA',
        color: '#000000',
        backgroundColor: '#FFFFFF',
        zIndex: '99999',
    },
    (props: { top: string; left: string }) => ({
        top: props.top,
        left: props.left,
    })
);

const MenuLi = styled.li(
    {
        padding: '0 22px',
        fontSize: '12px',
        lineHeight: '22px',
        cursor: 'pointer',
    },
    `&:hover {
background-color: #EBEBEB; 
}`
);

const MoreNote = styled.div(iconBtnStyle);

const NoteBottomBar = styled.div({
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row-reverse',
    margin: '10px 16px',
    fontSize: '18px',
});

type TrashListProps = {
    repos: any;
    data_path: string;
    notes_key: string[] | undefined;
    notes_obj: object | undefined;
    currentRepoKey: string | undefined;
    currentFolderKey: string | undefined;
    currentNoteKey: string | undefined;
    repoSwitch: (data_path: string, repo_key: string) => void;
    folderSwitch: (data_path: string, repo_key: string | undefined, folder_key: string) => void;
    noteSwitch: (data_path: string, note_key: string | undefined) => void;
    folderNotesFetch: (data_path: string, repo_key: string, folder_key: string) => void;
    width: number;
};

export default TrashList;
