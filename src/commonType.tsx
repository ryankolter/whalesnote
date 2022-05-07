export type Data = {
  repos: object;
  notes: notesTypes;
  dxnote: dxnoteTypes;
};

export type notesTypes = {
  [key: string]: {
    [key: string]: {
      [key: string]: string;
    };
  };
};

export type dxnoteTypes = {
  id: string;
  repos_key: string[];
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

export type Repo = {
  order: number;
  id: string;
  title: string;
  show: boolean;
  folders: object | undefined;
};

export type Folder = {
  id: string;
  title: string;
  notes: note[];
};

export type note = {
  id: string;
  title: string;
};
