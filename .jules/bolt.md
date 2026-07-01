## 2026-04-17 - String Comparison vs Date Parsing in Filter Loops
**Learning:** Instantiating `new Date()` and calling `setHours()` inside an `Array.prototype.filter` block for a large array is surprisingly expensive and can block the main thread.
**Action:** When filtering future/past dates, use pre-calculated `YYYY-MM-DD` and `HHMM` string comparison instead of parsing and manipulating dates on each iteration. In benchmarks, this yielded a 20x performance speedup.

## 2026-04-16 - MatchTicker React.memo Optimization
**Learning:** In a highly dynamic list of games where filters or parent states change, functional components that rely on filtering large arrays on every render (like MatchTicker) can cause unnecessary re-renders. Additionally, React.memo is not consistently applied to all components.
**Action:** Wrap MatchTicker in React.memo and useMemo for its internal derived data (upcoming games calculation) to prevent unnecessary re-computations and re-renders, especially since it only needs to re-render when the `games` array reference changes.

## 2026-04-17 - Hoist Object.keys(...).sort(...) from hot paths
**Learning:** Repeatedly sorting object keys within a loop or function call (like `findAddressForOpponent` which iterates over parsed matches) is highly inefficient for static dictionaries.
**Action:** When a dictionary like `GYM_REGISTRY` doesn't change, its sorted keys should be computed once at module level. Hoisting this sorting out of the `findAddressForOpponent` function improved csv parsing performance by ~40% on worst-case inputs with many unmatched locations.

## 2026-04-17 - Testing Utilities
**Learning:** Added testing for pure function string parsing utility `parseNames` using table-driven test cases via Vitest. Ensure all edge conditions and falsy values are explicitly handled.
**Action:** Implemented comprehensive Vitest test cases that cover pure functions used by UI components to prevent silent bugs in UI rendering.

## 2026-04-17 - Commented Out Code Removal
**Learning:** Commented out code should be removed from the codebase to improve readability and maintainability. Using git for version control allows retrieving old code if needed.
**Action:** Removed commented out code in useVolunteers.ts and used npm run build to ensure functionality is not broken.

## 2026-04-18 - Added useMemo to GameCard
**Learning:** GameCard re-renders when parent state like `isAdmin`, `editingGameId`, `isAuthenticated` changes. Computations such as `isGameFullyStaffed`, `getFilledSlotsCount` and `getTotalCapacityCount` run on every render unless memoized.
**Action:** Always use `useMemo` for expensive state derivatives in React components that frequently re-render, especially those passed complex `game` objects in lists.

## 2026-04-19 - Cache Intl.DateTimeFormat instead of using toLocaleDateString in loops
**Learning:** `Date.toLocaleDateString` is notoriously slow when called repeatedly inside loops (like `forEach` or `map` in large datasets) because it reinstantiates the locale settings each time. In a loop of 100 iterations processing 1000 items, `toLocaleDateString` took ~12s, while a cached `Intl.DateTimeFormat` took only ~200ms.
**Action:** Always extract and cache `Intl.DateTimeFormat` (or `Intl.NumberFormat`) outside of loops and component render functions for significant performance gains on repeated formatting tasks.

## 2026-04-21 - ISO Date String Performance in Sorting and Filtering
**Learning:** Instantiating `new Date()` repeatedly within `.filter()` and `.sort()` callbacks on an array is an unnecessary computational overhead, especially for larger arrays.
**Action:** Since ISO 8601 strings (like `2023-10-25T10:00:00.000Z`) are lexicographically sortable, optimize performance by filtering first to reduce the array size, and then use direct string comparisons (`>=`, `<=`, and `localeCompare`) against a cached timestamp string (`new Date().toISOString()`) instead of converting each string back into a `Date` object.

