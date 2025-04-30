<script lang="ts">
	import { PUBLIC_PRODUCTS_PER_PAGE } from '$env/static/public';
	import type { PublicProductObj } from '$lib/types/product.js';
	import { onMount } from 'svelte';

    const { data } = $props();
    const PRODUCTS_PER_PAGE = Number(PUBLIC_PRODUCTS_PER_PAGE);

    let is_user_products_loaded = $state(false);
    let is_loading_user_products = $state(false);
    let user_product_objects: undefined | PublicProductObj[] = $state(undefined);
    let current_page = $state(0);

    onMount(() => { if (data.products_of_user.length <= PRODUCTS_PER_PAGE) load_user_products(); })

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

    const change_page = async (is_forward: boolean) => {
        current_page+= is_forward ? 1 : -1;
        if (current_page < 0) current_page = 0;
        if (current_page > Math.floor(data.products_of_user.length / PRODUCTS_PER_PAGE)) current_page = Math.floor(data.products_of_user.length / PRODUCTS_PER_PAGE);
        await load_user_products();
    }
</script>

{#if data.user.image}
    <img src={data.user.image} alt="">
{/if}

<h1>{data.user.name}</h1>
<button onclick={load_user_products}>load products</button>
<button onclick={e => change_page(false)}>Back page</button>
<button onclick={e => change_page(true)}>Next page</button>
{#if user_product_objects}
    {#each user_product_objects as obj}
        <h1>{obj.name}</h1>
    {/each}
{/if}