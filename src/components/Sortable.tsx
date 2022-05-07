import { useSortable } from "@dnd-kit/sortable";

export const Sortable = (props: any) => {
  const { attributes, listeners, setNodeRef } = useSortable({
    id: props.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={props.className}
    >
      {props.children}
    </div>
  );
};
