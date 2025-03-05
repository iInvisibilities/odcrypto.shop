<script lang="ts">
	import type { EPInformation } from '$lib/types/product';
	import { onMount } from 'svelte';

	let { rlp = $bindable(), current_page, push_not, deleted_product_elements } = $props();

	let relation:
		| {
				product: {
					name: string;
					description: string;
					currency: string;
					price: number;
					wallet_address: string | undefined;
					file_name: string;
					icon_url: string | undefined;
					_id: string;
					deleted: any;
				};
				relationship_type: any;
				established_at: any;
		  }
		| undefined = $state();
	onMount(async () => {
		relation = await rlp;
	});
	let product_info: EPInformation | undefined = $state();

	const open_product_editor = (prod_info: EPInformation) => {
		product_info = prod_info;
	};

	async function save_data(
		_event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }
	) {
		if (!relation || !relation.product || !product_info) return;

		product_info.file_name =
			relation.product.file_name.split('/')[0] + '/' + product_info?.file_name;

		//data.relations[edited_product_index] = Promise.resolve(edited_product);
		push_not("Updating product's information...");
		const response = await fetch('/dashboard/post', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(product_info)
		});
		if (response.ok && response.status == 200) {
			push_not('Product information updated successfully!');

			relation.product.name = product_info.name;
			relation.product.description = product_info.description;
			relation.product.currency = product_info.currency;
			relation.product.price = product_info.price;
			relation.product.wallet_address = product_info.wallet_address;
			relation.product.file_name = product_info.file_name;
			relation.product.icon_url = product_info.icon_url;
		} else {
			push_not('Could not update product information!');
		}
		product_info = undefined;
	}

	let own_dom: HTMLDivElement | undefined = $state();

	async function operate_upon(current_page: string, force_download?: boolean) {
		if (!relation) return;

		if (force_download) {
			download();
			return;
		}
		switch (current_page) {
			case 'POSTED':
			case 'WISHLISTED':
				if (!confirm('Are you sure?')) break;
				push_not('Loading...');
				const delRequ = await fetch(
					'/api?type=' + current_page + '&product_id=' + relation.product._id,
					{
						method: 'DELETE'
					}
				);
				if (delRequ.ok && delRequ.status == 200) {
					push_not(
						(current_page == 'POSTED' ? 'Deleted ' : 'Removed ') +
							relation.product.name +
							(current_page == 'WISHLISTED' ? ' from your wishlist' : '') +
							' successfully!'
					);
					deleted_product_elements.push(relation.product._id);
					if (own_dom) own_dom.remove();
				} else {
					push_not(
						(current_page == 'POSTED' ? 'Could not delete ' : 'Could not remove ') +
							relation.product.name +
							(current_page == 'WISHLISTED' ? ' from your wishlist' : '') +
							'!'
					);
				}
				break;
			case 'BOUGHT':
				download();
				break;
			default:
				break;
		}
	}
	async function download() {
		if (!relation) return;
		const requestDownload = await fetch('/api?product_id=' + relation.product._id, {
			method: 'GET'
		});
		if (!requestDownload.ok || requestDownload.status != 200) {
			push_not('Could not download product!');
			return;
		}

		window.open(await requestDownload.text(), '_blank');
	}
</script>

