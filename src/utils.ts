export function getMinimumMoves(target: number): number {
  if (target === 1) return 0;
  
  const queue: { value: number; moves: number }[] = [{ value: target, moves: 0 }];
  const visited = new Set<number>([target]);
  
  while (queue.length > 0) {
    const { value, moves } = queue.shift()!;
    
    for (let i = 9; i >= 2; i--) {
      if (value % i === 0) {
        const nextValue = value / i;
        if (nextValue === 1) {
          return moves + 1;
        }
        if (!visited.has(nextValue)) {
          visited.add(nextValue);
          queue.push({ value: nextValue, moves: moves + 1 });
        }
      }
    }
  }
  
  return -1; // Should not be reached if target is valid
}

export function getBestMove(target: number): number {
  for (let i = 9; i >= 2; i--) {
    if (target % i === 0) {
      const nextValue = target / i;
      // We check if the next value can reach 1 in (minMoves - 1)
      if (getMinimumMoves(nextValue) === getMinimumMoves(target) - 1) {
        return i;
      }
    }
  }
  return -1;
}

const COMPLEXITY_MAP: Record<number, number> = {
  2: 1,
  3: 2,
  4: 2,
  5: 2,
  6: 3,
  7: 4,
  8: 3,
  9: 3
};

export function generateTarget(
  difficulty: number = 1,
  history: number[] = [],
  isTutorial: boolean = false
): { target: number; minMoves: number } {
  if (isTutorial) {
    const TUTORIAL_POOL = [
      { target: 12, minMoves: 2 },
      { target: 21, minMoves: 2 },
      { target: 15, minMoves: 2 },
      { target: 18, minMoves: 2 },
      { target: 20, minMoves: 2 },
      { target: 24, minMoves: 2 }
    ];
    
    const available = TUTORIAL_POOL.filter(t => !history.includes(t.target));
    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)];
    }
    return TUTORIAL_POOL[Math.floor(Math.random() * TUTORIAL_POOL.length)];
  }

  // Linear progression: target complexity roughly increases with difficulty
  // Adding variety in how the target is constructed allows pure easy combos (like 1024 or 125)
  const minComplexity = difficulty + 2;
  const maxComplexity = minComplexity + 4;
  
  let target = 1;
  let attempts = 0;
  let bestTarget = 1;
  let bestDiff = Infinity;
  
  const fullPool = [2, 3, 4, 5, 6, 7, 8, 9];
  
  do {
      let currentTarget = 1;
      let currentComplexity = 0;
      
      let pool = fullPool;
      const r = Math.random();
      // Increase chance for numbers with specific digit combinations (pure numbers or dual factors)
      if (r < 0.10) {
          pool = [fullPool[Math.floor(Math.random() * fullPool.length)]];
      } else if (r < 0.30) {
          const f1 = fullPool[Math.floor(Math.random() * fullPool.length)];
          let f2 = fullPool[Math.floor(Math.random() * fullPool.length)];
          while (f1 === f2) {
              f2 = fullPool[Math.floor(Math.random() * fullPool.length)];
          }
          pool = [f1, f2];
      }
      
      let overflow = false;
      while (currentComplexity < minComplexity) {
          const num = pool[Math.floor(Math.random() * pool.length)];
          // Prevent Number.MAX_SAFE_INTEGER overflow
          if (currentTarget * num > Number.MAX_SAFE_INTEGER / 10) {
              overflow = true;
              break;
          }
          currentTarget *= num;
          currentComplexity += COMPLEXITY_MAP[num];
      }
      
      if ((currentComplexity >= minComplexity && currentComplexity <= maxComplexity) || overflow) {
          if (currentTarget >= 10 && !history.includes(currentTarget)) {
              target = currentTarget;
              break;
          }
      }
      
      if (currentTarget >= 10 && !history.includes(currentTarget)) {
          const diff = Math.abs(currentComplexity - minComplexity);
          if (diff < bestDiff) {
              bestDiff = diff;
              bestTarget = currentTarget;
          }
      }
      
      attempts++;
  } while (attempts < 500);
  
  if (target === 1) {
      target = bestTarget;
  }
  
  // Absolute fallback
  if (target === 1) {
      target = fullPool[Math.floor(Math.random() * fullPool.length)] * fullPool[Math.floor(Math.random() * fullPool.length)];
  }
  
  return { target, minMoves: getMinimumMoves(target) };
}
