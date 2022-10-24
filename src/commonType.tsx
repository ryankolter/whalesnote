export type whalenoteTypes = {
    id: string;
    repos_key: string[];
};

export type historyTypes = {
    cur_repo_key: string;
    repos:
        | {
              [key: string]:
                  | {
                        cur_folder_key: string;
                        folders: {
                            [key: string]: string;
                        };
                    }
                  | {};
          }
        | {};
};

export type reposObjTypes = {
    [repo_key: string]: {
        repo_name: string;
        folders_key: string[];
        folders_obj:
            | {
                  [folder_key: string]: {
                      folder_name: string;
                      notes_key: string[];
                      notes_obj:
                          | {
                                [note_key: string]: {
                                    title: string;
                                };
                            }
                          | {};
                  };
              }
            | {};
    };
};

export type notesTypes = {
    [key: string]: {
        [key: string]: {
            [key: string]: string;
        };
    };
};

export type DataTypes = {
    whalenote: whalenoteTypes;
    history: historyTypes;
    repos: reposObjTypes;
    notes: notesTypes;
};
