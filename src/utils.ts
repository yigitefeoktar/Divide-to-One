export const PRIME_FACTORS = [2, 3, 5, 7] as const;

export function getMinimumMoves(target: number, current: number = 1): number {
  if (!Number.isSafeInteger(target) || !Number.isSafeInteger(current) ||
      current < 1 || target < current || target % current !== 0) return -1;

  let remaining = target / current;
  let moves = 0;
  for (const prime of PRIME_FACTORS) {
    while (remaining % prime === 0) {
      remaining /= prime;
      moves++;
    }
  }
  return remaining === 1 ? moves : -1;
}

export function canMultiply(target: number, current: number, factor: number): boolean {
  return PRIME_FACTORS.some(prime => prime === factor) &&
    getMinimumMoves(target, current) > 0 &&
    current <= target / factor && target % (current * factor) === 0;
}

export function getBestMove(target: number, current: number = 1): number {
  for (const prime of [...PRIME_FACTORS].reverse()) {
    if (canMultiply(target, current, prime)) return prime;
  }
  return -1;
}

const COMPLEXITY_MAP: Record<number, number> = {
  2: 1,
  3: 2,
  5: 2,
  7: 4,
};

export function generateTarget(
  difficulty: number = 1,
  history: number[] = [],
  isTutorial: boolean = false
): { target: number; minMoves: number } {
  if (isTutorial) {
    const TUTORIAL_POOL = [
      12, 21, 15, 18, 20, 24
    ].map(target => ({ target, minMoves: getMinimumMoves(target) }));
    
    const available = TUTORIAL_POOL.filter(t => !history.includes(t.target));
    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)];
    }
    return TUTORIAL_POOL[Math.floor(Math.random() * TUTORIAL_POOL.length)];
  }

  // Linear progression: target complexity roughly increases with difficulty
  // Prime products keep every level reachable, with variety such as 1024 or 125.
  const minComplexity = difficulty + 2;
  const maxComplexity = minComplexity + 4;
  
  let target = 1;
  let attempts = 0;
  let bestTarget = 1;
  let bestDiff = Infinity;
  
  const fullPool = [...PRIME_FACTORS];
  
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
