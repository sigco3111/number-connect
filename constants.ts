
export const ROWS = 7;
export const COLS = 5;
export const INITIAL_VALUES = [2, 4, 8, 16];
export const UNDO_LIMIT = 5;

export const TILE_SIZE = 64; // size of the tile in pixels
export const TILE_GAP = 8; // gap between tiles in pixels

export const getTileColor = (value: number): string => {
    const colors: { [key: number]: string } = {
        2: 'bg-rose-400 text-rose-900',
        4: 'bg-purple-400 text-purple-900',
        8: 'bg-amber-400 text-amber-900',
        16: 'bg-lime-400 text-lime-900',
        32: 'bg-cyan-400 text-cyan-900',
        64: 'bg-orange-400 text-orange-900',
        128: 'bg-indigo-400 text-white',
        256: 'bg-emerald-400 text-white',
        512: 'bg-teal-400 text-white',
        1024: 'bg-fuchsia-400 text-white',
        2048: 'bg-pink-500 text-white',
        4096: 'bg-sky-500 text-white',
        8192: 'bg-red-500 text-white',
    };
    return colors[value] || 'bg-slate-600 text-white';
};

export const getTileFontSize = (value: number): string => {
    const len = value.toString().length;
    if (len < 4) return 'text-3xl';
    if (len === 4) return 'text-2xl';
    if (len === 5) return 'text-xl';
    return 'text-lg';
}
