<script lang="ts">
	import DashboardBtn from '$lib/component/DashboardBtn.svelte';
	import DashboardCard from '$lib/component/DashboardCard.svelte';
	import { SignOut } from '@auth/sveltekit/components';
	import type { PageProps } from './$types';
	import type { RelationshipType } from '$lib/types/object_relationships';
	import type { ObjectId } from 'mongodb';

	let { data }: PageProps = $props();

	let relations_data = $state(data.relations);

	let current_page: RelationshipType | undefined = $state();
	const deleted_object_elements: (ObjectId | null)[] = [];

	let last_sel: HTMLElement | undefined = $state();

	const onclick = (e: MouseEvent) => {
		if (!(e.currentTarget instanceof HTMLElement)) return;
		if (last_sel) {
			last_sel.classList.remove('font-bold');
			last_sel.classList.remove('pointer-events-none');
			last_sel.classList.add('hover:opacity-80');
		}

		const valAtrr = e.currentTarget?.getAttribute('data-val');
		if (!valAtrr) return;

		current_page = valAtrr == 'HISTORY' ? undefined : (valAtrr as RelationshipType);

		e.currentTarget?.classList.add('font-bold', 'pointer-events-none');
		e.currentTarget?.classList.remove('hover:opacity-80');

		last_sel = e.currentTarget;
	};

	let push_not_el: HTMLElement;

	const push_not = (msg: string) => {
		push_not_el.textContent = msg;
		push_not_el.style.animation = 'show_not';
		push_not_el.style.animationDuration = '5s';
		push_not_el.style.animationTimingFunction = 'ease-out';
		setTimeout(() => (push_not_el.style.animation = ''), 5000);
	};

	const onmount = (btn: HTMLButtonElement) => {
		btn.classList.add('font-bold');
		btn.classList.remove('hover:opacity-80');
		last_sel = btn;
	};
</script>

<div class="notification" contenteditable="false" bind:this={push_not_el}></div>
<div class="md:flex Coinbase min-h-dvh">
	<ul
		class="flex-column flex-wrap md:block md:w-max w-full justify-center *:border-l-white *:border-l-2 md:*:border-l-0 md:*:w-max flex text-sm font-medium text-gray-500 dark:text-gray-400"
	>
		<DashboardBtn {onclick} onmount={() => {}} src="backpack.svg" val="BOUGHT"
			>Backpack</DashboardBtn
		>
		<DashboardBtn {onclick} onmount={() => {}} src="post-stamp.svg" val="POSTED"
			>Posted</DashboardBtn
		>
		<DashboardBtn {onclick} onmount={() => {}} src="heart.svg" val="WISHLISTED"
			>Wishlist</DashboardBtn
		>
		<DashboardBtn {onclick} onmount={() => {}} src="wallet.svg" val="WALLET">Wallet</DashboardBtn>
		<DashboardBtn {onclick} {onmount} src="history-log.svg" val="HISTORY">History</DashboardBtn>
		<a
			href="dashboard/post"
			class="hover:opacity-75 cursor-default opacity-80 border-b-2 inline-flex select-none gap-2 text-lg items-center px-4 py-2 text-white bg-green-500 active min-w-[150px] dark:bg-green-500"
		>
			<img class="invert" width="25" src="product.svg" alt="" />For sale</a
		>
		<SignOut signOutPage="user/signout">
			<span
				class="hover:opacity-75 opacity-80 inline-flex select-none gap-2 text-lg items-center px-4 py-2 text-white bg-red-500 active min-w-[150px] dark:bg-red-500"
				slot="submitButton"><img class="invert" width="25" src="log-out.svg" alt="" />Log Out</span
			>
		</SignOut>
	</ul>
	<div class="p-6 bg-gray-50 text-medium text-gray-500 dark:text-gray-400 dark:bg-gray-800 w-full">
		{#if !relations_data || relations_data.length == 0}
			Empty!
		{:else}
			<h3
				class="text-lg font-bold text-gray-900 dark:text-white mb-2 flex justify-between xl:justify-start items-center gap-2"
			>
				<span class="italic">{current_page ? current_page?.toUpperCase() : 'HISTORY'}</span>
				{#if current_page}
					<span class="text-sm opacity-50 italic font-extralight select-none"
						>click on desired {current_page == 'WALLET' ? 'wallet' : 'product'} to visit its page</span
					>
				{/if}
			</h3>
			{#each relations_data as _, i}
				<DashboardCard
					{deleted_object_elements}
					{push_not}
					bind:rlp={relations_data[i]}
					{current_page}
				/>
			{/each}
		{/if}
	</div>
</div>
