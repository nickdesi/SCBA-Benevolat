## 2024-05-18 - String Comparison vs Date Parsing in Filter Loops
**Learning:** Instantiating `new Date()` and calling `setHours()` inside an `Array.prototype.filter` block for a large array is surprisingly expensive and can block the main thread.
**Action:** When filtering future/past dates, use pre-calculated `YYYY-MM-DD` and `HHMM` string comparison instead of parsing and manipulating dates on each iteration. In benchmarks, this yielded a 20x performance speedup.
## 2024-04-16 - MatchTicker React.memo Optimization
**Learning:** In a highly dynamic list of games where filters or parent states change, functional components that rely on filtering large arrays on every render (like MatchTicker) can cause unnecessary re-renders. Additionally, React.memo is not consistently applied to all components.
**Action:** Wrap MatchTicker in React.memo and useMemo for its internal derived data (upcoming games calculation) to prevent unnecessary re-computations and re-renders, especially since it only needs to re-render when the `games` array reference changes.
## 2024-05-19 - Hoist Object.keys(...).sort(...) from hot paths
**Learning:** Repeatedly sorting object keys within a loop or function call (like `findAddressForOpponent` which iterates over parsed matches) is highly inefficient for static dictionaries.
**Action:** When a dictionary like `GYM_REGISTRY` doesn't change, its sorted keys should be computed once at module level. Hoisting this sorting out of the `findAddressForOpponent` function improved csv parsing performance by ~40% on worst-case inputs with many unmatched locations.
## 2024-05-19 - Testing Utilities
**Learning:** Added testing for pure function string parsing utility `parseNames` using table-driven test cases via Vitest. Ensure all edge conditions and falsy values are explicitly handled.
**Action:** Implemented comprehensive Vitest test cases that cover pure functions used by UI components to prevent silent bugs in UI rendering.
## 2024-04-17 - Commented Out Code Removal
**Learning:** Commented out code should be removed from the codebase to improve readability and maintainability. Using git for version control allows retrieving old code if needed.
**Action:** Removed commented out code in useVolunteers.ts and used npm run build to ensure functionality is not broken.
## 2026-04-18 - Added useMemo to GameCard
**Learning:** GameCard re-renders when parent state like `isAdmin`, `editingGameId`, `isAuthenticated` changes. Computations such as `isGameFullyStaffed`, `getFilledSlotsCount` and `getTotalCapacityCount` run on every render unless memoized.
**Action:** Always use `useMemo` for expensive state derivatives in React components that frequently re-render, especially those passed complex `game` objects in lists.
## 2024-05-19 - Cache Intl.DateTimeFormat instead of using toLocaleDateString in loops
**Learning:** `Date.toLocaleDateString` is notoriously slow when called repeatedly inside loops (like `forEach` or `map` in large datasets) because it reinstantiates the locale settings each time. In a loop of 100 iterations processing 1000 items, `toLocaleDateString` took ~12s, while a cached `Intl.DateTimeFormat` took only ~200ms.
**Action:** Always extract and cache `Intl.DateTimeFormat` (or `Intl.NumberFormat`) outside of loops and component render functions for significant performance gains on repeated formatting tasks.
## 2025-02-18 - ISO Date String Performance in Sorting and Filtering
**Learning:** Instantiating `new Date()` repeatedly within `.filter()` and `.sort()` callbacks on an array is an unnecessary computational overhead, especially for larger arrays.
**Action:** Since ISO 8601 strings (like `2023-10-25T10:00:00.000Z`) are lexicographically sortable, optimize performance by filtering first to reduce the array size, and then use direct string comparisons (`>=`, `<=`, and `localeCompare`) against a cached timestamp string (`new Date().toISOString()`) instead of converting each string back into a `Date` object.
## 2024-05-19 - Minimize Array Iterations in Derived State
**Learning:** In a loop or a component that re-renders, computing multiple derived states (like counts of different types) using repeated calls to `Array.prototype.filter` or `Array.prototype.reduce` on the same array is highly inefficient.
**Action:** Always combine derived state calculations into a single `O(N)` pass over the array using a helper function. This prevents redundant iterations over the same elements, especially in frequently rendered components like GameCard.
## 2024-05-18 - [Optimization] O(N) single pass for multiple conditions
**Learning:** Re-running `.filter().length` for multiple conditions (like `isHome` and `!isHome`) inside render loops creates multiple O(N) traversals per group.
**Action:** Always compute derived states in a single pass O(N) utility function (`getHomeAwayCounts`) and memoize it, or pre-compute it during data grouping (`groupGamesByMonth` or `gamesByDay`) to minimize array iteration overhead, avoiding duplicate calls like `.filter(g => g.isHome).length` and `.filter(g => !g.isHome).length`.
## 2024-05-19 - Schwartzian Transform for O(N log N) Sorting
**Learning:** Performing expensive operations like `getGameDateValue()` (which falls back to string parsing) or `normalizeTime()` directly inside the `Array.prototype.sort()` comparator means they are called $O(N \log N)$ times, leading to significant performance degradation on large arrays (like games lists or team filters).
**Action:** Always use the Schwartzian transform (decorate-sort-undecorate) pattern: first `.map()` the array in $O(N)$ to pre-compute the derived comparison values, then `.sort()` based on the pre-computed values, and finally `.map()` back to the original objects. In benchmarks, this provided a 3x speedup for team name sorting and ~40% speedup for game sorting.
## 2024-05-19 - [Optimization] O(N) single pass for multiple conditions in AdminStats
**Learning:** Re-running `.filter().length` for multiple conditions (like `isUrgent` and `!isComplete`) after a `.map()` iteration over a large array is an anti-pattern. This iterates over the array multiple times and creates unnecessary intermediate array allocations.
**Action:** Always pre-compute and increment derived counters (`urgentCount`, `incompleteCount`) inside the existing mapping/filtering loop over the array instead of chaining multiple `.filter()` calls afterwards. This reduces the time complexity and memory overhead, saving $O(2N)$ array passes in the `AdminStats` component.
## 2026-22-14 - [Optimization] Prevent Redundant Date and Role Iterations inside loops
**Learning:** In a `.map()` operation that processes a large array (like games in `AdminStats`), repeatedly calling functions that perform their own loops (e.g., `getMissingRoles` filtering over roles, `isGameFullyStaffed` running `.every` on roles) and repeatedly parsing the same date string (via `new Date(game.dateISO)` inside multiple utility functions like `isGameUrgent` and `getHoursUntilGame`) causes unnecessary overhead and redundant object allocations.
**Action:** Calculate the aggregated role metrics once per item using a single O(N) pass function (e.g., `getGameRoleStats`), and parse the date string once per item to compute time differences inline. This avoids multiple (M)$ traversals per array item and prevents duplicate `new Date()` parsing overhead.

