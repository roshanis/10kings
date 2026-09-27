import React from 'react';
import {Composition, Series} from 'remotion';
import './theme';
import {kings} from './data';
import {EndCard, KingCard, MAP_DURATION, MapScene, Opening} from './scenes';

const OPENING = 130;
const CARD = 105;
const END = 150;
const TOTAL = OPENING + MAP_DURATION + kings.length * CARD + END;

const Trailer: React.FC = () => (
  <Series>
    <Series.Sequence durationInFrames={OPENING}>
      <Opening />
    </Series.Sequence>
    <Series.Sequence durationInFrames={MAP_DURATION}>
      <MapScene />
    </Series.Sequence>
    {kings.map((king, i) => (
      <Series.Sequence key={king.id} durationInFrames={CARD}>
        <KingCard king={king} index={i} />
      </Series.Sequence>
    ))}
    <Series.Sequence durationInFrames={END}>
      <EndCard />
    </Series.Sequence>
  </Series>
);

export const RemotionRoot: React.FC = () => (
  <Composition id="Trailer" component={Trailer} durationInFrames={TOTAL} fps={30} width={1920} height={1080} />
);
