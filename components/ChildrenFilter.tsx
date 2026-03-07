'use client';

/**
 * ChildrenFilter — client component.
 *
 * Renders a checkbox labelled "Näytä lastenesitykset" (Show children's shows).
 * - Checked (default): all shows are visible — `?children=` param is absent.
 * - Unchecked: children's shows are hidden — `?children=hide` is set.
 *
 * Preserves any existing `?week=` param when toggling, and uses
 * `router.replace` so the filter toggle does not pollute the back stack.
 *
 * Must be wrapped in <Suspense> in the parent server component because it
 * calls `useSearchParams`.
 */

import { useRouter, useSearchParams } from 'next/navigation';

export function ChildrenFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Checkbox is checked when children's shows are NOT hidden
  const isChecked = searchParams.get('children') !== 'hide';

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const params = new URLSearchParams(searchParams.toString());

    if (e.target.checked) {
      // Show all — remove the hide param
      params.delete('children');
    } else {
      // Hide children's shows
      params.set('children', 'hide');
    }

    router.replace(`?${params.toString()}`);
  }

  return (
    <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        className="h-4 w-4 cursor-pointer accent-gray-800"
      />
      Näytä lastenesitykset
    </label>
  );
}
