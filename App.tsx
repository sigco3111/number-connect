
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { GameBoard } from './components/GameBoard';
import { InfoIcon } from './components/Icons';
import { TileInfo, GameState, Position, ScorePopupData } from './types';
import { ROWS, COLS, INITIAL_VALUES, UNDO_LIMIT } from './constants';

// 로컬 스토리지 키 상수 정의
const STORAGE_KEY = 'number-connect-game-state';
const COMBO_TIMEOUT = 3000;

// 저장된 게임 상태를 로컬 스토리지에서 로드하는 함수
const loadGameState = (): { board: TileInfo[], totalScore: number, history: GameState[] } | null => {
    try {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (!savedState) return null;
        
        const parsedState = JSON.parse(savedState);
        return parsedState;
    } catch (error) {
        console.error('게임 상태 로딩 중 오류 발생:', error);
        return null;
    }
};

// 게임 상태를 로컬 스토리지에 저장하는 함수
const saveGameState = (board: TileInfo[], totalScore: number, history: GameState[]) => {
    try {
        const gameState = { board, totalScore, history };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (error) {
        console.error('게임 상태 저장 중 오류 발생:', error);
    }
};

const HintModal: React.FC<{onClose: () => void}> = ({ onClose }) => (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
        <div className="bg-slate-800 text-white p-6 rounded-xl max-w-sm w-full shadow-lg text-center" onClick={e => e.stopPropagation()}>
            <InfoIcon className="w-16 h-16 mx-auto text-cyan-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">게임 방법</h2>
            <p className="text-slate-300 mb-4">
                인접한 블록을 연결하여 합치세요!
            </p>
            <ul className="text-left list-disc list-inside space-y-2 text-slate-300">
                <li>연결의 첫 두 블록은 같은 숫자여야 합니다.</li>
                <li>그 다음 블록부터는 이전 블록과 같거나, 이전 블록의 두 배인 숫자여야 합니다.</li>
                <li>예시: <span className="font-mono bg-slate-700 px-2 py-1 rounded">2-2-4-8-8</span></li>
            </ul>
            <button
                onClick={onClose}
                className="mt-6 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg w-full transition-colors"
            >
                알겠습니다!
            </button>
        </div>
    </div>
);

const GameOverModal: React.FC<{ score: number; onRestart: () => void; history: GameState[] }> = ({ score, onRestart, history }) => {
    const moveScores = useMemo(() => {
        if (!history) return [];

        const allScores = [...history.map(h => h.totalScore), score];
        const derivedScores: number[] = [];

        for (let i = 1; i < allScores.length; i++) {
            const moveScore = allScores[i] - allScores[i - 1];
            if (moveScore > 0) {
                derivedScores.push(moveScore);
            }
        }
        return derivedScores;
    }, [history, score]);

    const maxMoveScore = useMemo(() => Math.max(...moveScores, 1), [moveScores]);

    return (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 text-white p-8 rounded-xl max-w-sm w-full shadow-lg text-center" onClick={e => e.stopPropagation()}>
                <h2 className="text-4xl font-bold mb-2 text-red-500">게임 종료</h2>
                <p className="text-slate-300 mb-4 text-lg">더 이상 움직일 수 없습니다!</p>
                <div className="my-6">
                    <p className="text-slate-400 uppercase text-sm">최종 점수</p>
                    <p className="text-emerald-400 font-bold text-5xl">{score.toLocaleString()}</p>
                </div>

                {moveScores.length > 0 && (
                    <div className="my-6">
                        <p className="text-slate-400 uppercase text-sm mb-2 text-left">점수 기록</p>
                        <div className="h-20 bg-slate-900/50 rounded-lg p-2 flex items-end justify-start gap-1 overflow-x-auto">
                            {moveScores.map((moveScore, index) => (
                                <div
                                    key={index}
                                    className="bg-cyan-500 hover:bg-cyan-400 rounded-t-sm flex-shrink-0"
                                    style={{
                                        width: '8px',
                                        height: `${Math.max((moveScore / maxMoveScore) * 100, 5)}%`,
                                        transition: 'background-color 150ms, height 300ms ease-out'
                                    }}
                                    title={`+${moveScore.toLocaleString()}`}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <button
                    onClick={onRestart}
                    className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg w-full transition-colors flex items-center justify-center gap-2 text-lg"
                >
                    <span role="img" aria-label="Restart">🔄</span>
                    다시 시작
                </button>
            </div>
        </div>
    );
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const checkForGameOver = (board: TileInfo[]): boolean => {
    if (board.length < ROWS * COLS) return false;

    const grid: (TileInfo | null)[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    board.forEach(tile => {
        if (tile.row < ROWS && tile.col < COLS) {
            grid[tile.row][tile.col] = tile;
        }
    });

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const currentTile = grid[r][c];
            if (!currentTile) continue;

            // Check all 8 neighbors
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;

                    const nr = r + dr;
                    const nc = c + dc;

                    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                        const neighborTile = grid[nr][nc];
                        if (neighborTile && neighborTile.value === currentTile.value) {
                            return false; // Found a possible move
                        }
                    }
                }
            }
        }
    }
    return true; // No possible moves found
};


const App: React.FC = () => {
    const tileIdCounter = useRef(0);
    const popupIdCounter = useRef(0);
    const [board, setBoard] = useState<TileInfo[]>([]);
    const [selection, setSelection] = useState<TileInfo[]>([]);
    const [isSelecting, setIsSelecting] = useState(false);
    const [currentScore, setCurrentScore] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [history, setHistory] = useState<GameState[]>([]);
    const [showHint, setShowHint] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    
    // Combo State
    const [comboCount, setComboCount] = useState(0);
    const comboTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [comboKey, setComboKey] = useState(0);
    const [scorePopups, setScorePopups] = useState<ScorePopupData[]>([]);
    
    // 자동저장 타이머 참조
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    const generateRandomTileValue = () => INITIAL_VALUES[Math.floor(Math.random() * INITIAL_VALUES.length)];

    const createTile = (pos: Position, value?: number): TileInfo => {
        tileIdCounter.current += 1;
        return {
            id: tileIdCounter.current,
            value: value || generateRandomTileValue(),
            row: pos.row,
            col: pos.col,
            key: `${pos.row}-${pos.col}-${tileIdCounter.current}`
        };
    };

    const initializeBoard = useCallback(() => {
        // 저장된 게임 상태 로드 시도
        const savedState = loadGameState();

        if (savedState) {
            // 저장된 상태가 있으면 복원
            setBoard(savedState.board);
            setTotalScore(savedState.totalScore);
            setHistory(savedState.history);
            
            // 타일 ID 카운터 업데이트
            const maxId = savedState.board.reduce((max, tile) => Math.max(max, tile.id), 0);
            tileIdCounter.current = maxId;
        } else {
            // 저장된 상태가 없으면 새 게임 보드 생성
            let initialBoard: TileInfo[] = [];
            for (let row = 0; row < ROWS; row++) {
                for (let col = 0; col < COLS; col++) {
                    initialBoard.push(createTile({ row, col }));
                }
            }
            setBoard(initialBoard);
            setTotalScore(0);
            setHistory([]);
        }

        // 공통 상태 초기화
        setSelection([]);
        setCurrentScore(0);
        setIsLocked(false);
        setIsGameOver(false);
        setComboCount(0);
        setScorePopups([]);
    }, []);

    // 컴포넌트 마운트 시 보드 초기화
    useEffect(() => {
        initializeBoard();
    }, [initializeBoard]);

    // 자동저장 기능 구현
    useEffect(() => {
        // 게임 상태가 변경될 때마다 자동저장 실행
        if (board.length > 0 && !isGameOver) {
            // 이전 타이머 초기화
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
            
            // 3초 후 자동저장 실행
            autoSaveTimerRef.current = setTimeout(() => {
                saveGameState(board, totalScore, history);
                console.log('게임 상태가 자동저장되었습니다.');
            }, 3000);
        }
        
        // 컴포넌트 언마운트 시 타이머 정리
        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [board, totalScore, history, isGameOver]);

    const handleRestart = () => {
        if (isLocked && !isGameOver) return;
        if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
        
        // 게임 재시작 시 로컬 스토리지 초기화
        localStorage.removeItem(STORAGE_KEY);
        
        setIsGameOver(false);
        initializeBoard();
    };
    
    const getComboMultiplier = (count: number): number => {
        if (count < 2) return 1.0;
        if (count === 2) return 1.2;
        if (count === 3) return 1.5;
        if (count === 4) return 1.8;
        return 2.0;
    };

    const saveToHistory = (currentState: GameState) => {
        const newHistory = [...history, currentState];
        if (newHistory.length > UNDO_LIMIT) {
            newHistory.shift();
        }
        setHistory(newHistory);
    };

    const handleTilePointerDown = (tile: TileInfo) => {
        if (isLocked) return;
        setIsSelecting(true);
        setSelection([tile]);
        setCurrentScore(tile.value);
    };

    const handleTilePointerMove = (tile: TileInfo) => {
        if (!isSelecting || isLocked) return;

        const lastSelected = selection[selection.length - 1];
        if (tile.id === lastSelected?.id) return;
        
        const secondLastSelected = selection[selection.length-2];
        if (secondLastSelected && tile.id === secondLastSelected.id) {
            const newSelection = selection.slice(0, -1);
            setSelection(newSelection);
            setCurrentScore(currentScore - lastSelected.value);
            return;
        }

        if (selection.find(t => t.id === tile.id)) return;

        const isAdjacent = Math.abs(tile.row - lastSelected.row) <= 1 && Math.abs(tile.col - lastSelected.col) <= 1;
        if (!isAdjacent) return;
        
        const isValidNext = (selection.length === 1 && tile.value === lastSelected.value) ||
                            (selection.length > 1 && (tile.value === lastSelected.value || tile.value === lastSelected.value * 2));

        if (isValidNext) {
            const newSelection = [...selection, tile];
            setSelection(newSelection);
            setCurrentScore(currentScore + tile.value);
        }
    };

    const handlePointerUp = async () => {
        if (!isSelecting || isLocked) {
            setIsSelecting(false);
            setSelection([]);
            setCurrentScore(0);
            return;
        }
        
        if (selection.length < 2) {
            setIsSelecting(false);
            setSelection([]);
            setCurrentScore(0);
            return;
        }

        setIsLocked(true);
        saveToHistory({ board, totalScore });
        
        // --- COMBO LOGIC ---
        if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
        const newComboCount = comboCount + 1;
        const multiplier = getComboMultiplier(newComboCount);
        const finalMoveScore = Math.round(currentScore * multiplier);
        const newTotalScore = totalScore + finalMoveScore;
        const lastSelected = selection[selection.length - 1];

        // --- SCORE POPUP ---
        const popupId = popupIdCounter.current++;
        const newPopup: ScorePopupData = {
            id: popupId,
            score: finalMoveScore,
            position: { row: lastSelected.row, col: lastSelected.col },
            multiplier: multiplier
        };
        setScorePopups(current => [...current, newPopup]);
        setTimeout(() => {
            setScorePopups(current => current.filter(p => p.id !== popupId));
        }, 1500);
        
        const selectionIdsToMerge = new Set(selection.slice(0, -1).map(t => t.id));

        // 1. Animate selected tiles merging into the last one
        setBoard(currentBoard =>
            currentBoard.map(tile => {
                if (selectionIdsToMerge.has(tile.id)) {
                    return { ...tile, row: lastSelected.row, col: lastSelected.col, isMerging: true };
                }
                return tile;
            })
        );
        
        await delay(300); // Wait for merge animation

        // 2. Process the merge and apply gravity
        const selectionIds = new Set(selection.map(t => t.id));
        
        const boardAfterMerge = board
            .filter(t => !selectionIds.has(t.id))
            .concat([{ ...lastSelected, value: currentScore, key: `merged-${lastSelected.id}-${tileIdCounter.current}`, isMerging: false, justMerged: true }]);

        const finalBoard: TileInfo[] = [];
        for (let col = 0; col < COLS; col++) {
            const column = boardAfterMerge.filter(t => t.col === col).sort((a,b) => b.row - a.row);
            
            column.forEach((tile, index) => {
                finalBoard.push({ ...tile, row: ROWS - 1 - index });
            });

            const newTilesCount = ROWS - column.length;
            for(let i = 0; i < newTilesCount; i++){
                finalBoard.push(createTile({ row: newTilesCount - 1 - i, col }));
            }
        }
        
        setBoard(finalBoard);
        setTotalScore(newTotalScore);
        
        // --- COMBO STATE UPDATE ---
        setComboCount(newComboCount);
        setComboKey(k => k + 1); // For animation reset
        comboTimerRef.current = setTimeout(() => {
            setComboCount(0);
        }, COMBO_TIMEOUT);
        
        const noMovesLeft = checkForGameOver(finalBoard);
        if (noMovesLeft) {
            if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
            setComboCount(0);
            setIsGameOver(true);
        }

        // Wait for the "pop" animation of the new tile
        await delay(200);
        
        setBoard(currentBoard => currentBoard.map(t => ({ ...t, justMerged: false })));

        setIsSelecting(false);
        setSelection([]);
        setCurrentScore(0);
        
        if (!noMovesLeft) {
            setIsLocked(false);
        }
    };


    return (
        <div className="bg-slate-700 min-h-screen text-white font-sans flex flex-col antialiased">
            {showHint && <HintModal onClose={() => setShowHint(false)} />}
            {isGameOver && <GameOverModal score={totalScore} onRestart={handleRestart} history={history} />}
            <Header 
                currentScore={currentScore} 
                totalScore={totalScore} 
                isLocked={isLocked || isGameOver}
                onRestart={handleRestart}
                onToggleHint={() => setShowHint(true)}
                comboCount={comboCount}
                comboMultiplier={getComboMultiplier(comboCount)}
                comboKey={comboKey}
            />
            <main className="flex-grow flex items-center justify-center w-full max-w-md mx-auto">
                <GameBoard
                    board={board}
                    selection={selection}
                    isSelecting={isSelecting}
                    currentMoveScore={currentScore}
                    isLocked={isLocked || isGameOver}
                    scorePopups={scorePopups}
                    onTilePointerDown={handleTilePointerDown}
                    onTilePointerMove={handleTilePointerMove}
                    onPointerUp={handlePointerUp}
                />
            </main>
        </div>
    );
};

export default App;