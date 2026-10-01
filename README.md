# Multiply to Target

Start at **1** and multiply by the primes **2, 3, 5, and 7** to build the displayed target exactly. Use the keypad or the matching number keys. Incorrect factors leave the current number unchanged and use a mistake; repeated incorrect factors at the same number count once. Winning advances automatically. Exceeding the mistake allowance ends the run; use **Try Again** or **Space** to restart.

This variant keeps Divide to One's two-stage tutorial, hints, difficulty curve, mistake allowance, level themes, animations, confetti, synthesized sound, mute/volume preferences, haptics, and ByteBrew event flow. Remaining move counts and the perfect-finish effect now count prime multiplications. Target history uses its own `multiplyToTargetHistory` key. Progression retains the original session behavior: refreshing starts the tutorial again.

## Development

```sh
npm ci
npm run dev
```

Open http://localhost:3000.

```sh
npm test
npm run lint
npm run build
```

The regression tests cover prime-only input validation, repeated factors, invalid and oversized targets, tutorial history, and 1,100 solvable generated targets across levels 1–1000.

## Source

Based on [yigitefeoktar/Divide-to-One](https://github.com/yigitefeoktar/Divide-to-One), commit `f92ac8e4018be554648707792dd161ec15d9c9cc`. Its gameplay, generator, audio, UI, progression, and analytics code were compared with the bundle served by https://divide-to-one.vercel.app (production deployment `dpl_HE2icwfq8Dpk4PxAkac9PfzY1s89`) and matched after normalizing compiled variable names. The deployment contains dependency build differences and does not expose Git commit metadata.

ByteBrew retains the existing integration. Variant events include `game_mode: multiply_to_target`, and action events use `factor_entered` in place of `divisor_entered`. A separately tracked analytics application can use its own ByteBrew configuration in `src/main.tsx`.
