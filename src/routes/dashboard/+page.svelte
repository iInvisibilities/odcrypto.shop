<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

{#if !data.relations}
	<div>nothing!</div>
{:else}
	{#each data.relations as relation}
		<div>{relation}</div>
	{/each}
{/if}
