<script lang="ts">
	let {
		relation = $bindable(),
		current_page = $bindable(),
		push_not = $bindable(),
		deleted_product_elements = $bindable(),
		open_product_editor = $bindable()
	} = $props();
	/*export let current_page: string | undefined;
	export let push_not: Function;
	export let deleted_product_elements: string[];
	export let open_product_editor: (info: EPInformation) => void;*/

	//export let product_info: EPInformation | undefined;

	let own_dom: HTMLDivElement;

	async function operate_upon(current_page: string, force_download?: boolean) {
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
					own_dom.remove();
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
				onclick={() =>
					open_product_editor({
						product_id: relation.product._id,
						name: relation.product.name,
						description: relation.product.description,
						price: relation.product.price,
						currency: relation.product.currency,
						wallet_address: relation.product.wallet_address,
						file_name: relation.product.file_name.split('/')[1]
					})}
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
