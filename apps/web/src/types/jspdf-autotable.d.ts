declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface AutoTableOptions {
    startY?: number;
    head?: any[][];
    body?: any[][];
    theme?: 'striped' | 'grid' | 'plain';
    headStyles?: {
      fillColor?: number[];
      textColor?: number[];
      fontStyle?: 'normal' | 'bold' | 'italic';
      halign?: 'left' | 'center' | 'right';
    };
    columnStyles?: {
      [key: number]: {
        cellWidth?: number;
        halign?: 'left' | 'center' | 'right';
      };
    };
    styles?: {
      fontSize?: number;
      cellPadding?: number;
      overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
    };
    margin?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
  }

  export default function autoTable(doc: jsPDF, options: AutoTableOptions): void;
}
