<script lang="ts">
	import type { ProductPageObject } from '$lib/types/product.js';

    const { data } = $props();

    let is_user_products_loaded = $state(false);
    let user_product_objects: undefined | ProductPageObject[] = $state(undefined);
    const load_user_products = () => {
        //... load specific number if it exceeds specific number and include pagination logic
        is_user_products_loaded = true;
    }
</script>

{#if data.user.image}
    <img src={data.user.image} alt="">
{/if}

<h1>{data.user.name}</h1>