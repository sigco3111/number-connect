

import React, { useMemo, useRef } from 'react';
import { GameTile } from './GameTile';
import { TileInfo, ScorePopupData } from '../types';
import { COLS, ROWS, TILE_GAP, TILE_SIZE, getTileColor, getTileFontSize } from '../constants';

interface GameBoardProps {
    board: TileInfo[];
    selection: TileInfo[];
    isSelecting: boolean;
    currentMoveScore: number;
    isLocked: boolean;
    scorePopups: ScorePopupData[];
    onTilePointerDown: (tile: TileInfo) => void;
    onTilePointerMove: (tile: TileInfo) => void;
    onPointerUp: () => void;
}

const boardWidth = COLS * TILE_SIZE + (COLS - 1) * TILE_GAP;
const boardHeight = ROWS * TILE_SIZE + (ROWS - 1) * TILE_GAP;
const TILE_AND_GAP = TILE_SIZE + TILE_GAP;

export const GameBoard: React.FC<GameBoardProps> = ({
    board,
    selection,
    isSelecting,
    currentMoveScore,
    isLocked,
    scorePopups,
    onTilePointerDown,
    onTilePointerMove,
    onPointerUp
}) => {
    const boardRef = useRef<HTMLDivElement>(null);
    const selectionSet = useMemo(() => new Set(selection.map(t => t.id)), [selection]);
    
    const tileMap = useMemo(() => {
      const map = new Map<string, TileInfo>();
      board.forEach(tile => map.set(`${tile.row},${tile.col}`, tile));
      return map;
    }, [board]);

    const getTileFromEvent = (e: React.PointerEvent<HTMLDivElement>): TileInfo | null => {
        const boardEl = boardRef.current;
        if (!boardEl) return null;

        const rect = boardEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const col = Math.floor(x / TILE_AND_GAP);
        const row = Math.floor(y / TILE_AND_GAP);

        if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
            return tileMap.get(`${row},${col}`) || null;
        }
        return null;
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const tile = getTileFromEvent(e);
        if (tile) {
            onTilePointerDown(tile);
        }
    };
    
    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isSelecting) return;
        const tile = getTileFromEvent(e);
        if (tile) {
            onTilePointerMove(tile);
        }
    };

    const pathData = useMemo(() => {
        if (selection.length < 1) return '';
        return selection.map((tile, index) => {
            const x = tile.col * TILE_AND_GAP + TILE_SIZE / 2;
            const y = tile.row * TILE_AND_GAP + TILE_SIZE / 2;
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
    }, [selection]);

    const lastSelectedTile = selection.length > 0 ? selection[selection.length - 1] : null;

    return (
        <div className="flex-grow flex items-center justify-center">
            <div
                ref={boardRef}
                className={`relative grid gap-2 touch-none ${isLocked ? 'pointer-events-none' : ''}`}
                style={{
                    gridTemplateColumns: `repeat(${COLS}, ${TILE_SIZE}px)`,
                    gridTemplateRows: `repeat(${ROWS}, ${TILE_SIZE}px)`,
                    width: boardWidth,
                    height: boardHeight,
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
            >
                {/* Render empty cells for grid structure */}
                {Array.from({ length: ROWS * COLS }).map((_, i) => (
                    <div key={i} className="w-16 h-16 bg-slate-800/50 rounded-lg" />
                ))}

                {/* Render tiles on top */}
                {board.map(tile => (
                    <div
                        key={tile.key}
                        className="absolute w-16 h-16"
                        style={{
                            transform: `translate(${tile.col * TILE_AND_GAP}px, ${tile.row * TILE_AND_GAP}px)`,
                            transition: 'transform 300ms ease-in-out',
                            zIndex: tile.isMerging ? 1 : 2,
                        }}
                    >
                        <GameTile tile={tile} isSelected={selectionSet.has(tile.id)} />
                    </div>
                ))}
                
                {/* SVG for connecting line */}
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ width: boardWidth, height: boardHeight, zIndex: 3 }}>
                    <path
                        d={pathData}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.7)"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-100"
                    />
                </svg>

                {/* Score Popups */}
                {scorePopups.map(popup => {
                    const x = popup.position.col * TILE_AND_GAP + TILE_SIZE / 2;
                    const y = popup.position.row * TILE_AND_GAP;
                    const multiplierColor = popup.multiplier > 1 ? 'text-amber-400' : 'text-white';
                    return (
                        <div
                            key={popup.id}
                            className="absolute flex flex-col items-center pointer-events-none animate-float-up"
                            style={{
                                left: x,
                                top: y,
                                transform: 'translateX(-50%)',
                                zIndex: 10,
                            }}
                        >
                            <span className={`font-black text-3xl ${multiplierColor} drop-shadow-lg`}>
                                {`+${popup.score.toLocaleString()}`}
                            </span>
                            {popup.multiplier > 1 && (
                                <span className="font-bold text-lg text-amber-400 drop-shadow-md">
                                    {`x${popup.multiplier.toFixed(1)}`}
                                </span>
                            )}
                        </div>
                    );
                })}


                {/* Preview tile */}
                {isSelecting && selection.length >= 2 && lastSelectedTile && (
                     <div
                        className="absolute w-16 h-16 transition-all duration-200"
                        style={{
                            left: `${lastSelectedTile.col * TILE_AND_GAP}px`,
                            top: `-${TILE_AND_GAP}px`,
                            pointerEvents: 'none',
                            zIndex: 4
                        }}
                    >
                         <div className={`w-full h-full rounded-lg flex items-center justify-center font-black select-none
                         ${getTileColor(currentMoveScore)} ${getTileFontSize(currentMoveScore)} shadow-lg`}>
                            {currentMoveScore}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};