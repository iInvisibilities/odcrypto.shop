<script lang="ts">
	import DashboardBtn from '$lib/component/DashboardBtn.svelte';
	import DashboardCard from '$lib/component/DashboardCard.svelte';
	import { SignOut } from '@auth/sveltekit/components';
	import type { EPInformation, RelationshipType } from '$lib/types/product';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let current_page: RelationshipType | undefined = $state();
	const deleted_product_elements: string[] = [];

	let last_sel: HTMLElement | undefined = $state();

	const onclick = (e: MouseEvent) => {
		if (!(e.currentTarget instanceof HTMLElement)) return;
		if (last_sel) {
			last_sel.classList.remove('font-bold');
			last_sel.classList.remove('pointer-events-none');
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

	let product_info: EPInformation | undefined = $state();

	const open_product_editor = (prod_info: EPInformation) => {
		product_info = prod_info;
	};

	function save_data(_event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		$state.snapshot(product_info);
		// NOT BEING EDITED, SO WILL HAVE TO FIND A WAY TO MANUALLY UPDATE THE VALUES ONCE save_data IS CALLED...
		product_info = undefined;
	}
</script>

{#if product_info}
	<div
		class="absolute z-20 inset-0 m-auto h-max w-max grid bg-white backdrop-opacity-40 *:h-max *:w-max p-1 shadow-lg border-2"
		style="grid-template-columns: repeat(2, 1fr);"
	>
		{#each Object.keys(product_info) as product_info_type}
			<label for="name">{product_info_type.replace('_', ' ') + ':'}</label>
			<input
				type="text"
				name="name"
				value={product_info[product_info_type as keyof EPInformation]}
			/>
		{/each}
		<button
			onclick={() => (product_info = undefined)}
			class="hover:opacity-75 justify-self-center cursor-default opacity-80 border-b-2 inline-flex select-none gap-2 text-lg items-center px-2 py-1 text-white bg-red-500 active dark:bg-red-500"
			>Cancel</button
		>
		<button
			onclick={save_data}
			class="hover:opacity-75 justify-self-center cursor-default opacity-80 border-b-2 inline-flex select-none gap-2 text-lg items-center px-2 py-1 text-white bg-green-500 active dark:bg-green-500"
			>Save</button
		>
	</div>
{/if}

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
		{#if !data.relations || data.relations.length == 0}
			Empty!
		{:else}
			<h3
				class="text-lg font-bold text-gray-900 dark:text-white mb-2 flex justify-between xl:justify-start items-center gap-2"
			>
				<span class="italic">{current_page ? current_page?.toUpperCase() : 'HISTORY'}</span>
				{#if current_page}
					<span class="text-sm opacity-50 italic font-extralight select-none"
						>click on desired product to visit its page</span
					>
				{/if}
			</h3>
			{#each data.relations as relation}
				{#await relation then rlp}
					{#if rlp && (!current_page || rlp.relationship_type == current_page) && !deleted_product_elements.includes(rlp.product_id)}
						<DashboardCard
							{open_product_editor}
							{deleted_product_elements}
							{push_not}
							relation={rlp}
							{current_page}
						/>
					{/if}
				{:catch error}
					<h2>Error loading this product...</h2>
				{/await}
			{/each}
		{/if}
	</div>
</div>
