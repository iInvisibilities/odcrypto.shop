<script lang="ts">
	import type { MouseEventHandler } from 'svelte/elements';

	export let src: string, onclick: MouseEventHandler<HTMLButtonElement> | null | undefined;
</script>

<li>
	<button
		{onclick}
		class="hover:outline-2 outline-[#023095] inline-flex select-none gap-2 text-lg items-center px-4 py-2 text-white bg-[#0050FE] rounded-lg active min-w-[150px] dark:bg-[#0050FE]"
	>
		<img class="invert" width="25" {src} alt="" />
		<slot></slot>
	</button>
</li>
