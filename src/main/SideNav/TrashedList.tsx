const { ipcRenderer } = window.require('electron');
import { useContext, useRef } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';
import useContextMenu from '../../lib/useContextMenu';

const TrashList: React.FC<{
    width: number;
}> = ({ width }) => {
    const {
        repos_obj,
        curDataPath,
        currentRepoKey,
        currentFolderKey,
        currentNoteKey,
        repoSwitch,
        folderSwitch,
        noteSwitch,
        folderNotesFetch,
    } = useContext(GlobalContext);

    const outerRef = useRef(null);
    const { xPos, yPos, menu } = useContextMenu(outerRef);

    const deleteNote = (note_key: string) => {
        const folder_info = ipcRenderer.sendSync('readJson', {
            file_path: `${curDataPath}/${currentRepoKey}/${currentFolderKey}/folder_info.json`,
        });

        folder_info.notes_obj[note_key].isTrashed = true;

        ipcRenderer.sendSync('writeJson', {
            file_path: `${curDataPath}/${currentRepoKey}/${currentFolderKey}/folder_info.json`,
            obj: folder_info,
        });
    };

    return (
        <NoteListContainer width={width}>
            <Notes ref={outerRef}>
                {Array.from(repos_obj.TRASHED_LIST)?.map((str: any) => {
                    const arr = str.split('-');
                    return (
                        <NoteItem
                            key={arr[2]}
                            style={{
                                backgroundColor: currentNoteKey === arr[2] ? '#3a404c' : '',
                            }}
                            onClick={() => {
                                repoSwitch(arr[0]);
                                folderNotesFetch(curDataPath, arr[0], arr[1]);
                                folderSwitch(arr[0], arr[1]);
                                noteSwitch(arr[2]);
                            }}
                            // onContextMenu={()=>noteSwitch(curDataPath, arr[2])}
                        >
                            {arr[3]}
                        </NoteItem>
                    );
                })}
                {menu && currentNoteKey ? (
                    <MenuUl top={yPos} left={xPos} className="menu-ui-color">
                        <MenuLi
                            className="menu-li-color"
                            onClick={() => deleteNote(currentNoteKey)}
                        >
                            彻底删除
                        </MenuLi>
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

const iconBtnStyle = {
    width: '16px',
    height: '16px; ',
    display: 'flex',
    alignItem: 'center',
    justifyContent: 'center',
    color: '#939395',
    cursor: 'pointer',
};

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
        zIndex: '4000',
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

export default TrashList;
