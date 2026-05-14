import { fakeEthAddress, fakeWcUri } from './fake-data';

export interface MockWcSession {
  uri: string;
  pairingTopic: string;
  expectedAddress: string;
}

export function createMockWcSession(): MockWcSession {
  const uri = fakeWcUri();
  const pairingTopic = uri.split('@')[0].slice(3);
  const expectedAddress = fakeEthAddress(`wc:${pairingTopic}`);
  return { uri, pairingTopic, expectedAddress };
}

export function buildQrMatrix(input: string, size = 25): boolean[][] {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFinder = (r: number, c: number) => {
    const inTopLeft = r < 7 && c < 7;
    const inTopRight = r < 7 && c >= size - 7;
    const inBottomLeft = r >= size - 7 && c < 7;
    return inTopLeft || inTopRight || inBottomLeft;
  };

  const finderPattern = (rOff: number, cOff: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const edge = r === 0 || r === 6 || c === 0 || c === 6;
        const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[rOff + r][cOff + c] = edge || inner;
      }
    }
  };

  finderPattern(0, 0);
  finderPattern(0, size - 7);
  finderPattern(size - 7, 0);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isFinder(r, c)) continue;
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      h = (h ^ (h >>> 16)) >>> 0;
      matrix[r][c] = (h & 1) === 1;
    }
  }

  return matrix;
}
