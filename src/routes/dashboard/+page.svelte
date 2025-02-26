<script lang="ts">
	import DashboardBtn from '$lib/component/DashboardBtn.svelte';
	import DashboardCard from '$lib/component/DashboardCard.svelte';
	import { SignOut } from '@auth/sveltekit/components';
	import type { RelationshipType } from '$lib/types/product';
	import type { PageProps } from './$types';
	import { onMount } from 'svelte';

	let { data }: PageProps = $props();

	let current_page: RelationshipType | undefined = $state();
	let last_sel: HTMLElement | undefined = $state();

	const onclick = (e: MouseEvent) => {
		if (!(e.currentTarget instanceof HTMLElement)) return;
		if (last_sel) {
			last_sel.classList.remove('font-bold');
			last_sel.classList.add('hover:opacity-80');
		}

		const valAtrr = e.currentTarget?.getAttribute('data-val');
		if (
			!valAtrr ||
			(valAtrr != 'HISTORY' &&
				valAtrr != 'BOUGHT' &&
				valAtrr != 'POSTED' &&
				valAtrr != 'WISHLISTED')
		)
			return;

		current_page = valAtrr == 'HISTORY' ? undefined : valAtrr;

		e.currentTarget?.classList.add('font-bold');
		e.currentTarget?.classList.remove('hover:opacity-80');

		last_sel = e.currentTarget;
	};
</script>

<div class="md:flex Coinbase h-dvh">
	<ul
		class="flex-column flex-wrap md:block md:w-max w-full justify-center *:border-l-white *:border-l-2 md:*:border-l-0 md:*:w-max flex text-sm font-medium text-gray-500 dark:text-gray-400"
	>
		<DashboardBtn {onclick} src="backpack.svg" val="BOUGHT">Backpack</DashboardBtn>
		<DashboardBtn {onclick} src="post-stamp.svg" val="POSTED">Posted</DashboardBtn>
		<DashboardBtn {onclick} src="heart.svg" val="WISHLISTED">Wishlist</DashboardBtn>
		<DashboardBtn {onclick} src="history-log.svg" val="HISTORY">History</DashboardBtn>
		<SignOut signOutPage="user/signout">
			<span
				class="hover:opacity-75 opacity-80 border-b-2 inline-flex select-none gap-2 text-lg items-center px-4 py-2 text-white bg-red-500 active min-w-[150px] dark:bg-red-500"
				slot="submitButton">Log Out</span
			>
		</SignOut>
	</ul>
	<div class="p-6 bg-gray-50 text-medium text-gray-500 dark:text-gray-400 dark:bg-gray-800 w-full">
		{#if !data.relations}
			Empty!
		{:else}
			<h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
				{current_page ? current_page?.toUpperCase() : 'HISTORY'}
			</h3>
			{#each data.relations
				.filter((rlp) => !current_page || rlp.relationship_type == current_page)
				.sort((a, b) => b.established_at.getTime() - a.established_at.getTime())
				.map((rlp) => {
					return { ...rlp, index: data.relations.indexOf(rlp) };
				}) as relation}
				<DashboardCard {relation} {current_page} />
			{/each}
		{/if}
	</div>
</div>
