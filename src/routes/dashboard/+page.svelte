<script lang="ts">
	import DashboardBtn from '$lib/component/DashboardBtn.svelte';
	import DashboardCard from '$lib/component/DashboardCard.svelte';
	import { SignOut } from '@auth/sveltekit/components';
	import type { PageProps } from './$types';
	import type { RelationshipType, SERRelationship } from '$lib/types/object_relationships';
	import type { SERWallet } from '$lib/types/wallet';
	import { onMount } from 'svelte';

	let { data }: PageProps = $props();

	let relations_data = $state(data.relations);

	let current_page: RelationshipType | undefined = $state();
	const deleted_object_elements: (string | null)[] = [];

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
		push_not_el.style.animation = '';

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

	let is_adding_wallet = $state(false);
	let coin_symbol: string = $state(''),
		wallet_address: string = $state('');

	let wallets: SERWallet[] = $state([]);

	async function try_submit_new_wallet() {
		is_adding_wallet = false;
		push_not('Please wait...');

		const request = await fetch('/dashboard/post', {
			method: 'POST',
			body: JSON.stringify({
				object_type: 'WALLET',
				object: { address: wallet_address, type: coin_symbol }
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (request.status == 200) {
			push_not('Wallet linked successfully!');
			const new_wallet = await request.json();
			const wallet: SERWallet = {
				_id: new_wallet._id,
				address: wallet_address,
				type: coin_symbol
			};

			relations_data.push(
				Promise.resolve({
					rlp: new_wallet.serializable_established_rlp as SERRelationship,
					object: wallet
				})
			);
		} else {
			push_not('Could not link wallet, ' + (await request.text()));
		}

		coin_symbol = '';
		wallet_address = '';
	}

	const fetchAllWalletOptions = async () => {
		const request = await fetch('/api?is_wallet=true', {
			method: 'GET'
		});

		if (request.ok) {
			wallets = (await request.json()).my_wallets;
		}
	};

	onMount(fetchAllWalletOptions);
</script>

{#if is_adding_wallet}
	<div class="z-20 absolute h-dvh w-dvw text-xl grid items-center justify-center backdrop_eff">
		<div class="grid gap-2 shadow-lg rounded-md *:h-max *:w-max bg-white p-4 backdrop_eff_2">
			<div class="flex items-center gap-1 w-full">
				<img src="coin.svg" class="w-6 select-none pointer-events-none" alt="" />
				<input
					bind:value={coin_symbol}
					type="text"
					class="py-1 px-2 uppercase placeholder:capitalize border-2 border-gray-400 rounded-md outline-none"
					placeholder="Coin symbol (BTC, ETH, etc...)"
				/>
			</div>
			<div class="flex items-center gap-1 w-full justify-end">
				<img src="wallet.svg" class="w-6 select-none pointer-events-none" alt="" />
				<input
					bind:value={wallet_address}
					class="py-1 px-2 border-2 rounded-md border-gray-400 outline-none"
					type="text"
					placeholder="Wallet address"
				/>
			</div>
			<div class="flex gap-2 items-center justify-end w-full *:py-1 *:px-3 text-white mt-3">
				<button class="bg-[#33D473]" onclick={try_submit_new_wallet}>Link</button>
				<button class="bg-[#FC565E]" onclick={() => (is_adding_wallet = false)}>Cancel</button>
			</div>
		</div>
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
		<DashboardBtn {onclick} onmount={() => {}} src="wallet.svg" val="WALLET">Wallets</DashboardBtn>
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
			{#if current_page == 'WALLET'}
				<div class="text-md md:text-xl">
					<button
						onclick={() => (is_adding_wallet = true)}
						class="cursor-pointer rounded-md flex items-center gap-2 text-white bg-green-600 p-0.5 md:p-1 shadow-md hover:shadow-lg hover:scale-95 transition-all active:scale-90"
						><img class="w-8 invert" src="wallet-plus.svg" alt="" />link new wallet</button
					>
				</div>
			{:else}
				Empty!
			{/if}
		{:else}
			<div class="flex w-full justify-between items-center flex-wrap gap-2">
				<h3
					class="text-lg font-bold text-gray-900 dark:text-white mb-2 flex justify-between xl:justify-start items-end gap-2"
				>
					<span class="italic text-2xl">{last_sel?.textContent}</span>
					{#if current_page}
						<span class="hidden md:block text-sm opacity-50 italic font-extralight select-none"
							>click on desired {current_page == 'WALLET' ? 'wallet' : 'product'} to visit its page</span
						>
					{/if}
				</h3>

				{#if current_page == 'WALLET'}
					<div class="text-md md:text-xl">
						<button
							onclick={() => (is_adding_wallet = true)}
							class="cursor-pointer rounded-md flex items-center gap-2 text-white bg-green-600 p-0.5 md:p-1 shadow-md hover:shadow-lg hover:scale-95 transition-all active:scale-90"
							><img class="w-8 invert" src="wallet-plus.svg" alt="" />link new wallet</button
						>
					</div>
				{/if}
			</div>
			<div class={current_page == 'WALLET' ? 'mt-4' : ''}>
				{#each relations_data as _, i}
					<DashboardCard
						{deleted_object_elements}
						{push_not}
						bind:rlp={relations_data[i]}
						{current_page}
						{wallets}
					/>
				{/each}
			</div>
		{/if}
	</div>
</div>
