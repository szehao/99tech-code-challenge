// Problem 1: Three ways to sum to n

// The sum 1 + ... + n is only defined here for n >= 0; a negative n is rejected, not silently treated as 0.
const assertNonNegative = (n: number): void => {
    if (n < 0) throw new RangeError(`n must be 0 or greater, got ${n}`);
}

// Brute Force
export const sum_to_n_a = (n: number): number => {

    assertNonNegative(n);

    let sum = 0;

    for (let i = 1; i <= n; i++) {
        sum += i;
    }

    return sum;
}

// Recursion
export const sum_to_n_b = (n: number): number => {

    assertNonNegative(n);

    // Validated once above, so the recursive steps skip the check.
    const sumDown = (k: number): number => {

        if (k <= 0) return 0;

        return k + sumDown(k - 1);
    }

    return sumDown(n);
}

// Gauss Formula
export const sum_to_n_c = (n: number): number => {

    assertNonNegative(n);

    return n * (n + 1) / 2;
}
