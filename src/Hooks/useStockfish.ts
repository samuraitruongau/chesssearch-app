import { useEffect, useState } from 'react';
import { GameReview, ReviewStatus, StockfishEngine } from './StockfishEngine';

export function useStockfish() {
  const [gameData, setGameData] = useState<any>();
  const [reviewData, setReviewData] = useState<GameReview>();
  const [engine, setEngine] = useState<StockfishEngine>();
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus | undefined>(
    undefined
  );

  useEffect(() => {
    const initStockfishWorkerEngine = async () => {
      console.log('initial new engine');
      setEngine(
        new StockfishEngine((type, data) => {
          if (type === 'review') {
            setReviewData(data);
            console.log(data);
          }

          if (type === 'bestmove') {
            // console.log(data);
            setGameData(data);
          }
          if (type === 'review-status') {
            setReviewStatus(data);
          }
        })
      );
    };

    if (!engine) {
      initStockfishWorkerEngine();
    }
    return () => {
      console.log('kill the engine');
      if (engine) engine.quit();
    };
  }, [engine]);

  return {
    gameData,
    reviewData,
    engine,
    reviewStatus,
  };
}
