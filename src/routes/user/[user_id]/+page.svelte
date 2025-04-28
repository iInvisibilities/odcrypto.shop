<script lang="ts">
	import type { ProductPageObject } from '$lib/types/product.js';

    const { data } = $props();

    let is_user_products_loaded = $state(false);
    let is_loading_user_products = $state(false);
    let user_product_objects: undefined | ProductPageObject[] = $state(undefined);
    let current_page = $state(0);


    const load_user_products = (page: number) => {
        is_loading_user_products = true;
        is_user_products_loaded = false;

        //... load specific number if it exceeds specific number and include pagination logic
        
        is_loading_user_products = false;
        is_user_products_loaded = true;
    }
</script>

{#if data.user.image}
    <img src={data.user.image} alt="">
{/if}

<h1>{data.user.name}</h1>