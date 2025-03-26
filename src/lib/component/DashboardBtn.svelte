<script lang="ts">
	import type { RelationshipType } from '$lib/types/object_relationships';
	import { onMount } from 'svelte';
	import type { MouseEventHandler } from 'svelte/elements';

	let btn: HTMLButtonElement;

	export let src: string,
		onclick: MouseEventHandler<HTMLButtonElement> | null | undefined,
		val: RelationshipType | 'HISTORY';
	export let onmount: (btn: HTMLButtonElement) => void;

	onMount(() => onmount(btn));
</script>

<li>
	<button
		bind:this={btn}
		data-val={val}
		{onclick}
		class="hover:opacity-80 border-b-2 inline-flex select-none gap-2 text-lg items-center px-4 py-2 text-white bg-[#0050FE] active min-w-[150px] dark:bg-[#0050FE]"
	>
		<img class="invert" width="25" {src} alt="" />
		<slot></slot>
	</button>
</li>
