import { useEffect, useState, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Move, Square } from 'chess.js';
import { LuChevronFirst, LuDownload, LuChevronLast } from 'react-icons/lu';
import { BsPlayFill, BsStopFill } from 'react-icons/bs';
import { GrPrevious, GrNext } from 'react-icons/gr';
import { PiSpeakerHigh, PiSpeakerX } from 'react-icons/pi';
import { useStockfish } from '../Hooks/useStockfish';
import useViewport from '../Hooks/useViewport';
import { StockfishLine } from '../Hooks/StockfishEngine';
import ReviewLoading from './ReviewLoading';
import { MdReviews } from 'react-icons/md';
interface IReplayProps {
  data: {
    Game: string;
    White: string;
    Black: string;
    WhiteElo: string;
    BlackElo: string;
    Event: string;
    Site: string;
    Pgn: string;
    Moves: string[];
    LastPosition: string;
    Year: string;
    Result: string;
    ECO: string;
  };
}
function partitionListIntoPairs<T>(arr: T[]): Array<T[]> {
  return arr.reduce((result, current, index) => {
    if (index % 2 === 0) {
      result.push([current]);
    } else {
      result[Math.floor(index / 2)].push(current);
    }
    return result;
  }, [] as Array<T[]>);
}

const playSound = (move: Move) => {
  let audioType = move.color === 'w' ? 'move-self' : 'move-opponent';
  if (move.san.includes('x')) {
    audioType = 'capture';
  }

  if (move.san.includes('+')) {
    audioType = 'move-check';
  }
  if (move.san.includes('=')) {
    audioType = 'promote';
  }
  if (move.san.includes('-')) {
    audioType = 'castle';
  }

  if (move.san.includes('#')) {
    audioType = 'game-end';
  }

  const fileCDN =
    'https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default';
  new Audio(`${fileCDN}/${audioType}.mp3`).play();
};
export function GameViewer({ data }: IReplayProps) {
  const blackElo = useRef<HTMLDivElement>();
  const whiteElo = useRef<HTMLDivElement>();
  const [eloText, setEloText] = useState('0.0');
  const [arrow, setArrow] = useState<Square[][]>([]);
  const [moveList, setMoveList] = useState<Move[]>([]);
  const { engine, gameData, reviewData, reviewStatus } = useStockfish();
  const { height } = useViewport();
  const [currentMoveIndex, setCurrentMoveIndex] = useState(
    data.Moves.length - 1
  );
  const [fen, setFen] = useState(data.LastPosition);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMute, setMute] = useState(false);

  function moveTo(index: number) {
    if (index < 0) {
      return;
    }
    setCurrentMoveIndex(index);
  }

  useEffect(() => {
    if (reviewData) {
      setMoveList(reviewData);
    }
  }, [reviewData]);
  useEffect(() => {
    engine?.findBestMove(data.LastPosition);
  }, [engine, data.LastPosition]);

  useEffect(() => {
    const item: any = moveList[currentMoveIndex];
    if (item) {
      if (!isMute) {
        playSound(item);
      }
      engine?.findBestMove(item.after, 20);
      if (item.review) {
        const bestmove: string = item.review.bestmove.bestmove || '';
        setArrow([
          [
            bestmove.substring(0, 2) as Square,
            bestmove.substring(2, 4) as Square,
          ],
        ]);
      }
      setFen(item.after);
    }
    if (currentMoveIndex >= moveList.length) {
      setIsPlaying(false);
    }
  }, [currentMoveIndex, isMute, moveList]);
  useEffect(() => {
    if (gameData && gameData.bestmove && gameData.position) {
      // console.log('Update Elo bar', gameData);
      const [, player] = gameData.position.split(' ');
      const bestMove = gameData.lines.find((x: StockfishLine) =>
        x.pv.startsWith(gameData.bestmove.bestmove)
      );
      if (!bestMove) {
        return;
      }
      const score = bestMove.score.value / 100;
      // console.log('player', bestMove, player, score);

      let p = Math.min(50, (score / 8) * 50);
      p = Math.max(-50, p);
      if (bestMove.score.type === 'mate') {
        p = (49 * bestMove.score.value) / Math.abs(bestMove.score.value);
        setEloText(`M${bestMove.score.value.toFixed(0)}`);
      } else {
        setEloText(Math.abs(score).toFixed(1));
      }
      if (whiteElo.current && blackElo.current) {
        if (player === 'w') {
          whiteElo.current.style.height = 50 + p + '%';
          blackElo.current.style.height = 50 - p + '%';
        } else {
          whiteElo.current.style.height = 50 - p + '%';
          blackElo.current.style.height = 50 + p + '%';
        }
      }
    }
  }, [gameData]);

  useEffect(() => {
    let intervalId: number = 0;

    if (isPlaying) {
      intervalId = setInterval(() => {
        if (currentMoveIndex < moveList.length) {
          setCurrentMoveIndex((previousCount) => previousCount + 1);
        }

        if (currentMoveIndex === moveList.length) {
          clearInterval(intervalId);
          setIsPlaying(false);
        }
      }, 1000);
    } else {
      if (intervalId) clearInterval(intervalId);
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [isPlaying, moveList.length, currentMoveIndex]);

  useEffect(() => {
    const simulateGame = new Chess();
    for (const move of data.Moves) {
      simulateGame.move(move);
    }
    setMoveList(simulateGame.history({ verbose: true }));
  }, [data.Moves]);

  useEffect(() => {
    const handleKeyPress = (e: any) => {
      if (e.key === 'ArrowRight') {
        moveTo(currentMoveIndex + 1);
      }
      if (e.key === 'ArrowLeft') {
        moveTo(currentMoveIndex - 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentMoveIndex]);
  const togglePlay = () => {
    if (!isPlaying && currentMoveIndex >= data.Moves.length - 1) {
      setCurrentMoveIndex(0);
    }
    setIsPlaying(!isPlaying);
  };
  const toggleSpeaker = () => {
    setMute(!isMute);
  };
  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([data.Pgn], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = data.Game.trim() + '.pgn'; // Change the filename as needed
    document.body.appendChild(element);
    element.click();
  };

  const pairMoves = partitionListIntoPairs(moveList);

  const getClassName = (m: any) => {
    return 'move-classification-' + m.review?.classification || '';
  };
  return (
    <div>
      <div className="pt-3 text-center font-semibold">
        {data.White} ({data.WhiteElo}) vs {data.Black} ({data.BlackElo}) -{' '}
        {data.Result} in {data.Event} - {data.Year}
      </div>
      <div className="pt-1 text-center mb-3">{data.ECO}</div>

      <div className="flex">
        <div className="elo-bar" style={{ height: height - 200 }}>
          <span className="absolute text-xs p-1 text-white">{eloText}</span>
          <div
            className="w-full h-[50%] bg-black-100 transition-height duration-300 ease-linear"
            ref={blackElo as any}
          ></div>
          <div
            className="w-full h-[50%] bg-green-500 transition-height duration-300 ease-linear"
            ref={whiteElo as any}
          ></div>
        </div>

        <div className="flex flex-col">
          <Chessboard
            position={fen}
            boardWidth={height - 200}
            customArrows={arrow}
            customArrowColor="#11d954"
          />
          <div className="flex w-full justify-center mt-3 items-center">
            <button onClick={() => moveTo(0)} className="p-3 cursor-pointer">
              <LuChevronFirst />
            </button>
            <button
              onClick={() => moveTo(currentMoveIndex - 1)}
              className="p-3 cursor-pointer"
            >
              <GrPrevious />
            </button>
            <button onClick={togglePlay} className="p-3 cursor-pointer">
              {isPlaying ? (
                <BsStopFill color="red" />
              ) : (
                <BsPlayFill color="green" />
              )}
            </button>
            <button
              onClick={() => moveTo(currentMoveIndex + 1)}
              className="p-3 cursor-pointer"
            >
              <GrNext />
            </button>
            <button onClick={() => moveTo(moveList.length - 1)}>
              <LuChevronLast />
            </button>
            <button
              onClick={toggleSpeaker}
              className="ml-10 p-3 cursor-pointer"
            >
              {isMute ? (
                <PiSpeakerX color="red" />
              ) : (
                <PiSpeakerHigh color="green" />
              )}
            </button>
            <button onClick={handleDownload} className="p-3 cursor-pointer">
              <LuDownload />
            </button>

            <button
              onClick={() => engine?.gameReview(moveList)}
              className="p-3 cursor-pointer"
            >
              <MdReviews />
            </button>
          </div>
        </div>
        <div
          className="ml-3 flex flex-col pl-2 w-[220px] overflow-y-scroll overflow-x-hidden"
          style={{ maxHeight: height - 200 }}
        >
          {pairMoves?.map(([white, black], index) => (
            <div
              className="flex w-[220px] items-center border-b border-dashed border-gray-300 mb-1"
              key={index}
            >
              <span className="text-right w-[25px] block mr-2">
                {index + 1}.
              </span>
              <a
                className={`cursor-pointer  pl-3 flex-1 hover:bg-slate-600 hover:text-white ${
                  index * 2 === currentMoveIndex
                    ? 'bg-blue-500 font-medium text-white'
                    : ''
                } ${getClassName(white)}`}
                onClick={() => moveTo(index * 2)}
              >
                {white?.san}
              </a>
              <a
                className={`cursor-pointer pl-3 flex-1 hover:bg-slate-600 hover:text-white ${
                  index * 2 + 1 === currentMoveIndex
                    ? 'bg-blue-500 font-medium text-white'
                    : ''
                } ${getClassName(white)}`}
                onClick={() => moveTo(index * 2 + 1)}
              >
                {black?.san}
              </a>
            </div>
          ))}
        </div>
      </div>
      {reviewStatus && !reviewStatus.done && (
        <ReviewLoading data={reviewStatus} />
      )}
    </div>
  );
}
