<script lang="ts">
	import type { Relationship } from '$lib/types/object_relationships';
	import type { EPInformation, Product } from '$lib/types/product';
	import type { Wallet } from '$lib/types/wallet';

	let { rlp = $bindable(), current_page, push_not, deleted_object_elements } = $props();

	let relation: { rlp: Relationship; object: Product | Wallet | null } = $state(rlp);

	let product_info: EPInformation | undefined = $state();

	const open_product_editor = (prod_info: EPInformation) => {
		product_info = prod_info;
	};

	async function save_data(
		_event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }
	) {
		if (!relation || !relation.object || !product_info) return;

		//data.relations[edited_product_index] = Promise.resolve(edited_product);
		push_not("Updating product's information...");
		const response = await fetch('/dashboard/post', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ updated_info: product_info })
		});
		if (response.ok && response.status == 200) {
			push_not('Product information updated successfully!');

			if (relation.rlp.relationship_type != 'WALLET') {
				relation.object = relation.object as Product;

				relation.object.name = product_info.name;
				relation.object.description = product_info.description;
				relation.object.currency = product_info.currency;
				relation.object.price = product_info.price;
				relation.object.wallet_id = product_info.wallet_id;
				relation.object.icon_url = product_info.icon_url;
			}
		} else {
			push_not('Could not update product information!, ' + (await response.text()));
		}
		product_info = undefined;
	}

	let own_dom: HTMLDivElement | undefined = $state();

	async function operate_upon(current_page: string, force_download?: boolean) {
		if (!relation || !relation.object) return;

		if (force_download) {
			download();
			return;
		}
		switch (current_page) {
			case 'POSTED':
			case 'WISHLISTED':
				if (!confirm('Are you sure?')) break;
				push_not('Loading...');
				relation.object = relation.object as Product;
				const delRequ = await fetch(
					'/api?type=' + current_page + '&object_id=' + (relation.object._id?.toString() ?? ''),
					{
						method: 'DELETE'
					}
				);
				if (delRequ.ok && delRequ.status == 200) {
					push_not(
						(current_page == 'POSTED' ? 'Deleted ' : 'Removed ') +
							relation.object.name +
							(current_page == 'WISHLISTED' ? ' from your wishlist' : '') +
							' successfully!'
					);
					deleted_object_elements.push(relation.object._id);
					if (own_dom) own_dom.remove();
				} else {
					push_not(
						(current_page == 'POSTED' ? 'Could not delete ' : 'Could not remove ') +
							relation.object.name +
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
		if (!relation || !relation.object) return;
		const requestDownload = await fetch(
			'/api?product_id=' + (relation.object._id?.toString() ?? ''),
			{
				method: 'GET'
			}
		);
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
			{#if product_info_type == 'description'}
				<textarea
					bind:value={product_info[product_info_type as keyof EPInformation]}
					class="border-2 border-gray-500 rounded-md p-1"
				></textarea>
			{:else}
				<input
					bind:value={product_info[product_info_type as keyof EPInformation]}
					type={product_info_type == 'price' ? 'number' : 'text'}
					name="name"
					placeholder={product_info[product_info_type as keyof EPInformation] == undefined
						? 'Not set'
						: ''}
				/>
			{/if}
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

{#if relation.object && (!current_page || relation.rlp.relationship_type == current_page) && !deleted_object_elements.includes(relation.object._id)}
	{#if relation.rlp.relationship_type != 'WALLET'}
		<div
			bind:this={own_dom}
			class="{current_page == 'POSTED'
				? 'bg-blue-500'
				: current_page == 'WISHLISTED'
					? 'bg-fuchsia-500'
					: current_page == 'BOUGHT'
						? 'bg-green-700'
						: 'bg-gray-900'} text-white rounded-lg flex items-center justify-between p-2 mx-2 shadow-lg my-1 {current_page &&
			!(relation.object as Product).deleted
				? 'hover:outline-4 hover:cursor-pointer'
				: ''} xl:w-2/3"
		>
			<a
				href={current_page && !(relation.object as Product).deleted
					? '/' + (relation.object._id?.toString() ?? '')
					: undefined}
				target={current_page && !(relation.object as Product).deleted ? '_blank' : '_self'}
				class="{!current_page
					? 'flex gap-2 items-center flex-wrap'
					: 'grid'} overflow-auto overflow-y-auto w-full"
			>
				{#if current_page == undefined}
					<span class="bg-gray-700 text-white p-1 rounded-md shadow-sm select-none"
						>{relation.rlp.relationship_type}</span
					>
				{/if}
				<div class="flex items-center justify-around w-max gap-2 min-w-max">
					<span class={(relation.object as Product).deleted ? 'opacity-50 line-through' : ''}
						>{(relation.object as Product).name}</span
					>
					{#if current_page}
						<span class="opacity-75 select-none"
							>for {(relation.object as Product).price}{(relation.object as Product).currency}</span
						>
					{/if}
				</div>
				<span class="opacity-75 md:text-sm text-xs min-w-max mx-2 select-none"
					>@ {relation.rlp.established_at}</span
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
							if (!relation.object) return;
							open_product_editor({
								product_id: relation.object._id?.toString() ?? '',
								name: (relation.object as Product).name,
								description: (relation.object as Product).description,
								price: (relation.object as Product).price,
								currency: (relation.object as Product).currency,
								icon_url: (relation.object as Product).icon_url,
								wallet_id: (relation.object as Product).wallet_id
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
	{:else if relation.rlp.relationship_type == 'WALLET'}
		<div
			class="text-white xl:w-2/3 bg-gray-900 rounded-lg flex flex-wrap overflow-auto items-center justify-start gap-2 p-2 mx-2 shadow-lg my-1"
		>
			<span class="bg-gray-700 text-white p-1 rounded-md shadow-sm select-none"
				>{(relation.object as Wallet).type.toUpperCase()}{current_page == undefined
					? ' wallet linked'
					: ''}</span
			>
			<span>{(relation.object as Wallet).address}</span>
			<span class="opacity-75 md:text-sm text-xs min-w-max mx-2 select-none"
				>@ {relation.rlp.established_at}</span
			>
		</div>
	{/if}
{/if}
