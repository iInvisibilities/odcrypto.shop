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

<div class="min-h-screen bg-gray-100 p-6 flex justify-center items-start Coinbase">
    <div class="w-full max-w-4xl bg-white rounded-lg shadow-md p-6 space-y-6">
      
      <!-- Profile Header -->
      <div class="flex items-center space-x-6">
        {#if data.user.image}
            <img class="w-20 h-20 rounded-full object-cover shadow-md" 
                src={data.user.image} 
                alt="User">
        {/if}
        <div>
          <h1 class="text-2xl font-bold text-gray-800">{data.user.name}</h1>
          <div class="mt-2 space-x-2">
            <button onclick={load_user_products} class="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md shadow text-sm">
              Load Products
            </button>
            <button onclick={e => change_page(false)} class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md shadow text-sm">
              Previous Page
            </button>
            <button onclick={e => change_page(true)} class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md shadow text-sm">
              Next Page
            </button>
          </div>
        </div>
      </div>
  
      <!-- Product List -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="product-list">
        {#if user_product_objects}
            {#each user_product_objects as product, index}
                <a href={"/" + data.products_of_user.at(index)} target="_blank" class="hover:bg-gray-200 flex items-center bg-gray-50 rounded-lg p-4 shadow-sm">
                    <div class="p-3 bg-indigo-100 rounded-full items-center max-w-16 max-h-16 flex justify-center overflow-clip">
                        <img class="object-fit max-w-16 max-h-16" src={product.icon_url} alt={product.name}>
                    </div>
                    <div class="ml-4 flex-grow">
                      <h3 class="font-semibold text-gray-800">{product.name}</h3>
                      <p class="text-gray-500 text-sm">{product.currency} {product.price}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-sm text-gray-400">Bought</p>
                      <p class="text-lg font-semibold text-blue-800">{product.bought_how_many_times}</p>
                    </div>
                </a>
            {/each}
        {/if}
    </div>
  
    </div>
</div>