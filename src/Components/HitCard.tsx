import type { Hit } from 'instantsearch.js';
import React from 'react';
import { BiSolidMap, BiCalendarEvent, BiSolidChess } from 'react-icons/bi';
import { BsFillCalendarDateFill } from 'react-icons/bs';
import { MdOutlineSportsScore } from 'react-icons/md';
import { Highlight } from 'react-instantsearch';

type HitProps = {
  hit: Hit;
  onHitClick: (item: any) => void;
};

export function HitCard({ hit, onHitClick }: HitProps) {
  return (
    <div className="flex flex-col" onClick={() => onHitClick(hit)}>
      <div className=" flex items-center w-full align-middle justify-around mb-2">
        <img
          src={`https://chess-board.fly.dev/?fen=${hit.LastPosition}&size=120&frame=false`}
          alt={hit.Game}
        />
      </div>

      <div className="w-full">
        <h2>
          <BiSolidChess className="inline-block mr-1" />
          <Highlight attribute="White" hit={hit} /> vs{' '}
          <Highlight attribute="Black" hit={hit} />
        </h2>
        <p>
          <MdOutlineSportsScore className="inline-block mr-1" />{' '}
          <Highlight attribute="Result" hit={hit} /> <br />
          <BiCalendarEvent className="inline-block mr-1" />
          <Highlight attribute="Event" hit={hit} />
          <br />
          <BiSolidMap className="inline-block mr-1" />
          <Highlight attribute="Site" hit={hit} /> <br />
          <BsFillCalendarDateFill className="inline-block mr-1" />
          <Highlight attribute="Date" hit={hit} />
        </p>
      </div>
    </div>
  );
}