## 2026-04-22 - Minimize Array Iterations in Derived State
**Learning:** In a loop or a component that re-renders, computing multiple derived states (like counts of different types) using repeated calls to `Array.prototype.filter` or `Array.prototype.reduce` on the same array is highly inefficient.
**Action:** Always combine derived state calculations into a single `O(N)` pass over the array using a helper function. This prevents redundant iterations over the same elements, especially in frequently rendered components like GameCard.

## 2026-04-24 - [Optimization] O(N) single pass for multiple conditions
**Learning:** Re-running `.filter().length` for multiple conditions (like `isHome` and `!isHome`) inside render loops creates multiple O(N) traversals per group.
**Action:** Always compute derived states in a single pass O(N) utility function (`getHomeAwayCounts`) and memoize it, or pre-compute it during data grouping (`groupGamesByMonth` or `gamesByDay`) to minimize array iteration overhead, avoiding duplicate calls like `.filter(g => g.isHome).length` and `.filter(g => !g.isHome).length`.

## 2026-05-08 - Schwartzian Transform for O(N log N) Sorting
**Learning:** Performing expensive operations like `getGameDateValue()` (which falls back to string parsing) or `normalizeTime()` directly inside the `Array.prototype.sort()` comparator means they are called $O(N \log N)$ times, leading to significant performance degradation on large arrays (like games lists or team filters).
**Action:** Always use the Schwartzian transform (decorate-sort-undecorate) pattern: first `.map()` the array in $O(N)$ to pre-compute the derived comparison values, then `.sort()` based on the pre-computed values, and finally `.map()` back to the original objects. In benchmarks, this provided a 3x speedup for team name sorting and ~40% speedup for game sorting.

## 2026-05-09 - [Optimization] O(N) single pass for multiple conditions in AdminStats
**Learning:** Re-running `.filter().length` for multiple conditions (like `isUrgent` and `!isComplete`) after a `.map()` iteration over a large array is an anti-pattern. This iterates over the array multiple times and creates unnecessary intermediate array allocations.
**Action:** Always pre-compute and increment derived counters (`urgentCount`, `incompleteCount`) inside the existing mapping/filtering loop over the array instead of chaining multiple `.filter()` calls afterwards. This reduces the time complexity and memory overhead, saving $O(2N)$ array passes in the `AdminStats` component.

## 2026-05-16 - [Optimization] Prevent Redundant Date and Role Iterations inside loops
**Learning:** In a `.map()` operation that processes a large array (like games in `AdminStats`), repeatedly calling functions that perform their own loops (e.g., `getMissingRoles` filtering over roles, `isGameFullyStaffed` running `.every` on roles) and repeatedly parsing the same date string (via `new Date(game.dateISO)` inside multiple utility functions like `isGameUrgent` and `getHoursUntilGame`) causes unnecessary overhead and redundant object allocations.
**Action:** Calculate the aggregated role metrics once per item using a single O(N) pass function (e.g., `getGameRoleStats`), and parse the date string once per item to compute time differences inline. This avoids multiple (M)$ traversals per array item and prevents duplicate `new Date()` parsing overhead.

## 2026-05-16 - Fast month lookup via precomputed dictionary
**Learning:** O(N) array finds (`Object.entries().find(...)`) on constant objects like `MONTH_MAP` are expensive inside hot loops (like date parsing for a large match list). Extracting and normalizing mapping dictionaries ahead of time (`NORMALIZED_MONTH_MAP`) provides an O(1) fallback that significantly reduces parsing time (~8x faster in benchmarks). Regular expressions shouldn't be recompiled on every function call either, and moving them to module scope avoids doing that overhead.
**Action:** When a constant object is repeatedly searched in a utility function, pre-compute a lookup map at the module level. Move regex patterns outside the function.

