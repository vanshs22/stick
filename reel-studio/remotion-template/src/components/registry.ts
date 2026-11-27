import React from 'react';
import {TitleCard} from './TitleCard';
import {BigStat} from './BigStat';
import {Highlight, KineticList, Stamp, Typewriter} from './text';
import {BrowserWindow, ChatBubbles, CommentBox, NotebookPage, PhoneFrame, Terminal} from './uikit';
import {BarChart, Checklist, LineChart, RouteMap, Timeline, Versus} from './data';
import {EvidenceCard, ProofCard} from './evidence';
import {Scene3D} from './Scene3D';
import {Stage3D} from './Stage3D';
import {HtmlBlock} from './HtmlBlock';
import {RemocnBlock} from './RemocnBlock';
import {FlowDiagram} from './FlowDiagram';
import {PlateShot} from './PlateShot';
import {Footage} from './Footage';
import {InkShot} from './InkShot';
import {Devices, RadialMenu} from './reelkit';
import {EndCard, FileList, Ledger, ProfileCard, RepoCard} from './more';
import type {ShotProps} from '../engine/types';

/**
 * Every component a storyboard shot may name. Props and anchors of each are documented in manifest.json (read it before writing a storyboard).
 * To add a component: build it, add one line here AND one entry in manifest.json (tools/check_storyboard.mjs checks both).
 * Contract: a component receives {shot, ...shot.props}, reads time with useShotTime(shot) / useEnter(shot, anchor), word anchors with atLocal(shot, name).
 */
export const REGISTRY: Record<string, React.FC<ShotProps>> = {
  TitleCard, BigStat, Typewriter, Stamp, Highlight, KineticList,
  BrowserWindow, Terminal, PhoneFrame, ChatBubbles, NotebookPage, CommentBox,
  BarChart, LineChart, Timeline, Checklist, Versus, RouteMap,
  ProofCard, EvidenceCard, Scene3D, Stage3D, HtmlBlock, RemocnBlock, FlowDiagram, PlateShot, Footage, InkShot, RadialMenu, Devices, FileList, Ledger, ProfileCard, RepoCard, EndCard,
};
