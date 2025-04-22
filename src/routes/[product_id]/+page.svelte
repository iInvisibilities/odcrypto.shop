<script lang="ts">
	import { SignIn } from "@auth/sveltekit/components";
	import type { PageProps } from "./$types";
    import { page } from '$app/state';
	import type { Report } from "$lib/types/reports";


    let { data }: PageProps = $props();

    let { product_id } = page.params;

    let hasWishlisted = $state(data.hasWishlisted ?? false);

    let push_not_el: HTMLElement;

	const push_not = (msg: string) => {
		push_not_el.style.animation = '';

		push_not_el.textContent = msg;
		push_not_el.style.animation = 'show_not';
		push_not_el.style.animationDuration = '5s';
		push_not_el.style.animationTimingFunction = 'ease-out';
		setTimeout(() => (push_not_el.style.animation = ''), 5000);
	};

	export const toggleWishlisted = async (event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement; }) => {
        if (hasWishlisted) {
            const delRequ = await fetch(
                '/api?type=WISHLISTED&object_id=' + product_id,
                {
                    method: 'DELETE'
                }
            );
            if (delRequ.ok && delRequ.status == 200) {
                push_not("Removed from wishlist!");
            } else {
                push_not(await delRequ.text());
                return;
            }
        }
		else {
            const addRequ = await fetch(
                '/api?object_id=' + product_id,
                {
                    method: 'POST'
                }
            );
            if (addRequ.ok && addRequ.status == 200) {
                push_not("Added to wishlist!");
            } else {
                push_not(await addRequ.text());
                return;
            }
        }

        hasWishlisted = !hasWishlisted;
	}

    export const download = async () => {
        if (data.isGuest) {
            push_not("Please login to download this product.");
            return;
        }
        if (data.hasBought || data.hasPosted) {
            const requestDownload = await fetch('/api?product_id=' + product_id, {
			method: 'GET'
		});
		if (!requestDownload.ok || requestDownload.status != 200) {
			push_not('Could not download product!');
			return;
		}

		window.open(await requestDownload.text(), '_blank');
        } else push_not("You need to purchase this product before downloading.");
    }


	export const reportProduct = async (event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement; }) => {
		const reason = prompt("Please enter a reason for reporting this product:");
        if (reason && reason.trim().length > 0) {
            const report: Report = {
                user_id: '',
                status: 'ACTIVE',
                created_at: new Date(Date.now()),
                object_id: product_id,
                reason: reason
            }
            
            const response = await fetch('/api/reports', {
                method: 'POST',
                body: JSON.stringify({ report })
            });
            if (response.ok) {
                push_not("Product reported successfully!");
            } else {
                push_not("Failed to report the product, " + (await response.text()));
            }
        }
        else {
            push_not("Please enter a valid reason.");
        }
	}
</script>

<div class="notification" contenteditable="false" bind:this={push_not_el}></div>
{#if data.isGuest}
    <a href="/" class="absolute z-10 top-2 left-2 flex items-center justify-center gap-2 w-max bg-gray-200 text-gray-700 px-4 py-2 rounded-md shadow-md hover:bg-gray-300 transition-all duration-150 ease-in-out active:scale-95">
        <img class="w-4 opacity-50" src="../left-arrow.svg" alt="">Home page
    </a>
    {:else}
    <button title="Report" class="absolute z-10 bottom-2 right-2 bg-orange-800 text-white p-0.5 px-2 rounded-md select-none cursor-pointer transition-all duration-100 ease-out active:scale-95 active:-skew-2 hover:scale-105 flex items-center gap-1" onclick={reportProduct}><img class="invert w-5" src="report.svg" alt="">Report this product</button>
{/if}
{#if data.hasPosted}
    {#if data.hasPosted}
        <div class="absolute w-full md:justify-between justify-center bg-blue-50 text-blue-700 px-4 py-2 shadow-md flex flex-wrap items-center">
            <h4 class="font-semibold text-md select-none italic opacity-75">This product has been posted by you</h4>
            <div class="flex">
                <a href="/dashboard" class="flex text-shadow-md/10 items-center gap-1 text-blue-600 text-xs px-2 py-1 rounded-md hover:bg-blue-100 transition-all duration-150 ease-in-out active:scale-95">
                    <img class="w-5 opacity-75" src="dashboard.svg" alt="">Dashboard
                </a>
                <a href="/dashboard/post" class="flex text-shadow-md/10 items-center gap-1 text-blue-600 text-xs px-2 py-1 rounded-md hover:bg-blue-100 transition-all duration-150 ease-in-out active:scale-95">
                    <img class="w-5 opacity-75" src="post-stamp.svg" alt="Plus">Post another product
                </a>
            </div>
        </div>
    {/if}
{/if}
<div class="p-5 h-dvh grid items-center justify-center">
    <div class="grid gap-3 w-full max-w-3xl border-2 shadow-lg/30 rounded-lg p-5 overflow-auto">
        <div class="flex items-start justify-start gap-5">
            {#if data.productObject.icon_url && data.productObject.icon_url !== ""}
                <img src={data.productObject.icon_url} class="w-32 h-32" alt="">
            {:else}
                <img src="default-product-icon.svg" class="w-32 h-32" alt="">
                
            {/if}
            <div class="flex flex-col gap-2">
                <div class="flex flex-wrap items-center justify-between w-full gap-4">
                    <h1 class="text-2xl font-bold w-72 max-w-72 text-wrap break-words text-shadow-lg/10">{data.productObject.name}</h1>
                    {#if !data.isGuest}
                        <div class="flex items-center gap-2">
                            <button title="Add to wishlist" class="{hasWishlisted ? 'bg-red-700' : 'bg-red-200'} w-5 h-5 heart-shape text-transparent select-none cursor-pointer transition-all duration-100 ease-out active:scale-95 active:-skew-2 hover:scale-105" onclick={toggleWishlisted}>_</button>
                        </div>
                    {/if}
                </div>
                <p class="text-gray-500">{data.productObject.description}</p>
                <div>
                    <p class="text-gray-700">Price: <span class="font-bold text-shadow-2xs">{data.productObject.price} {data.productObject.currency}</span></p>
                    <p class="text-gray-700">Bought {data.productObject.bought_how_many_times} times</p>
                </div>
            </div>
        </div>
        <div class="gap-2 place-self-end {(!data.isGuest ? "flex justify-end place-items-end items-end" : "grid")}">
            {#if !data.isGuest}
                {#if data.hasBought || data.hasPosted}
                    <button onclick={download} class="bg-green-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-green-700 transition-all duration-150 ease-in-out active:scale-95">
                        Download
                    </button>
                {:else}
                    <a href="?purchase=true" class="float-right bg-yellow-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-yellow-700 transition-all duration-150 ease-in-out active:scale-95">
                        Purchase
                    </a>
                {/if}
            {:else}
                <p class="text-red-500">Please login to purchase this product.</p>
                <div class="flex items-center gap-2">
                    <SignIn provider="coinbase" signInPage="user/signin">
                        <span class="coinbase_login_button" slot="submitButton">Sign In with Coinbase</span>
                    </SignIn>
                    <span class="select-none pointer-events-none opacity-65">or</span>
                    <SignIn provider="twitter" signInPage="user/signin">
                        <span class="twitter_login_button" slot="submitButton">Sign In with X</span>
                    </SignIn>
                </div>
            {/if}
        </div>
    </div>
</div>