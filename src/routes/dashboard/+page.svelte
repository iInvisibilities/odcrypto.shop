<script lang="ts">
	import DashboardBtn from '$lib/component/DashboardBtn.svelte';
	import DashboardCard from '$lib/component/DashboardCard.svelte';
	import { SignOut } from '@auth/sveltekit/components';
	import type { PageProps } from './$types';
	import type { RelationshipType, SERRelationship } from '$lib/types/object_relationships';
	import type { SERWallet } from '$lib/types/wallet';
	import { onMount } from 'svelte';
	import type { LiveTransactionWithUsernames } from '$lib/types/transaction';

	let { data = $bindable() }: PageProps = $props();

	let relations_data = $state(data.relations);
	let counts = $state(data.page_item_count);

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
	let dropdown: HTMLElement | undefined = $state(undefined);

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

	const try_submit_new_wallet = async () => {
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
				}) as never
			);
			if (counts) {
				counts.push({
					key: 'WALLET',
					count: (counts.find((val) => val.key == 'WALLET')?.count ?? 0) + 1
				});
			}
			wallets.push(wallet);
		} else {
			push_not('Could not link wallet, ' + (await request.text()));
		}

		coin_symbol = '';
		wallet_address = '';
	}

	const fetchAllWalletOptions = () => {
		relations_data.map((r) => {
			r.then((obj) => {
				if (obj && obj?.rlp.relationship_type == 'WALLET') wallets.push(obj.object as SERWallet);
			});
		});
	};

	let liveTransactionsSection: LiveTransactionWithUsernames | undefined = $state(undefined);
	let filteredLiveTransactionsSection: LiveTransactionWithUsernames | undefined = $state(undefined);

	onMount(async () => {
		fetchAllWalletOptions();
		const request = await fetch('/dashboard', { method: 'GET' });
		if (request.status == 200) {
			const response = await request.json();
			if (response?.live_transactions_with_usernames) {
				liveTransactionsSection = response.live_transactions_with_usernames as LiveTransactionWithUsernames;
				filteredLiveTransactionsSection = response.live_transactions_with_usernames as LiveTransactionWithUsernames;
				push_not("You're a super user, you can see current live transactions.");
			}
		}
	});

	export const decount_rlp = (rlp_type: RelationshipType) => {
		if(!counts) return;
		const index = counts.findIndex((val) => val.key == rlp_type);
		if (index != -1) {
			counts[index].count--;
			if (counts[index].count <= 0) counts.splice(index, 1);
		}
	}

	let isLiveTransactionsMenuOpen = $state(false);
	function showLiveTransactionsMenu(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement; }) {
		isLiveTransactionsMenuOpen = true;
	}


	export const delete_live_transaction = async (product_id: string, charge_id: string, user_id: string): Promise<import("svelte/elements").MouseEventHandler<HTMLButtonElement> | null | undefined> => {
		const reason = prompt('Reason for canceling transaction?');
		if (!reason) return null;
		push_not('Please wait...');

		const del_req = await fetch("/dashboard/live_transaction", {
			method: 'DELETE',
			body: JSON.stringify({
				product_id,
				charge_id,
				user_id,
				reason
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});
		if (del_req.status == 200) {
			const response = await del_req.json();
			if (response?.deleted) {
				liveTransactionsSection = liveTransactionsSection?.filter((transaction) => transaction.charge_id != charge_id);
				push_not('Transaction canceled successfully!');
			}
		} else {
			push_not('Could not cancel transaction, ' + (await del_req.text()));
		}
	}

	export const filter_live_transactions = (transactions: LiveTransactionWithUsernames, search: string) => {
		if (!search || search.trim().length == 0) return transactions;
		return transactions.filter((transaction) => {
			const user = transaction.user.username.toLowerCase();
			const product = transaction.product.product_name.toLowerCase();
			const date = new Date(transaction.time_created).toLocaleString().toLowerCase();
			const searchLower = search.toLowerCase();
			return user.includes(searchLower) || product.includes(searchLower) || date.includes(searchLower);
		});
	};
</script>

{#if isLiveTransactionsMenuOpen && filteredLiveTransactionsSection && liveTransactionsSection}
	<div class="z-20 absolute h-dvh w-dvw text-xl grid items-center justify-center backdrop_eff">
		<div>
			<div class="flex w-full backdrop_eff_2">
				<input oninput={
					e => {
						if (liveTransactionsSection == undefined) return;
						filteredLiveTransactionsSection = filter_live_transactions(liveTransactionsSection, (e.target as HTMLInputElement).value);
					}
				} type="text" placeholder="Search..." class="py-1 px-2 border-2 border-gray-400 rounded-tl-md outline-none placeholder:text-white text-white" />
				<button class="bg-[#0050ff] text-white py-1 px-3" onclick={async (e) => {
					const setDisplayText = (text: string) => {
						if (e.target == null) return;
						(e.target as HTMLButtonElement).textContent = text;
					}
					
					setDisplayText("Reloading...");
					const request = await fetch('/dashboard', { method: 'GET' });
					if (request.status == 200) {
						const response = await request.json();
						if (response?.live_transactions_with_usernames) {
							liveTransactionsSection = response.live_transactions_with_usernames as LiveTransactionWithUsernames;
							setDisplayText("Reload Complete!");
							setTimeout(() => setDisplayText("Reload"), 1500);
						}
						else setDisplayText("Error!");
					}
					else setDisplayText("Error!");
				}}>Reload</button>
				<button class="bg-[#FC565E] text-white py-1 px-3 rounded-tr-md" onclick={() => (isLiveTransactionsMenuOpen = false)}>Close</button>
			</div>
			<div class="grid gap-2 max-h-72 shadow-lg rounded-b-md *:h-max *:w-max bg-white p-4 overflow-auto backdrop_eff_2">
				{#if filteredLiveTransactionsSection.length > 0}
					{#each filteredLiveTransactionsSection as transaction}
						<div class="flex items-center justify-center gap-2">
							<div class="flex items-center justify-center gap-1 w-full">
								<span class="text-gray-500 select-none text-sm">{new Date(transaction.time_created).toLocaleTimeString()}</span>
								<a class="hover:underline font-semibold" href="/user/{transaction.user.user_id}" target="_blank">{transaction.user.username}</a>
								<span class="select-none">is buying</span>
								<a class="hover:underline font-semibold" href="/{transaction.product.product_id}" target="_blank">{transaction.product.product_name}</a>
							</div>
							<button class="cursor-pointer hover:scale-110 transition-all" onclick={() => delete_live_transaction(transaction.product.product_id, transaction.charge_id, transaction.user.user_id)} title="Cancel live transaction"><img class="w-6" src="delete.svg" alt="x"/></button>
						</div>
					{/each}
				{:else}
					<div class="text-center text-gray-500 select-none">No live transactions</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

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
	<button
		class="md:hidden block bg-green-500 text-white w-full shadow-md py-2 hover:bg-blue-600 transition-all"
		onclick={() => dropdown?.classList.toggle("hidden")}
	>
		Toggle Menu
	</button>
	<ul
		bind:this={dropdown}
		class="hidden flex-column flex-wrap md:block md:w-max w-full justify-center *:border-l-white *:border-l-0 text-sm font-medium text-gray-500 dark:text-gray-400"
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
		<DashboardBtn {onclick} onmount={() => {}} src="report.svg" val="POST_REPORT">Reports</DashboardBtn>
		<DashboardBtn {onclick} {onmount} src="history-log.svg" val="HISTORY">History</DashboardBtn>
		{#if liveTransactionsSection}
			<button onclick={showLiveTransactionsMenu} class="hover:opacity-75 cursor-default w-full opacity-80 border-b-2 inline-flex select-none gap-2 text-lg items-center px-4 py-2 text-white bg-fuchsia-700 active min-w-[150px]"><img class="invert" width="25" src="live.svg" alt="">Live transactions</button>
		{/if}
		<a
			href="dashboard/post"
			class="hover:opacity-75 cursor-default w-full opacity-80 border-b-2 inline-flex select-none gap-2 text-lg items-center px-4 py-2 text-white bg-green-500 active min-w-[150px] dark:bg-green-500"
		>
			<img class="invert" width="25" src="product.svg" alt="" />For sale</a
		>
		<SignOut signOutPage="user/signout" className="w-full *:w-full">
			<span
				class="hover:opacity-75 w-full opacity-80 inline-flex select-none gap-2 text-lg items-center px-4 py-2 text-white bg-red-500 active min-w-[150px] dark:bg-red-500"
				slot="submitButton"><img class="invert" width="25" src="log-out.svg" alt="" />Log Out</span
			>
		</SignOut>
	</ul>
	<div class="relative p-6 bg-gray-50 text-medium text-gray-500 dark:text-gray-400 dark:bg-gray-800 w-full min-h-dvh">
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
				<img src="box.png" class="absolute invert opacity-30 inset-0 m-auto w-1/4" alt="">	
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
			{#if counts && current_page && !counts.findLast((val) => val.key == current_page)}
				<img src="box.png" class="absolute invert opacity-30 inset-0 m-auto w-1/4" alt="">	
			{:else}
				<div class={current_page == 'WALLET' ? 'mt-4' : ''}>
					{#each relations_data as _, i}
						<DashboardCard
							{deleted_object_elements}
							{push_not}
							bind:rlp={relations_data[i]}
							{current_page}
							{wallets}
							{decount_rlp}
						/>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>
