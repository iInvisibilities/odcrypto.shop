<script lang="ts">
	import { goto } from '$app/navigation';
	import type { ProductPost } from '$lib/types/product';
	import type { SERWallet } from '$lib/types/wallet';
	import { onMount } from 'svelte';

	let files: FileList | undefined = $state();
	let product_name: string = $state(''),
		product_description: string = $state(''),
		product_price_currency: string = $state(''),
		wallet_id: string = $state(''),
		icon_url: string | undefined = $state();
	let product_price: number = $state(0);

	let wallets: SERWallet[] = $state([]);

	let push_not_el: HTMLElement;

	const push_not = (msg: string) => {
		push_not_el.textContent = msg;
		push_not_el.style.animation = 'show_not';
		push_not_el.style.animationDuration = '5s';
		push_not_el.style.animationTimingFunction = 'ease-out';
		setTimeout(() => (push_not_el.style.animation = ''), 5000);
	};

	const requestSignedURL = async (
		file_name: string
	): Promise<{ status: boolean; value: string }> => {
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

		const value = request.ok ? (await request.json())['signed_url'] : await request.text();
		return { status: request.ok, value };
	};

	const requestAndUploadToSignedURL = async () => {
		if (!files) {
			push_not("You didn't select a file to upload.");
			return;
		}

		const file: File | null = files.item(0);
		if (!file) {
			push_not("You didn't select a file to upload.");
			return;
		}
		const file_name = file.name;
		const signed_url: { status: boolean; value: string } = await requestSignedURL(file_name);

		if (signed_url.status === false) {
			push_not('Could not upload your product, ' + signed_url.value);
			return;
		}

		const uploadOp = await fetch(signed_url.value, {
			method: 'PUT',
			body: file
		});

		if (!uploadOp.ok) {
			push_not('Could not upload your product, please try again later.');
		} else {
			push_not('Product uploaded successfully!');
			goto('/dashboard');
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

<div class="notification" contenteditable="false" bind:this={push_not_el}></div>
<div class="w-dvw h-dvh grid items-center bg-gray-800">
	<div class="p-6 text-medium text-gray-500 dark:text-gray-400 mx-auto xl:w-1/2 min-w-min">
		<h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Post a New Product</h3>
		<form
			class="bg-[rgba(0,80,254,0.43)] p-4 rounded-md shadow-md grid grid-cols-1 md:grid-cols-2 gap-4"
		>
			<div class="mb-2">
				<label class="block text-white mb-2" for="product_name">Product Name</label>
				<input
					bind:value={product_name}
					placeholder="Life Elixir"
					type="text"
					id="product_name"
					class="w-full p-2 rounded-md border border-gray-300 bg-gray-800"
				/>
			</div>
			<div class="mb-2">
				<label class="block text-white mb-2" for="product_description">Product Description</label>
				<textarea
					bind:value={product_description}
					id="product_description"
					placeholder="Exciting new life elixir just dropped don't miss the chance to pay up!!!"
					class="w-full p-2 rounded-md border border-gray-300 bg-gray-800"
				></textarea>
			</div>
			<div class="mb-2">
				<label class="block text-white mb-2" for="product_price">Product Price</label>
				<input
					type="number"
					bind:value={product_price}
					id="product_price"
					class="w-full p-2 rounded-md border border-gray-300 bg-gray-800"
				/>
			</div>
			<div class="mb-2">
				<label class="block text-white mb-2" for="product_price_currency">Currency</label>
				<input
					type="text"
					bind:value={product_price_currency}
					id="product_price_currency"
					placeholder="TND, USD, EUR, etc..."
					class="w-full p-2 rounded-md border border-gray-300 bg-gray-800"
				/>
			</div>
			<div class="mb-2">
				<label class="block text-white mb-2" for="wallet_id">Select Crypto Wallet</label>
				<select
					bind:value={wallet_id}
					id="wallet_id"
					class="w-full p-2 rounded-md border border-gray-300 bg-gray-800"
				>
					<option value="" disabled>Select crypto wallet</option>
					{#each wallets as wallet, i}
						<option selected={i == 0 ? true : undefined} value={wallet._id}>
							({wallet.type}) {wallet.address}
						</option>
					{/each}
				</select>
			</div>
			<div class="mb-2">
				<label class="block text-white mb-2" for="icon_url">Icon URL</label>
				<input
					type="text"
					bind:value={icon_url}
					id="icon_url"
					placeholder="https://example.com/icon.png"
					class="w-full p-2 rounded-md border border-gray-300 bg-gray-800"
				/>
			</div>
			<div class="mb-2">
				<label class="block text-white mb-2" for="file">Upload File</label>
				<input
					bind:files
					type="file"
					id="file"
					class="w-full p-2 rounded-md border border-gray-300 bg-gray-800"
				/>
			</div>
			<div class="col-span-full">
				<button
					type="button"
					onclick={requestAndUploadToSignedURL}
					class="bg-green-600 text-white p-2 rounded-md shadow-md hover:shadow-lg hover:scale-95 transition-all active:scale-90 w-full"
				>
					Upload
				</button>
			</div>
		</form>
	</div>
</div>