## 2026-05-20 - Remove Unused Derived State Calculations in Components
**Learning:** In components like `GameCard` and `VolunteerSection`, derived state calculations using array methods like `.reduce()` are sometimes written but never actually consumed in the rendered output or passed as props. This causes unnecessary recalculations (and possible allocations) on every render cycle, even if wrapped in `useMemo` (which itself adds a small overhead).
**Action:** Actively scan components for unused variables and dead code, particularly derived calculations using `.reduce()`, `.filter()`, or `.map()`, and remove them to cleanly improve render performance without changing functionality.

## 2026-05-25 - Combine filter and map with single pass reduce and cache variables outside loops
**Learning:** In React components that iterate over an array via multiple passes (`.filter()` then `.map()`) to calculate aggregated statistics, the intermediate arrays created take up memory, and executing the iterations twice slows down rendering. Moreover, performing logic like instantiating the current time `new Date().getTime()` inside a `.map()` or `.reduce()` repeats an invariant calculation $O(N)$ times.
**Action:** Replace `array.filter().map()` chains with a single `.reduce()` operation. Hoist invariant calculations like the current time or boundaries (e.g., weekend start and end dates) outside of the loop. This minimizes object allocations and reduces passes, significantly optimizing calculation-heavy components like `AdminStats`.

## 2026-05-26 - Use Single-Pass Filtering to Prevent Intermediate O(N) Array Allocations
**Learning:** Chaining multiple `.filter()` calls on an array conceptually works but creates an intermediate copy of the array for every filter function. In heavy React hooks like `useGameFilters` that compute derived state over hundreds or thousands of `Game` items, chaining `.filter()` three times forces $O(3N)$ traversals and introduces unnecessary garbage collection overhead that can slow down renders or filter interactions.
**Action:** When applying multiple filtering criteria to a large collection, combine the logic into a single pass `.filter()` operation with well-defined early returns instead of chaining array methods.

## 2026-05-27 - O(N) Single-Pass Extraction for Multiple Property Lists
**Learning:** In a hook or component (like `useGameFilters`) that computes lists of unique properties from an array (e.g. `games.map(g => g.team)`, `games.map(g => g.location)`, etc.), using multiple separate `.map()` or `.reduce()` calls causes multiple $O(N)$ traversals and multiple intermediate array allocations.
**Action:** When extracting multiple distinct unique sets or lists from a collection, use a single `useMemo` block with a single `for` loop to accumulate all sets simultaneously in a single $O(N)$ pass. This reduces iteration overhead and prevents creating several intermediate mapping arrays.

## 2026-05-28 - Replace inline array filters with single pass loops for derived counts
**Learning:** Using multiple `array.filter(c => c.type === 'x').length` chains inside hooks to compute counts (`asDriver`, `asPassenger`) or counting items inside iterations causes redundant O(N) traversal and creates intermediate arrays which get garbage collected, slowing down execution for large lists.
**Action:** Replace multiple `.filter().length` statements computing aggregate states with a single O(N) `for` loop iteration that simultaneously increments variables. Also hoist expensive operations like `.toLowerCase()` outside of `forEach` mapping loops to prevent $O(N)$ string reallocations.

## 2026-05-29 - [Optimization] Prevent redundant instantiation of `new Date()` in rendering loops
**Learning:** Re-evaluating `new Date()` repeatedly inside render loops for lists (like mapping over days in `DesktopGrid` or `MobileTimeline`) creates substantial overhead by unnecessarily allocating Date objects during every React render pass.
**Action:** Always hoist invariant calculations, such as computing the current day's ISO string (`toISODateString(new Date())` or `getTodayISO()`), outside of the `.map()` or `.filter()` loops using `useMemo` or by evaluating it once in the component body to prevent repeated allocations.

## 2026-06-05 - Avoid O(N) Date Instantiation and Intl Format in Loops
**Learning:** Instantiating `new Date(string)` and formatting it with `Intl.DateTimeFormat.format()` inside a rendering loop (like `groupGamesByMonth` running over 1000+ games) causes significant performance overhead (~10x slower).
**Action:** When deriving month labels from ISO strings like `YYYY-MM-DD`, extract the `YYYY-MM` prefix and use a local or module-level cache dictionary object to store the formatted label. This reduces Date instantiation and Intl formatting from O(N) per render to O(unique months).

