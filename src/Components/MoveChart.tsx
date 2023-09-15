import {
  Area,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Scatter,
  XAxis,
  CartesianGrid,
  ComposedChart,
} from 'recharts';
import { GameReview } from '../Shared/Model';
import { useMemo } from 'react';
import {
  MoveClassification,
  MoveClassificationColors,
} from '../Shared/Constants';

interface MoveChartProps {
  reviewData: GameReview;
}

export function MoveChart({ reviewData }: MoveChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="bg-gray-200 text-white-500 px-4 py-2 font-semibold flex rounded-md"
          style={{ backgroundColor: payload[0].payload.color }}
        >
          <span className="mx-3">{`${payload[0].payload.move}`}</span>
          <span>{payload[0].payload.text}</span>
        </div>
      );
    }

    return null;
  };

  const data = useMemo(() => {
    if (!reviewData) {
      return [];
    }
    const chartData = [];
    let index = 1;
    for (const move of reviewData.moves) {
      if (move.playedMove.bestLine?.winChance) {
        const eloChanged = +(
          move.playedMove.bestLine.score.value / 100
        ).toFixed(1);
        const text = (eloChanged > 0 ? '+' : '') + eloChanged;
        const moveText =
          move.color === 'w'
            ? `${Math.floor(index / 2) + 1}. ${move.san}`
            : `${Math.floor(index / 2) + 1}... ${move.san}`;
        chartData.push({
          move: moveText,
          text,
          index: index++,
          showDot: [
            MoveClassification.inaccuracy,
            MoveClassification.mistake,
            MoveClassification.miss,
            MoveClassification.blunder,
          ].includes(move.playedMove.classification),
          color:
            move.playedMove.classification &&
            MoveClassificationColors[move.playedMove.classification],
          winChance:
            move.color === 'w'
              ? move.playedMove.bestLine?.winChance
              : 100 - move.playedMove.bestLine?.winChance,
        });
      }
    }
    return chartData;
  }, [reviewData]);

  return (
    <div className="mb-2 w-full">
      <ResponsiveContainer width="100%" height={100}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="1 1" />
          <Tooltip content={<CustomTooltip />} />
          <YAxis domain={[0, 100]} hide={true} />
          <XAxis dataKey="index" hide={true} />
          <Scatter dataKey="winChance" fill="#333" hide={true}></Scatter>

          <Area
            type="monotone"
            dataKey="winChance"
            stroke="transparent"
            fill="#48ed42"
          />
          {/* <Line type="monotone" dataKey="winChance" stroke="#82ca9d" /> */}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MoveChart;
