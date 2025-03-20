<script lang="ts">
	import type { ProductPost } from '$lib/types/product';
	import type { SERWallet } from '$lib/types/wallet';
	import { onMount } from 'svelte';

	let files: FileList;
	let product_name: string,
		product_description: string,
		product_price_currency: string,
		wallet_id: string,
		icon_url: string;
	let product_price: number;

	let wallets: SERWallet[] = [];

	const requestSignedURL = async (file_name: string): Promise<string | null> => {
		const product: ProductPost = {
			name: product_name,
			description: product_description,
			price: product_price,
			currency: product_price_currency,
			wallet_id,
			icon_url,
			file_name
		};
		const request = await fetch('/dashboard/post', {
			method: 'POST',
			body: JSON.stringify({ object_type: 'PRODUCT', object: product }),
			headers: {
				'Content-Type': 'application/json'
			}
		});

		return request.ok ? (await request.json())['signed_url'] : null;
	};

	const requestAndUploadToSignedURL = async () => {
		const file: File | null = files.item(0);
		if (!file) return;
		const file_name = file.name;
		const signed_url = await requestSignedURL(file_name);

		if (!signed_url) {
			// ERROR
			return;
		}

		const uploadOp = await fetch(signed_url, {
			method: 'PUT',
			body: file
		});

		if (!uploadOp.ok) {
			//ERROR
		} else {
			// SUCCESS
		}
	};

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

<form>
	<input bind:value={product_name} type="text" />
	<textarea bind:value={product_description} name="" id=""></textarea>

	<input type="number" bind:value={product_price} />
	<input type="text" bind:value={product_price_currency} />
	<select bind:value={wallet_id}>
		{#each wallets as wallet, i}
			<option selected={i == 0 ? true : undefined} value={wallet._id}
				>({wallet.type}) {wallet.address}</option
			>
		{/each}
	</select>
	<input type="text" bind:value={icon_url} />

	<input bind:files type="file" />

	<button onclick={requestAndUploadToSignedURL}>Upload</button>
</form>
