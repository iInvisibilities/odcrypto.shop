<script lang="ts">
	import DashboardBtn from '$lib/component/DashboardBtn.svelte';
	import DashboardCard from '$lib/component/DashboardCard.svelte';
	import { SignOut } from '@auth/sveltekit/components';
	import type { PageProps } from './$types';
	import type { RelationshipType, SERRelationship } from '$lib/types/object_relationships';
	import type { SERWallet } from '$lib/types/wallet';
	import { onMount } from 'svelte';
	import type { LiveTransactionWithUsernames } from '$lib/types/transaction';
	import type { Report } from '$lib/types/reports';

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
				push_not("You're a super user.");
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

	let reports_gui_open = $state(false);
	let search_type = $state('user_name');
	let search_value = $state('');
	let in_reports_gui_notification = $state('Found 0 reports');
	let selected_reports_to_manage: Report[] = $state([]);
	let selected_reports_to_manage_count = $state(0);
	
	let report_results: Report[] = $state([]);
	let report_results_count = $state(0);

	let reports_search_box_indicator: HTMLImageElement | undefined = $state(undefined);

	const actOnEnter = (e: KeyboardEvent) => { if (e.key == "Enter") search_for_reports(); };

	function openReportsGUI(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement; }) {
		reports_gui_open = true;
		report_results = [];
		report_results_count = 0;
		selected_reports_to_manage = [];
		selected_reports_to_manage_count = 0;

		document.addEventListener("keyup", actOnEnter);
	}


	const search_for_reports = async () => {
		if (search_value.trim().length == 0) {
			in_reports_gui_notification = 'Please enter a search value';
			return;
		}

		if (search_value.length < 3) {
			in_reports_gui_notification = 'Search value must be at least 3 characters long';
			return;
		}

		report_results = [];
		report_results_count = 0;
		selected_reports_to_manage = [];
		selected_reports_to_manage_count = 0;
		reports_search_box_indicator?.classList.add('searching');
		
		const search_request = await fetch('/api/reports?' + search_type + '=' + search_value, {
			method: 'GET'
		});
		if (search_request.status == 200) {
			const response = await search_request.json();
			if (response?.reports) {
				report_results = response.reports as Report[];
				report_results_count = report_results.length;
				in_reports_gui_notification = 'Found ' + report_results_count + ' report' + (report_results_count == 1 ? '' : 's');
			}
		} else if(search_request.status == 404) {
			in_reports_gui_notification = 'Found 0 reports';
		} else {
			in_reports_gui_notification = await search_request.text();
		}

		reports_search_box_indicator?.classList.remove('searching');
	}

	function report_clicked(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement; }, arg0: Report): any {
		if (!event.ctrlKey) {
			const c = confirm('Report created at ' + new Date(arg0.created_at).toLocaleString() + '\nStatus: ' + arg0.status + '\nReported ' + arg0.object_id + '\nReason: ' + arg0.reason + '\nGo to reported product page?');
			if (c) {
				window.open('/' + arg0.object_id, '_blank');
			}
		}
		else {
			if (selected_reports_to_manage.includes(arg0)) {
				selected_reports_to_manage = selected_reports_to_manage.filter((report) => report._id != arg0._id);
				selected_reports_to_manage_count--;
				event.currentTarget.classList.remove('for-management');
			} else {
				if (selected_reports_to_manage.findLast((report) => report._id == arg0._id)) return;
				selected_reports_to_manage.push(arg0);
				selected_reports_to_manage_count++;
			
				event.currentTarget.classList.add('for-management');
			}
		}
	}


	function close_reports_gui(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement; }) {
		document.removeEventListener("keyup", actOnEnter);
		reports_gui_open = false;
		search_value = '';
		search_type = 'user_name';
		in_reports_gui_notification = 'Found 0 reports';
		report_results = [];
		report_results_count = 0;
		selected_reports_to_manage = [];
		selected_reports_to_manage_count = 0;
		if (reports_search_box_indicator) reports_search_box_indicator.classList.remove('searching');
	}
</script>

{#if reports_gui_open}
	<div class="z-20 absolute h-dvh w-dvw text-xl grid items-center justify-center backdrop_eff">
		<div class="w-full">
			<div class="flex w-full backdrop_eff_2">
				<button class="bg-[#FC565E] text-white py-1 px-3 rounded-t-md" onclick={close_reports_gui}>Close</button>
			</div>
			<div class="gap-2 max-h-[700px] h-[500px] w-[700px] shadow-lg rounded-b-md rounded-tr-md bg-white p-4 overflow-auto backdrop_eff_2">
				<div class="mb-2 w-full">
					<span class="text-gray-500 select-none italic">{selected_reports_to_manage_count != 0 ? "Selected " + selected_reports_to_manage_count + " report" + (selected_reports_to_manage_count == 1 ? '' : 's') : "Ctrl + Click to manage reports"}</span>
					<div class="flex items-center justify-between gap-2 w-full">
						<h3 class="text-lg font-bold text-gray-900 flex justify-between xl:justify-start items-end gap-2">Search through reports</h3>
						<div class="text-center text-gray-500 select-none" contenteditable="false" bind:innerText={in_reports_gui_notification}></div>
					</div>
					<div class="flex items-center justify-start gap-2 mt-2 w-full">
						<select bind:value={search_type} name="search_type" class="py-1 px-2 border-2 border-gray-400 rounded-md outline-none">
							<option value="user_name">Reported by</option>
							<option value="object_name">Product name</option>
							<option value="user_id">User ID</option>
							<option value="object_id">Product ID</option>
						</select>
						<input bind:value={search_value} type="text" placeholder="Search..." class="py-1 px-2 border-2 border-gray-400 rounded-md outline-none" />
						<button onclick={search_for_reports} class="bg-[#0050ff] border-2 border-[#0050ff] rounded-md text-white py-1 px-3">Search</button>
					</div>
				</div>
				{#if report_results_count > 0}
					<div class="flex flex-wrap max-w-fit justify-center items-center shadow-lg rounded-md *:h-max bg-white p-2 overflow-auto backdrop_eff_2">
						{#each report_results as report}
							<div class="bg-gray-100 p-2 rounded-md grid items-center justify-between gap-2">
								<button onclick={e => report_clicked(e, report)} class="text-white grid px-2 py-0.5 rounded-md transition-all duration-150 hover:opacity-85 cursor-pointer select-none bg-blue-600">
									Click to view
									<span class="select-none opacity-75">{new Date(report.created_at).toLocaleTimeString()}</span>
								</button>
							</div>
						{/each}
					</div>
				{:else}
					<img bind:this={reports_search_box_indicator} src="box.png" class="absolute opacity-30 inset-0 m-auto w-1/4" alt="">	
				{/if}
			</div>
		</div>
	</div>
{/if}

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
		{#if data.is_super}
			<button onclick={openReportsGUI} class="hover:opacity-75 cursor-default w-full opacity-80 border-b-2 inline-flex select-none gap-2 text-lg items-center px-4 py-2 text-white bg-fuchsia-700 active min-w-[150px]"><img class="invert" width="25" src="report.svg" alt="">Reports</button>
		{:else}
			<DashboardBtn {onclick} onmount={() => {}} src="report.svg" val="POST_REPORT">Reports</DashboardBtn>
		{/if}
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
