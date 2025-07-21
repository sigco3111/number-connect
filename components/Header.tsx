
import React from 'react';
import { InfoIcon } from './Icons';

const COMBO_TIMEOUT_MS = 3000;

interface HeaderProps {
    currentScore: number;
    totalScore: number;
    isLocked: boolean;
    onRestart: () => void;
    onToggleHint: () => void;
    comboCount: number;
    comboMultiplier: number;
    comboKey: number;
}

const ScoreBox: React.FC<{ title: string; score: number; isTotal?: boolean; }> = ({ title, score, isTotal }) => (
    <div className={`flex flex-col items-center justify-center p-2 rounded-lg ${isTotal ? 'bg-slate-800' : 'bg-slate-800'} min-w-[100px]`}>
        <span className="text-xs text-slate-400 uppercase">{title}</span>
        <span className={`font-bold text-2xl ${isTotal ? 'text-emerald-400' : 'text-white'}`}>{score.toLocaleString()}</span>
    </div>
);

export const Header: React.FC<HeaderProps> = ({ currentScore, totalScore, isLocked, onRestart, onToggleHint, comboCount, comboMultiplier, comboKey }) => {
    return (
        <header className="w-full max-w-md mx-auto p-4 flex justify-between items-center select-none relative">
            <button onClick={onRestart} disabled={isLocked} className="p-2 text-slate-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-3xl w-12 h-12 flex items-center justify-center">
                <span role="img" aria-label="Restart">🔄</span>
            </button>
            
            <div className="flex gap-2">
                <ScoreBox title="점수" score={currentScore} />
                <ScoreBox title="총점" score={totalScore} isTotal />
            </div>

            <div className="w-12 h-12 flex items-center justify-center">
                 <button onClick={onToggleHint} disabled={isLocked} className="p-2 text-slate-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <InfoIcon className="w-8 h-8"/>
                </button>
            </div>

            {/* COMBO INDICATOR */}
            {comboCount > 1 && (
                <div
                    key={comboKey} // Use key to force re-render and restart animation
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-center pointer-events-none"
                    style={{ zIndex: 20 }}
                >
                    <div className="animate-pop-in">
                        <span className="font-black text-3xl text-amber-400 drop-shadow-lg">
                            {`x${comboMultiplier.toFixed(1)}`} COMBO!
                        </span>
                        <div className="h-1.5 bg-slate-900/50 rounded-full overflow-hidden mt-1 w-48 mx-auto">
                            <div
                                className="h-full bg-gradient-to-r from-amber-300 to-amber-500 rounded-full animate-shrink-width"
                                style={{ animationDuration: `${COMBO_TIMEOUT_MS}ms` }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};