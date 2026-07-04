export type LayerType = 'text' | 'emoji' | 'shape' | 'image' | 'drawing';

export interface BaseLayer {
  id: string;
  name: string;
  type: LayerType;
  x: number; // 0 to 512 offset, default 256
  y: number; // 0 to 512 offset, default 256
  scale: number; // default 1 (multiplier)
  scaleX?: number; // non-uniform scale width multiplier
  scaleY?: number; // non-uniform scale height multiplier
  rotation: number; // degrees, default 0
  opacity: number; // 0 to 1, default 1
  visible: boolean;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  fontSize: number; // base size (e.g. 40)
  color: string;
  fontFamily: string;
  strokeColor: string;
  strokeWidth: number; // outline width
  bold: boolean;
  italic: boolean;
  textAlign: 'left' | 'center' | 'right';
  hasShadow: boolean;
  shadowColor: string;
}

export interface EmojiLayer extends BaseLayer {
  type: 'emoji';
  emoji: string;
  size: number;
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  src: string; // Data URL or URL
  isPreset?: boolean;
}

export interface ShapeLayer extends BaseLayer {
  type: 'shape';
  shapeType: 'circle' | 'square' | 'triangle' | 'heart' | 'star' | 'badge' | 'cloud' | 'banner';
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}

export interface DrawingStroke {
  points: { x: number; y: number }[];
  color: string;
  size: number;
  tool: 'pencil' | 'brush' | 'eraser';
}

export interface DrawingLayer extends BaseLayer {
  type: 'drawing';
  strokes: DrawingStroke[];
}

export type StickerLayer = TextLayer | EmojiLayer | ImageLayer | ShapeLayer | DrawingLayer;

export interface Sticker {
  id: string;
  name: string;
  layers: StickerLayer[];
  globalBorder: boolean; // WhatsApp sticker style thick white border
  globalBorderColor: string;
  globalBorderWidth: number;
  globalShadow: boolean; // Soft shadow in WhatsApp Chat
}

export interface StickerPack {
  id: string;
  name: string;
  author: string;
  stickers: Sticker[];
}

export interface StickerTemplate {
  id: string;
  name: string;
  category: string; // 'Amore' | 'Divertenti' | 'Saluti' | 'Feste' | 'Reazioni' | 'Meme'
  tags: string[];
  layers: StickerLayer[];
  globalBorder: boolean;
}