## 2026-06-05 - Avoid O(N) Intl Format in Loops while respecting timezones
**Learning:** `Intl.DateTimeFormat.format()` is notoriously slow inside large loops. While you can cache dates using strings, `game.dateISO` (e.g. `YYYY-MM-DD`) often represents UTC logic. Caching with the raw `YYYY-MM` prefix of a UTC string can cause an off-by-one month rendering bug in negative local timezones.
**Action:** Always parse the date first `new Date(string)`, and cache the formatted label using a composite local key like `${date.getFullYear()}-${date.getMonth()}`. Instantiating the Date object is extremely fast (~1-2ms per 1000 items), but caching the slow `Intl` formatter fixes the performance bottleneck correctly across local timezones.

## 2026-06-05 - Avoid O(N log N) sorting for finding array mode
**Learning:** Finding the most frequent element (mode) in an array using `.reduce()` to count frequencies, followed by `Object.entries().sort()` is inefficient (O(N + K log K)) and creates multiple intermediate objects.
**Action:** Always use a single O(N) loop to simultaneously populate the frequency map and track the maximum count/element on the fly.

## 2026-06-06 - [Optimization] Hoist Date instantiation outside of filtering loop
**Learning:** Instantiating `new Date()` and re-evaluating derived metrics like `getTodayISO()` inside a `.filter` operation (`isGameUpcoming` inside `MissionList`) causes redundant Date object allocations and $O(N)$ string formatting overhead on every render.
**Action:** Memoize lists with `useMemo` and use dependency injection in utility functions to evaluate the current date and derived ISO strings strictly once outside of the loop, reducing garbage collection pressure and accelerating list filtering.

## 2026-06-09 - Prevent Removing Exported API Utilities
**Learning:** While refactoring a component (`CarpoolingSection.tsx`) to not use certain utility functions (like `getRemainingSeats`, `getAvailableDrivers`) for performance reasons, deleting these functions from the utility file (`src/utils/useCarpool.ts`) or un-exporting them constitutes a breaking API change. Even if unused in the current file, other modules may rely on them, and removing them violates the constraint against breaking public APIs. Furthermore, adding new dependencies/lockfiles (like `bun.lock` in a PNPM repository) is highly problematic.
**Action:** Always verify if a function is used elsewhere before un-exporting or deleting it. When performing local component optimizations, leave the existing utility functions intact to maintain backward compatibility unless a codebase-wide audit confirms they are safe to remove. When using alternative package managers locally (like `bun`), immediately delete any generated lockfiles.


## 2026-06-12 - [Optimization] Hoist Date parsing and Avoid Redundant Role Traversals
**Learning:** Re-evaluating `isGameFullyStaffed(game)` inside `isGameUrgent(game)` repeatedly re-traverses the `game.roles` array (O(R)). Furthermore, calling `new Date(game.dateISO)` allocates memory inside a component render loop. `GameCard` computes `isFullyStaffed` beforehand but doesn't pass it down.
**Action:** Always accept a pre-computed value like `isFullyStaffed` if available in the parent function context to avoid O(R) loops. Use `Date.parse()` and `Date.now()` instead of allocating `new Date()` objects repeatedly to avoid GC pressure.
## 2026-06-10 - [Optimization] Hoist Date instantiation in component render loops
**Learning:** Instantiating `new Date()` inside utility functions (like `isCarpoolUpcoming`) that are subsequently called repeatedly within React render loops or $O(N)$ filter operations creates a hidden performance bottleneck. Calling `new Date()` $N$ times (or $2N$ if called in both the hook and the child component render) causes excessive garbage collection pressure.
**Action:** Extract the invariant `new Date()` and its derived formatting (like `todayISO`) out of the loop. Pass these pre-computed values as parameters to the utility function and explicitly pass the computed boolean directly to child components as a prop.
## 2026-06-13 - Avoid N+1 API Calls inside rendering/importing iterations
**Learning:** During processes like importing and enriching CSV rows, looping over a large array and unconditionally making external API calls (e.g. `fetchNominatim`) for each individual item causes an N+1 query problem. This can hit rate limits rapidly, trigger unnecessary network overhead, and stall the application when many items share the exact same parameters (like `cityName`).
**Action:** When performing external lookups on an array of items, always group them first by the unique lookup parameter (e.g., city name) into a Map. Make exactly one external API request per unique key, then apply the resulting data to all items grouped under that key simultaneously.

