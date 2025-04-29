<script lang="ts">
	import type { PublicProductObj } from '$lib/types/product.js';

    const { data } = $props();

    let is_user_products_loaded = $state(false);
    let is_loading_user_products = $state(false);
    let user_product_objects: undefined | PublicProductObj[] = $state(undefined);
    let current_page = $state(0);

    const load_user_products = async () => {
        is_loading_user_products = true;
        is_user_products_loaded = false;

        const products = await fetch("/api/products?page=" + current_page, 
            { method: "POST", body: JSON.stringify({ products_of_user: data.products_of_user }) });
        const { result }: { result: PublicProductObj[] } = await products.json();
        user_product_objects = result;
        
        is_loading_user_products = false;
        is_user_products_loaded = true;
    }
</script>

{#if data.user.image}
    <img src={data.user.image} alt="">
{/if}

<h1>{data.user.name}</h1>
<button onclick={load_user_products}>load products</button>
{#if user_product_objects}
    {#each user_product_objects as obj}
        <h1>{obj.name}</h1>
    {/each}
{/if}