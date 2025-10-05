import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
interface ColorDirectionMapperProps {
  colorMap: Record<string, string>;
  setColorMap: (map: Record<string, string>) => void;
  colors: Record<string, string>;
  directions: string[];
}
const DirectionIcon = ({ direction }: { direction: string }) => {
  switch (direction.toUpperCase()) {
    case 'U': return <ArrowUp className="w-5 h-5" />;
    case 'D': return <ArrowDown className="w-5 h-5" />;
    case 'L': return <ArrowLeft className="w-5 h-5" />;
    case 'R': return <ArrowRight className="w-5 h-5" />;
    default: return <span className="text-sm font-bold">{direction}</span>;
  }
};
function DraggableDirection({ direction }: { direction: string }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: direction });
  const style = { transform: CSS.Translate.toString(transform) };
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none">
      <Badge variant="secondary" className="cursor-grab flex items-center gap-2 p-2 px-3">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
        <DirectionIcon direction={direction} />
        <span className="font-bold">{direction}</span>
      </Badge>
    </div>
  );
}
function DroppableColor({ colorName, colorValue, mappedDirection, children }: { colorName: string; colorValue: string, mappedDirection?: string, children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: colorName });
  return (
    <div ref={setNodeRef} className="flex items-center gap-4 p-3 border rounded-lg bg-background">
      <div className="w-10 h-10 rounded-full" style={{ backgroundColor: colorValue }} />
      <div className={`flex-1 h-12 flex items-center justify-center rounded-md border-2 ${isOver ? 'border-brand-green border-dashed' : 'border-transparent'}`}>
        {children}
      </div>
    </div>
  );
}
export function ColorDirectionMapper({ colorMap, setColorMap, colors, directions }: ColorDirectionMapperProps) {
  const unmappedDirections = useMemo(() => {
    const mapped = Object.values(colorMap);
    return directions.filter(dir => !mapped.includes(dir));
  }, [colorMap, directions]);
  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;
    if (over && active) {
      const direction = active.id as string;
      const colorClass = over.id as string;
      const newMap = { ...colorMap };
      // Find if the target color already has a mapping
      const existingDirForColor = newMap[colorClass];
      // Find if the dragged direction was previously mapped to another color
      const prevColorForDir = Object.keys(newMap).find(key => newMap[key] === direction);
      // If the target color had a mapping, and the dragged direction was mapped, swap them
      if (existingDirForColor && prevColorForDir) {
        newMap[prevColorForDir] = existingDirForColor;
      } else if (prevColorForDir) {
        // If dragged direction was mapped but target was empty, unmap it
        delete newMap[prevColorForDir];
      }
      // Set the new mapping
      newMap[colorClass] = direction;
      setColorMap(newMap);
    }
  };
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-4">
          <h4 className="font-semibold mb-4 text-center">Available Directions</h4>
          <div className="flex flex-wrap justify-center gap-3 p-4 min-h-[8rem] bg-slate-100 dark:bg-slate-800 rounded-lg">
            {unmappedDirections.length > 0 ? unmappedDirections.map(dir => (
              <DraggableDirection key={dir} direction={dir} />
            )) : <p className="text-sm text-muted-foreground">All directions mapped!</p>}
          </div>
        </Card>
        <div className="space-y-3">
          {Object.entries(colors).map(([colorName, colorValue]) => {
            const mappedDirection = colorMap[colorName];
            return (
              <DroppableColor key={colorName} colorName={colorName} colorValue={colorValue} mappedDirection={mappedDirection}>
                {mappedDirection ? (
                  <DraggableDirection direction={mappedDirection} />
                ) : (
                  <span className="text-sm text-muted-foreground">Drop a direction here</span>
                )}
              </DroppableColor>
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}