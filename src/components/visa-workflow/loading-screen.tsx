export function LoadingScreen() {
  return (
    <main className="mx-auto flex min-h-svh max-w-5xl items-center justify-center px-6 py-12">
      <div className="panel w-full max-w-lg p-8 text-center">
        <p className="text-muted-foreground text-sm tracking-[0.24em] uppercase">
          Visa Workflow
        </p>
        <h1 className="font-heading mt-3 text-3xl font-semibold">
          Preparing workspace
        </h1>
        <p className="text-muted-foreground mt-3 text-sm">
          Loading saved configuration and submission history.
        </p>
      </div>
    </main>
  )
}
