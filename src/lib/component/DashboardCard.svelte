<script lang="ts">
	import type { fProduct, RelationshipType } from '$lib/types/product';

	export let relation: {
		product_id?: string;
		product: fProduct;
		relationship_type: RelationshipType;
		established_at: Date;
	};
	export let current_page: string | undefined;

	function delete_operation(current_page: string) {
		switch (current_page) {
			case 'POSTED':
				// DELETE PRODUCT AND POST RELATIONSHIP AND BUCKET OBJECT FROM THE LOCAL API WHICH SHOULD BE IMPLEMENTED at DELETE at /api
				break;
			case 'WISHLISTED':
				// DELETE WISHLISTED RELATIONSHIP, CURRENT PAGE SHOULD BE PASSED AS A PARAMETER TO THE /api DELETE PATH and checked upon there instead of this check
				break;
			default:
				break;
		}
	}
</script>

<div
	class="{current_page == 'POSTED'
		? 'bg-blue-500'
		: current_page == 'WISHLISTED'
			? 'bg-fuchsia-500'
			: current_page == 'BOUGHT'
				? 'bg-green-700'
				: 'bg-gray-900'} text-white rounded-lg flex items-center justify-between p-2 mx-2 shadow-lg my-1"
>
	<div
		class="{current_page == undefined
			? 'flex gap-2 items-center flex-wrap'
			: 'grid'} overflow-auto overflow-y-auto"
	>
		{#if current_page == undefined}
			<span class="bg-gray-700 text-white p-1 rounded-md">{relation.relationship_type}</span>
		{/if}
		<div class="flex items-center justify-around w-max gap-2 min-w-max">
			<span>{relation.product.name}</span>
			{#if current_page}
				<span class="opacity-75 select-none"
					>for {relation.product.price}{relation.product.currency}</span
				>
			{/if}
		</div>
		<span class="opacity-75 md:text-sm text-xs min-w-max mx-2 select-none"
			>@ {relation.established_at}</span
		>
	</div>
	{#if current_page == 'POSTED' || current_page == 'WISHLISTED'}
		<button
			onclick={() => {
				if (confirm('Are you sure?')) delete_operation(current_page);
			}}
			class="{current_page == 'POSTED'
				? 'bg-[#FC565E]'
				: 'bg-gray-700'} rounded-md w-max p-[.3rem] cursor-pointer hover:scale-95 transition-all active:scale-90 shadow-md"
			><img
				src="{current_page == 'POSTED' ? 'delete' : 'dewishlist'}.svg"
				class="w-5 invert"
				alt=""
			/></button
		>
	{/if}
</div>
