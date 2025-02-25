<script lang="ts">
	import DashboardBtn from '$lib/component/DashboardBtn.svelte';
	import DashboardCard from '$lib/component/DashboardCard.svelte';
	import type { RelationshipType } from '$lib/types/product';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let current_page: RelationshipType | undefined = $state();
	let last_sel: HTMLElement | undefined = $state();

	const onclick = (e: MouseEvent) => {
		if (!(e.currentTarget instanceof HTMLElement)) return;
		if (last_sel) {
			last_sel.classList.remove('font-bold');
			last_sel.classList.add('hover:outline-2');
		}

		switch (e.currentTarget?.innerText.toLowerCase()) {
			case 'backpack':
				current_page = 'BOUGHT';
				break;
			case 'posted':
				current_page = 'POSTED';
				break;
			case 'wishlist':
				current_page = 'WISHLISTED';
				break;
			case 'history':
				current_page = undefined;
				break;
		}

		e.currentTarget?.classList.add('font-bold');
		e.currentTarget?.classList.remove('hover:outline-2');

		last_sel = e.currentTarget;
	};
</script>

<div class="md:flex Coinbase">
	<ul
		class="flex-column space-y space-y-4 text-sm font-medium text-gray-500 dark:text-gray-400 md:me-4 mb-4 md:mb-0"
	>
		<DashboardBtn {onclick} src="backpack.svg">Backpack</DashboardBtn>
		<DashboardBtn {onclick} src="post-stamp.svg">Posted</DashboardBtn>
		<DashboardBtn {onclick} src="heart.svg">Wishlist</DashboardBtn>
		<DashboardBtn {onclick} src="history-log.svg">History</DashboardBtn>
	</ul>
	<div
		class="p-6 bg-gray-50 text-medium text-gray-500 dark:text-gray-400 dark:bg-gray-800 rounded-lg w-full"
	>
		{#if !data.relations}
			Empty!
		{:else}
			<h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
				{current_page ? current_page?.toUpperCase() : 'HISTORY'}
			</h3>
			{#each data.relations.filter((rlp) => !current_page || rlp.relationship_type == current_page) as relation}
				<DashboardCard {relation} />
			{/each}
		{/if}
	</div>
</div>
