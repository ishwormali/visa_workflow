export function LoadingScreen() {
  return (
    <main className="mx-auto flex min-h-svh max-w-5xl items-center justify-center px-6 py-12">
      <div className="panel w-full max-w-lg p-8 text-center">
        <p className="text-sm tracking-[0.24em] text-muted-foreground uppercase">Visa Workflow</p>
        <h1 className="mt-3 font-heading text-3xl font-semibold">Preparing workspace</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Loading saved configuration and submission history.
        </p>
      </div>
    </main>
  );
}