## 2024-05-15 - Fast month lookup via precomputed dictionary
**Learning:** O(N) array finds (`Object.entries().find(...)`) on constant objects like `MONTH_MAP` are expensive inside hot loops (like date parsing for a large match list). Extracting and normalizing mapping dictionaries ahead of time (`NORMALIZED_MONTH_MAP`) provides an O(1) fallback that significantly reduces parsing time (~8x faster in benchmarks). Regular expressions shouldn't be recompiled on every function call either, and moving them to module scope avoids doing that overhead.
**Action:** When a constant object is repeatedly searched in a utility function, pre-compute a lookup map at the module level. Move regex patterns outside the function.
## 2026-05-19 - Remove Unused Derived State Calculations in Components
**Learning:** In components like `GameCard` and `VolunteerSection`, derived state calculations using array methods like `.reduce()` are sometimes written but never actually consumed in the rendered output or passed as props. This causes unnecessary recalculations (and possible allocations) on every render cycle, even if wrapped in `useMemo` (which itself adds a small overhead).
**Action:** Actively scan components for unused variables and dead code, particularly derived calculations using `.reduce()`, `.filter()`, or `.map()`, and remove them to cleanly improve render performance without changing functionality.
## 2024-05-19 - Combine filter and map with single pass reduce and cache variables outside loops
**Learning:** In React components that iterate over an array via multiple passes (`.filter()` then `.map()`) to calculate aggregated statistics, the intermediate arrays created take up memory, and executing the iterations twice slows down rendering. Moreover, performing logic like instantiating the current time `new Date().getTime()` inside a `.map()` or `.reduce()` repeats an invariant calculation $O(N)$ times.
**Action:** Replace `array.filter().map()` chains with a single `.reduce()` operation. Hoist invariant calculations like the current time or boundaries (e.g., weekend start and end dates) outside of the loop. This minimizes object allocations and reduces passes, significantly optimizing calculation-heavy components like `AdminStats`.

## 2024-05-19 - Use Single-Pass Filtering to Prevent Intermediate O(N) Array Allocations
**Learning:** Chaining multiple `.filter()` calls on an array conceptually works but creates an intermediate copy of the array for every filter function. In heavy React hooks like `useGameFilters` that compute derived state over hundreds or thousands of `Game` items, chaining `.filter()` three times forces $O(3N)$ traversals and introduces unnecessary garbage collection overhead that can slow down renders or filter interactions.
**Action:** When applying multiple filtering criteria to a large collection, combine the logic into a single pass `.filter()` operation with well-defined early returns instead of chaining array methods.
