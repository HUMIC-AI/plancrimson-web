export type DragStatus<T> =
  | {
    dragging: false;
  }
  | {
    dragging: true;
    data: T;
  };

export interface DragContext<DragData, DropArgs> {
  dragStatus: DragStatus<DragData>;
  setDragStatus: (status: DragStatus<DragData>) => void;
  handleDrop: (drop: DropArgs) => void;
}
