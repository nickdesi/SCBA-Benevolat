## 2024-05-18 - String Comparison vs Date Parsing in Filter Loops
**Learning:** Instantiating `new Date()` and calling `setHours()` inside an `Array.prototype.filter` block for a large array is surprisingly expensive and can block the main thread.
**Action:** When filtering future/past dates, use pre-calculated `YYYY-MM-DD` and `HHMM` string comparison instead of parsing and manipulating dates on each iteration. In benchmarks, this yielded a 20x performance speedup.
## 2024-04-16 - MatchTicker React.memo Optimization
**Learning:** In a highly dynamic list of games where filters or parent states change, functional components that rely on filtering large arrays on every render (like MatchTicker) can cause unnecessary re-renders. Additionally, React.memo is not consistently applied to all components.
**Action:** Wrap MatchTicker in React.memo and useMemo for its internal derived data (upcoming games calculation) to prevent unnecessary re-computations and re-renders, especially since it only needs to re-render when the `games` array reference changes.
## 2024-04-17 - Commented Out Code Removal
**Learning:** Commented out code should be removed from the codebase to improve readability and maintainability. Using git for version control allows retrieving old code if needed.
**Action:** Removed commented out code in useVolunteers.ts and used npm run build to ensure functionality is not broken.
