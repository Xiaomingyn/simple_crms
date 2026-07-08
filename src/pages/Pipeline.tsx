import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { getDealsByStage, updateDealStage } from '../api/client';
import { Deal, STAGES, STAGE_LABELS, STAGE_COLORS } from '../types';

export default function Pipeline() {
  const navigate = useNavigate();
  const [stages, setStages] = useState<Record<string, Deal[]>>({});
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getDealsByStage().then(setStages).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceStage = source.droppableId;
    const destStage = destination.droppableId;

    // Optimistic update
    const newStages = { ...stages };
    const sourceItems = [...(newStages[sourceStage] || [])];
    const [movedItem] = sourceItems.splice(source.index, 1);
    newStages[sourceStage] = sourceItems;

    if (sourceStage !== destStage) {
      const destItems = [...(newStages[destStage] || [])];
      movedItem.stage = destStage as any;
      destItems.splice(destination.index, 0, movedItem);
      newStages[destStage] = destItems;
    } else {
      sourceItems.splice(destination.index, 0, movedItem);
      newStages[sourceStage] = sourceItems;
    }

    setStages(newStages);

    // Persist
    try {
      await updateDealStage(draggableId, destStage);
    } catch {
      load(); // Revert on error
    }
  };

  if (loading) return <div className="loading">Loading pipeline...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Pipeline</h1>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="pipeline-board">
          {STAGES.map((stage) => {
            const deals = stages[stage] || [];
            const stageColor = STAGE_COLORS[stage];
            return (
              <div key={stage} className="pipeline-column">
                <div className="pipeline-column-header" style={{ borderBottomColor: stageColor, color: stageColor }}>
                  {STAGE_LABELS[stage]}
                  <span className="pipeline-column-count">({deals.length})</span>
                </div>
                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        minHeight: 100,
                        borderRadius: 6,
                        transition: 'background 0.15s',
                      }}
                    >
                      {deals.map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="deal-card"
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.85 : 1,
                              }}
                              onClick={() => navigate(`/deals/${deal.id}`)}
                            >
                              <div className="deal-card-name">{deal.name}</div>
                              <div className="deal-card-value dollar">${deal.value.toLocaleString()}</div>
                              <div className="deal-card-meta">
                                {deal.organization_name && <div>{deal.organization_name}</div>}
                                {deal.contact_name && <div>{deal.contact_name}</div>}
                                {deal.close_date && <div>Close: {deal.close_date}</div>}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
