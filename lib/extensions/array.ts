declare global {
  interface Array<T> {
    sortByWinsAndLosses(
      getWins: (item: T) => number,
      getLosses: (item: T) => number
    ): T[];

    sortByWinRate(
      getWins: (item: T) => number,
      getLosses: (item: T) => number
    ): T[];
  }
}

Array.prototype.sortByWinsAndLosses = function <T>(
  this: T[],
  getWins: (item: T) => number,
  getLosses: (item: T) => number
): T[] {
  return this.sort((a, b) => {
    const winsA = getWins(a);
    const winsB = getWins(b);
    const lossesA = getLosses(a);
    const lossesB = getLosses(b);

    if (winsA !== winsB) {
      return winsB - winsA; // Sort by wins descending
    }
    return lossesA - lossesB; // If wins are equal, sort by losses ascending
  });
};

Array.prototype.sortByWinRate = function <T>(
  this: T[],
  getWins: (item: T) => number,
  getLosses: (item: T) => number
): T[] {
  return this.sort((a, b) => {
    const winsA = getWins(a);
    const winsB = getWins(b);
    const lossesA = getLosses(a);
    const lossesB = getLosses(b);

    const winRateA = winsA / (winsA + lossesA || 1);
    const winRateB = winsB / (winsB + lossesB || 1);

    return winRateB - winRateA || winsB - winsA;
  });
};

export {};
