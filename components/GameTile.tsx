
import React from 'react';
import { TileInfo } from '../types';
import { getTileColor, getTileFontSize } from '../constants';

interface GameTileProps {
    tile: TileInfo;
    isSelected: boolean;
}

export const GameTile: React.FC<GameTileProps> = ({ tile, isSelected }) => {
    const colorClass = getTileColor(tile.value);
    const fontClass = getTileFontSize(tile.value);
    
    const selectionClass = isSelected && !tile.justMerged ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-700' : 'shadow-md';

    let transformClass = '';
    if (tile.isMerging) {
        transformClass = 'scale-0 opacity-0';
    } else if (tile.justMerged) {
        transformClass = 'scale-125';
    } else if (isSelected) {
        transformClass = 'scale-110';
    } else {
        transformClass = 'scale-100';
    }
    
    // Use a spring-like easing for pop animations, and standard ease for others
    const transitionBehavior = tile.justMerged ? 'ease-out' : 'ease-in-out';
    const duration = tile.justMerged ? 'duration-200' : 'duration-300';

    return (
        <div 
            className={`w-full h-full rounded-lg flex items-center justify-center font-black select-none
                        ${colorClass} ${fontClass} ${selectionClass} ${transformClass}
                        transition-all ${duration} ${transitionBehavior}`}
        >
            {tile.value}
        </div>
    );
};