{#if product_info}
	<div
		class="text-black absolute z-20 inset-0 m-auto h-max w-max grid bg-white backdrop-opacity-40 *:h-max *:w-max p-1 shadow-lg border-2"
		style="grid-template-columns: repeat(2, 1fr);"
	>
		{#each Object.keys(product_info).filter((pKey) => pKey != 'product_id') as product_info_type}
			<label for="name">{product_info_type.replace('_', ' ') + ':'}</label>
			<input
				bind:value={product_info[product_info_type as keyof EPInformation]}
				type="text"
				name="name"
			/>
		{/each}
		<button
			onclick={() => (product_info = undefined)}
			class="hover:opacity-75 justify-self-center cursor-default opacity-80 border-b-2 inline-flex select-none gap-2 text-lg items-center px-2 py-1 mt-3 text-white bg-red-500 active dark:bg-red-500"
			>Cancel</button
		>
		<button
			onclick={save_data}
			class="hover:opacity-75 justify-self-center cursor-default opacity-80 border-b-2 inline-flex select-none gap-2 text-lg items-center px-2 py-1 mt-3 text-white bg-green-500 active dark:bg-green-500"
			>Save</button
		>
	</div>
{/if}

{#if relation && (!current_page || relation.relationship_type == current_page) && !deleted_product_elements.includes(relation.product._id)}
	<div
		bind:this={own_dom}
		class="{current_page == 'POSTED'
			? 'bg-blue-500'
			: current_page == 'WISHLISTED'
				? 'bg-fuchsia-500'
				: current_page == 'BOUGHT'
					? 'bg-green-700'
					: 'bg-gray-900'} text-white rounded-lg flex items-center justify-between p-2 mx-2 shadow-lg my-1 {current_page &&
		!relation.product.deleted
			? 'hover:outline-4 hover:cursor-pointer'
			: ''} xl:w-2/3"
	>
		<a
			href={current_page && !relation.product.deleted ? '/' + relation.product._id : undefined}
			target={current_page && !relation.product.deleted ? '_blank' : '_self'}
			class="{!current_page
				? 'flex gap-2 items-center flex-wrap'
				: 'grid'} overflow-auto overflow-y-auto w-full"
		>
			{#if current_page == undefined}
				<span class="bg-gray-700 text-white p-1 rounded-md shadow-sm select-none"
					>{relation.relationship_type}</span
				>
			{/if}
			<div class="flex items-center justify-around w-max gap-2 min-w-max">
				<span class={relation.product.deleted ? 'opacity-50 line-through' : ''}
					>{relation.product.name}</span
				>
				{#if current_page}
					<span class="opacity-75 select-none"
						>for {relation.product.price}{relation.product.currency}</span
					>
				{/if}
			</div>
			<span class="opacity-75 md:text-sm text-xs min-w-max mx-2 select-none"
				>@ {relation.established_at}</span
			>
		</a>
		{#if current_page == 'POSTED' || current_page == 'WISHLISTED' || current_page == 'BOUGHT'}
			{#if current_page == 'POSTED'}
				<button
					onclick={() => operate_upon(current_page, true)}
					class="bg-green-800 rounded-md w-max p-[.3rem] cursor-pointer hover:scale-95 transition-all active:scale-90 shadow-md mr-1"
				>
					<img src="download.svg" class="w-5 invert" alt="" />
				</button>
				<button
					onclick={() => {
						if (!relation) return;
						open_product_editor({
							product_id: relation.product._id,
							name: relation.product.name,
							description: relation.product.description,
							price: relation.product.price,
							currency: relation.product.currency,
							wallet_address: relation.product.wallet_address,
							file_name: relation.product.file_name.split('/')[1]
						});
					}}
					class="bg-blue-800 rounded-md w-max p-[.3rem] cursor-pointer hover:scale-95 transition-all active:scale-90 shadow-md mr-1"
				>
					<img src="edit.svg" class="w-5 invert" alt="" />
				</button>
			{/if}
			<button
				onclick={() => operate_upon(current_page)}
				class="{current_page == 'POSTED'
					? 'bg-[#FC565E]'
					: current_page == 'WISHLISTED'
						? 'bg-gray-700'
						: 'bg-green-800'} rounded-md w-max p-[.3rem] cursor-pointer hover:scale-95 transition-all active:scale-90 shadow-md"
			>
				<img
					src="{current_page == 'POSTED'
						? 'delete'
						: current_page == 'WISHLISTED'
							? 'dewishlist'
							: 'download'}.svg"
					class="w-5 invert"
					alt=""
				/></button
			>
		{/if}
	</div>
{/if}
