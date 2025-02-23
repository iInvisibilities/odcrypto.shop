<script lang="ts">
	let files: FileList;
	let product_name: string, product_description: string, product_price_currency: string;
	let product_price: number;

	const requestSignedURL = async (file_name: string): Promise<string | null> => {
		const request = await fetch('/', {
			method: 'POST',
			body: JSON.stringify({ file_name })
		});

		return request.ok ? (await request.json())['signed_url'] : null;
	};

	const requestAndUploadToSignedURL = async () => {
		const file: File | null = files.item(0);
		if (!file) return;
		const file_name = file.name;
		const uploadURL = await requestSignedURL(file_name);
		if (!uploadURL) {
			// ERROR
			return;
		}

		const uploadOp = await fetch(uploadURL, {
			method: 'PUT',
			body: file
		});

		if (!uploadOp.ok) {
			//ERROR
		} else {
			// SUCCESS
		}
	};
</script>

<form>
	<input bind:value={product_name} type="text" />
	<textarea bind:value={product_description} name="" id=""></textarea>

	<input type="number" bind:value={product_price} />
	<input type="text" bind:value={product_price_currency} />

	<input bind:files type="file" />

	<button onclick={requestAndUploadToSignedURL}>Upload</button>
</form>
