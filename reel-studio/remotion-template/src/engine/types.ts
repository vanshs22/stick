export type Word = {w: string; t: number; hi: boolean};
export type Chunk = {t0: number; t1: number; words: Word[]};
export type Shot = {
  id: string;
  start: number; // seconds, film time
  end: number;
  component: string;
  props: Record<string, any>;
  lines: string[];
  anchors: Record<string, number>; // name -> film time of the spoken word
  camera?: {framing?: string; movement?: string; focus?: string};
  transition_out?: {type?: string; sound?: string};
  intent?: string;
  bg?: string; // 'paper' | a name from style.json bgs | a hex colour
  speaker?: string; // shown as a tag above dialogue captions
  presenter?: {pose?: string; mood?: string; hidden?: boolean};
  overlays?: Overlay[];
};
export type Overlay = {type: string; anchor?: string; at?: number; x?: number; y?: number; [k: string]: any};
export type Timeline = {
  fps: number; width: number; height: number; duration: number; style: string; audio: string;
  shots: Shot[];
  captions: {preset: string; chunks: Chunk[]};
  words: {w: string; line: number; s: number; e: number}[];
};
export type ShotProps = {shot: Shot} & Record<string, any>;
