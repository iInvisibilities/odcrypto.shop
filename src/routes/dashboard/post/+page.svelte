<script lang="ts">
	import { goto } from '$app/navigation';
	import type { ProductPost } from '$lib/types/product';
	import type { SERWallet } from '$lib/types/wallet';

	const { data } = $props();
	const user_wallets = data.user_wallets as SERWallet[];

	let files: FileList | undefined = $state();
	let product_name: string = $state(''),
		product_description: string = $state(''),
		product_price_currency: string = $state(''),
		wallet_id: string = $state(''),
		icon_input: HTMLInputElement | undefined = $state();
	let product_price: number = $state(0);

	let push_not_el: HTMLElement;

	let icon_upload_type: "file" | "url" = $state('url');

	const push_not = (msg: string) => {
		push_not_el.style.animation = '';

		push_not_el.textContent = msg;
		push_not_el.style.animation = 'show_not';
		push_not_el.style.animationDuration = '5s';
		push_not_el.style.animationTimingFunction = 'ease-out';
		setTimeout(() => (push_not_el.style.animation = ''), 5000);
	};

	const requestSignedURL = async (
		file_name: string
	): Promise<{ status: boolean; value: string }> => {
		if (icon_input == undefined) return { status: false, value: 'Icon input is not defined.' };
		let icon_url: string = '';

		if(icon_upload_type == "file") {
			icon_input = icon_input as HTMLInputElement;
			const icon_file: File | null | undefined = icon_input.files?.item(0);

			if (icon_input.files && icon_file) {
				push_not("Uploading icon file...");
				
				const request = await fetch('/dashboard/post', {
					method: 'POST',
					body: JSON.stringify({ object_type: 'ICON', object: { file_name: icon_file.name } }),
					headers: {
						'Content-Type': 'application/json'
					}
				});
				if (!request.ok) return { status: false, value: await request.text() };

				const response = await request.json();
				const value = response['signed_url'];

				const uploadOp = await fetch(value, {
					method: 'PUT',
					body: icon_file
				});
				if (!uploadOp.ok) return { status: false, value: 'Could not upload icon file.' }
				
				push_not("Icon file uploaded successfully!");
				icon_url = response['new_file_name'];
			}
		}
		else icon_url = icon_input.value;

		const product: ProductPost = {
			name: product_name,
			description: product_description,
			price: product_price,
			currency: product_price_currency.toUpperCase(),
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

</script>

<div class="notification" contenteditable="false" bind:this={push_not_el}></div>
<a class="z-10 absolute top-0 left-0 md:top-4 md:left-4 flex items-center justify-center gap-2 w-max bg-gray-200 text-gray-700 px-4 py-2 md:rounded-md shadow-md hover:bg-gray-300 transition-all duration-150 ease-in-out active:scale-95 opacity-75" href="/dashboard"><img class="w-8 opacity-50" src="../left-arrow.svg" alt="">Dashboard</a>
<div class="w-dvw h-dvh grid items-center bg-gray-800">
	<div class="p-6 text-medium text-gray-500 dark:text-gray-400 mx-auto xl:w-1/2 min-w-min">
		<h3 class="hidden md:block text-lg font-bold text-gray-900 dark:text-white mb-4">Post a New Product</h3>
		<form
			class="bg-gray-900 p-4 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 gap-4"
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
					class="w-full p-2 uppercase rounded-md border border-gray-300 bg-gray-800"
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
					{#each user_wallets as wallet, i}
						<option selected={i == 0 ? true : undefined} value={wallet._id}>
							({wallet.type}) {wallet.address}
						</option>
					{/each}
				</select>
			</div>
			<div class="mb-2">
				<div class="flex items-center gap-2 mb-2">
					<label class="block text-white" for="icon_url">Icon</label>
					<select class="bg-transparent rounded-md text-white *:text-black" bind:value={icon_upload_type}>
						<option value="url">URL</option>
						<option value="file">File</option>
					</select> <span class="opacity-75 self-end text-sm pointer-events-none select-none">(optional)</span>
				</div>
				<input
					type={icon_upload_type === 'url' ? 'url' : 'file'}
					bind:this={icon_input}
					id="icon_url"
					accept={icon_upload_type === 'file' ? 'image/*' : ''}
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
					class="bg-green-600 cursor-pointer w-max px-2 float-right text-white p-2 rounded-md shadow-md hover:shadow-lg hover:scale-95 transition-all active:scale-90"
				>
					Upload
				</button>
			</div>
		</form>
	</div>
</div>
