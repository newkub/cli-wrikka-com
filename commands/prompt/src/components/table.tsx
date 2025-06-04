import React from 'react';
import { Box, Text } from 'ink';

type BorderPosition = 'top' | 'middle' | 'bottom';

type TableProps = {
  /**
   * Table data as a 2D array of strings or React nodes
   * First row is considered the header
   */
  data: (string | React.ReactNode)[][];
  /**
   * Whether to display a border around the table
   * @default true
   */
  border?: boolean;
  /**
   * Whether the first row is a header
   * @default true
   */
  header?: boolean;
  /**
   * Padding for cells
   * @default 1
   */
  padding?: number;
  /**
   * Cell padding left and right
   * @default 1
   */
  cellPaddingX?: number;
  /**
   * Cell padding top and bottom
   * @default 0
   */
  cellPaddingY?: number;
  /**
   * Column width percentages (0-1)
   */
  columnWidths?: number[];
  /**
   * Maximum width of the table (in characters)
   */
  maxWidth?: number;
  /**
   * Header text color
   */
  headerTextColor?: string;
  /**
   * Custom cell renderer
   */
  cellRenderer?: (
    cell: string | React.ReactNode,
    rowIndex: number,
    columnIndex: number,
    isHeader: boolean
  ) => React.ReactNode;
};

// Simple border characters for the table
// Border characters for the table
const BORDER = {
  horizontal: '─',
  vertical: '│',
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  cross: '┼',
  topT: '┬',
  bottomT: '┴',
  leftT: '├',
  rightT: '┤'
};

/**
 * Truncates text to fit within a given width, adding an ellipsis if needed
 */
const _truncateText = (text: string, maxWidth: number): string => {
  if (text.length <= maxWidth) return text;
  if (maxWidth <= 3) return '...';
  return `${text.slice(0, maxWidth - 3)}...`;
};

/**
 * Gets the visible width of a string (accounts for ANSI escape codes)
 */
const _getStringWidth = (str: string): number => {
  // Simple string length for now, without ANSI escape code handling
  return str.length;
};

export const Table: React.FC<TableProps> = ({
  data,
  border = true,
  header = true,
  padding = 1,
  cellPaddingX = 1,
  cellPaddingY = 0,
  columnWidths,
  maxWidth,
  headerTextColor,
  cellRenderer,
}) => {
  if (!data || data.length === 0) {
    return null;
  }

  // Calculate column widths if not provided
  const calcColumnWidths = (): number[] => {
    if (columnWidths) return columnWidths;
    const colCount = data[0]?.length || 1;
    const width = 1 / colCount;
    return Array.from({ length: colCount }, () => width);
  };

  const columnWidthsFinal = calcColumnWidths();
  // Default to 80 columns if process.stdout.columns is not available
  const terminalWidth = 80; // Default terminal width
  const tableWidth = maxWidth ? Math.min(maxWidth, terminalWidth) : terminalWidth;

  // Render the border line
  const renderBorder = (position: BorderPosition) => {
    if (!border) return null;
    
    let left: string;
    let right: string;
    let middle: string;
    
    switch (position) {
      case 'top':
        left = BORDER.topLeft;
        right = BORDER.topRight;
        middle = BORDER.topT;
        break;
      case 'bottom':
        left = BORDER.bottomLeft;
        right = BORDER.bottomRight;
        middle = BORDER.bottomT;
        break;
      default: // middle
        left = BORDER.leftT;
        right = BORDER.rightT;
        middle = BORDER.cross;
    }
    
    return (
      <Box>
        <Text>
          {left}
          {columnWidthsFinal.map((width, i) => (
            <React.Fragment key={`border-${i}`}>
              {BORDER.horizontal.repeat(Math.max(0, Math.floor(width * tableWidth) - 2))}
              {i < columnWidthsFinal.length - 1 ? middle : ''}
            </React.Fragment>
          ))}
          {right}
        </Text>
      </Box>
    );
  };

  // Render a single cell
  const renderCell = (
    cell: string | React.ReactNode,
    rowIndex: number,
    colIndex: number,
    isHeader: boolean
  ) => {
    const cellWidth = Math.max(1, Math.floor(columnWidthsFinal[colIndex] * tableWidth) - (padding * 2));
    const cellContent = cellRenderer 
      ? cellRenderer(cell, rowIndex, colIndex, isHeader) 
      : cell;

    return (
      <Box 
        key={`${rowIndex}-${colIndex}`}
        paddingLeft={cellPaddingX}
        paddingRight={cellPaddingX}
        paddingTop={cellPaddingY}
        paddingBottom={cellPaddingY}
        width={cellWidth}
        minWidth={cellWidth}
      >
        {typeof cellContent === 'string' ? (
          <Text 
            wrap="truncate"
            color={isHeader ? headerTextColor : undefined}
          >
            {cellContent}
          </Text>
        ) : (
          cellContent
        )}
      </Box>
    );
  };

  // Render the table header if needed
  const renderHeader = () => {
    if (!header || !data.length) return null;
    
    return (
      <Box flexDirection="row">
        {data[0].map((cell, colIndex) => 
          renderCell(cell, 0, colIndex, true)
        )}
      </Box>
    );
  };

  // Render table rows
  const renderRows = () => {
    const startRow = header ? 1 : 0;
    return data.slice(startRow).map((row, rowIndex) => (
      <Box key={`row-${rowIndex}`} flexDirection="row">
        {row.map((cell, colIndex) => 
          renderCell(cell, rowIndex + startRow, colIndex, false)
        )}
      </Box>
    ));
  };

  return (
    <Box flexDirection="column">
      {border && renderBorder('top')}
      
      {renderHeader()}
      
      {border && header && data.length > 0 && renderBorder('middle')}
      
      {renderRows()}
      
      {border && renderBorder('bottom')}
    </Box>
  );
};

export default Table;
