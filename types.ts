
export interface TileData {
  id: number;
  value: number;
}

export interface TileInfo extends TileData {
  row: number;
  col: number;
  key: string;
  isMerging?: boolean;
  justMerged?: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface GameState {
    board: TileInfo[];
    totalScore: number;
}

export interface ScorePopupData {
    id: number;
    score: number;
    position: Position;
    multiplier: number;
}