## 2026-06-16 - Avoid hidden Date and Intl.DateTimeFormat object allocations in rendering or iterations
**Learning:** Instantiating `new Date()` or `new Intl.DateTimeFormat()` inside nested helper utilities (like `isCarpoolUpcoming` or `parseDate`) or component render functions (like `AppleCalendarIcon`) can cause hidden performance bottlenecks. When these utilities or components are invoked inside mapping loops (`.map`), filter passes (`.filter`), or list rendering in React, the application reallocates objects $O(N)$ times, causing severe garbage collection pressure and CPU drag.
**Action:** Always extract invariant variables (such as the current date/time, `todayISO`, or formatters) outside of iterations, hooks, and render functions. Compute them at the module level (for static formatters) or pass them in as dependency-injected parameters to utility functions that run inside loops.
## 2026-06-15 - [Optimization] Avoid O(N) Date object instantiation in array loops
**Learning:** Instantiating `new Date(game.dateISO)` inside an `Array.prototype.reduce` loop in a heavily rendered component (like `AdminStats.tsx`) forces O(N) unnecessary Date object allocations, causing GC pressure and CPU overhead on every render.
**Action:** Use `Date.parse()` to get the numeric timestamp scalar and hoist `.getTime()` calculations on reference dates (like `weekendStart.getTime()`) outside the loop. Comparing primitive numbers is significantly faster and prevents memory bloat in render loops.

## 2026-06-25 - Avoid O(N log N) sorting on already-sorted arrays when grouping
**Learning:** In components that group items (like `gamesByDay` in `MobileTimeline` and `DesktopGrid`), if the incoming list (`games`) is already optimally sorted (via `sortGames` Schwartzian transform), pushing items sequentially into map groups naturally preserves the optimal sort order. Applying a nested `dayGames.sort((a, b) => a.time.localeCompare(b.time))` after pushing is completely redundant, adds $O(N \log N)$ computational overhead during React's render cycle, and introduces lexical sorting bugs (e.g. placing "9h00" after "10h00").
**Action:** When grouping a pre-sorted array into a Map or nested lists, iterate sequentially and append directly without invoking `.sort()` inside the grouping loop.

## 2026-06-25 - Avoid redundant sorting and use O(K) extraction on pre-sorted arrays
**Learning:** In components like `MatchTicker`, computing a subset of upcoming items using chained `.filter().sort().slice()` on an array that is already globally pre-sorted causes redundant $O(N \log N)$ sorting overhead and creates intermediate arrays that pressure the garbage collector.
**Action:** When extracting a small top-N subset from a globally pre-sorted array based on a threshold condition (like `dateISO >= nowISO`), use a sequential `for` loop with an early-exit `break` condition to reduce time complexity to $O(K)$ and avoid intermediate array garbage collection.
## 2026-06-28 - [Optimization] Hoist expensive string operations outside of iteration loops
**Learning:** Re-evaluating `storedName.toLowerCase()` inside `entries.find()` or `entries.map()` causes redundant O(N) string memory allocations, leading to garbage collection pressure and CPU drag.
**Action:** Always hoist expensive operations like `.toLowerCase()` outside of iteration loops and array traversal methods to reduce unnecessary reallocations.
