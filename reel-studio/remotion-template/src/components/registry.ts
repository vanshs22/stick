import React from 'react';
import {TitleCard} from './TitleCard';
import {BigStat} from './BigStat';
import type {ShotProps} from '../engine/types';

/**
 * Every component a storyboard shot may name. The agent adds new components here (one line each) after building them.
 * Milestone 2 fills this with the full library: text, UI windows, terminal, charts, evidence, 3D characters and sets.
 * Contract: a component receives {shot, ...shot.props}, reads time with useShotTime(shot) and word anchors with atLocal(shot, name).
 */
export const REGISTRY: Record<string, React.FC<ShotProps>> = {
  TitleCard,
  BigStat,
};
