const COLOR_BY_TILE_VALUE: { [value: number]: number } = {
  1: 0x0b08a6, // blue
  2: 0x046109, // green
  3: 0xd10000, // red
  4: 0x1d007a, // purple
  5: 0x400002, // brown
  6: 0x006880, // cyan
  7: 0x000000, // black
  8: 0x737373, // gray
};

export function getTileValueColor(value: number): number {
  return COLOR_BY_TILE_VALUE[value] || 0x000000;
}
