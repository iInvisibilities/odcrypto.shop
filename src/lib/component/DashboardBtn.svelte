<script lang="ts">
	import type { RelationshipType } from '$lib/types/product';
	import type { MouseEventHandler } from 'svelte/elements';

	export let src: string,
		onclick: MouseEventHandler<HTMLButtonElement> | null | undefined,
		val: RelationshipType | 'HISTORY';
</script>

<li>
	<button
		data-val={val}
		{onclick}
		class="hover:opacity-80 border-b-2 inline-flex select-none gap-2 text-lg items-center px-4 py-2 text-white bg-[#0050FE] active min-w-[150px] dark:bg-[#0050FE]"
	>
		<img class="invert" width="25" {src} alt="" />
		<slot></slot>
	</button>
</li>
