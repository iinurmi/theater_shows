/**
 * HelloWorld — minimal smoke-test component.
 * Validates that the component pattern, named exports, and Tailwind classes
 * all work end-to-end in the dev workflow.
 */
export function HelloWorld() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight">Hello, World!</h1>
      <p className="text-lg text-gray-500">
        First Claude App is up and running.
      </p>
    </div>
  );
}
