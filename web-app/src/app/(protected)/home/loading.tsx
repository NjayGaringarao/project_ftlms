// Pure-CSS spinner: this fallback is server-streamed before hydration, so it
// cannot depend on client JS (ui/loading resolves its color at mount time and
// renders invisible until hydrated).
const HomeLoading = () => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-3 py-24">
      <div
        className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"
        aria-label="Loading"
      />
      <p className="text-primary text-xl font-medium">Loading insights...</p>
    </div>
  );
};

export default HomeLoading;
