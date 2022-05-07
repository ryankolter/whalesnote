import styled from "@emotion/styled";
import { useState, useCallback } from "react";
import {
  DndContext,
  MouseSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToFirstScrollableAncestor,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import { Sortable } from "../../components/Sortable";
const { ipcRenderer } = window.require("electron");

const FolderBox: React.FC<FolderBoxProps> = ({
  data_path,
  folders_key,
  folders_obj,
  currentRepoKey,
  currentFolderKey,
  repoSwitch,
  folderSwitch,
  reorderFolder,
  width,
}) => {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = useCallback(
    (event: any) => {
      setActiveId(null);
      const { active, over } = event;
      console.log(event);

      if (!over) return;

      if (active.id !== over.id && folders_key && currentRepoKey) {
        const oldIndex = folders_key.indexOf(active.id);
        const newIndex = folders_key.indexOf(over.id);
        let new_folders_key = arrayMove(folders_key, oldIndex, newIndex);
        reorderFolder(data_path, currentRepoKey, new_folders_key);
      }
    },
    [data_path, currentRepoKey, currentFolderKey, folders_key]
  );

  return (
    <FolderBoxContainer width={width}>
      {folders_key ? (
        <DndContext
          sensors={sensors}
          modifiers={[
            restrictToVerticalAxis,
            restrictToFirstScrollableAncestor,
          ]}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={folders_key}
            strategy={verticalListSortingStrategy}
          >
            <Folders>
              {folders_key?.map((key, index) => {
                return folders_obj && folders_obj[key] ? (
                  <Sortable key={key} id={key}>
                    <FolderItem
                      key={`item-${key}`}
                      style={{
                        backgroundColor:
                          currentFolderKey === key ? "#3a404c" : "",
                      }}
                      onClick={() => {
                        repoSwitch(currentRepoKey);
                        folderSwitch(data_path, key);
                      }}
                      onContextMenu={() => {
                        if (currentFolderKey !== key) {
                          repoSwitch(currentRepoKey);
                          folderSwitch(data_path, key);
                        }
                      }}
                    >
                      {folders_obj[key]["folder_name"]}
                    </FolderItem>
                  </Sortable>
                ) : (
                  <div></div>
                );
              })}
            </Folders>
          </SortableContext>
          <DragOverlay>
            <div>
              {activeId && folders_obj ? (
                <FolderItem
                  key={activeId}
                  style={{
                    backgroundColor:
                      currentFolderKey === activeId ? "#3a404c" : "",
                  }}
                >
                  {folders_obj[activeId]["folder_name"]}
                </FolderItem>
              ) : null}
            </div>
          </DragOverlay>
        </DndContext>
      ) : (
        <></>
      )}
    </FolderBoxContainer>
  );
};

const FolderBoxContainer = styled.div(
  {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    border: "1px solid rgba(58,64,76,0.8)",
    maxWidth: "215px",
  },
  (props: { width: number }) => ({
    minWidth: props.width,
  })
);

const Folders = styled.div(
  {
    overflowY: "auto",
    overflowX: "hidden",
    flex: "1",
    minHeight: "0",
    padding: "16px 0",
  },
  `
    &::-webkit-scrollbar {
        width: 8px;
    }
    &::-webkit-scrollbar-track {
        background-color: #2C3033;
    }
    &::-webkit-scrollbar-thumb {
        background-color: hsla(0,0%,78%,.2);
        border-radius: 3px;
    }
`
);

const FolderItem = styled.div`
  height: 28px;
  line-height: 28px;
  font-size: 14px;
  padding: 0 16px;
  color: #939395;
  cursor: pointer;
  white-space: nowrap;
  &:hover {
    color: #ddd;
    background-color: rgba(47, 51, 56, 0.2);
  }
`;

type FolderBoxProps = {
  data_path: string;
  folders_key: string[] | undefined;
  folders_obj: object | undefined;
  currentRepoKey: string | undefined;
  currentFolderKey: string | undefined;
  repoSwitch: (id: string | undefined) => void;
  folderSwitch: (
    dataPath: string | null,
    folderKey: string | undefined
  ) => void;
  reorderFolder: (
    data_path: string,
    repo_key: string,
    new_folders_key: string[]
  ) => void;
  width: number;
};

export default FolderBox;
