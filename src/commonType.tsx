export type NoteObject = { title: string };
export type NoteMap = Record<string, NoteObject>;

export type FolderObject = {
    folder_name: string;
    note_keys: string[];
    note_map: NoteMap;
};
export type FolderMap = Record<string, FolderObject>;

export type RepoObject = {
    repo_name: string;
    folder_keys: string[];
    folder_map: FolderMap;
};
export type RepoMap = Record<string, RepoObject>;

export type WhaleObject = {
    path: string;
    repo_keys: string[];
    repo_map: RepoMap;
};

export type HistoryInfo = {
    cur_repo_key: string;
    repos_record: Record<
        string,
        {
            cur_folder_key: string;
            folders: {
                [key: string]: string;
            };
        }
    >;
};

export type ContentMap = {
    [key: string]: {
        [key: string]: {
            [key: string]: string;
        };
    };
};

export type DataTypes = {
    whaleObj: WhaleObject;
    contentMap: ContentMap;
    historyInfo: HistoryInfo;
};
