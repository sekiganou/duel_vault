declare global {
  interface Array<T> {
    sortByWinsAndLosses(
      getWins: (item: T) => number,
      getLosses: (item: T) => number
    ): T[];
    shuffle(): T[];
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

Array.prototype.shuffle = function <T>(
  this: T[],
): T[] {
  for (let i = this.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [this[i], this[j]] = [this[j], this[i]]; // Swap
  }
  return this;
};

export { };
