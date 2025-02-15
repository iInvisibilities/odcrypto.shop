<script lang="ts">
	import { page } from '$app/state';
	import { SignIn, SignOut } from '@auth/sveltekit/components';
</script>

<div>
	<nav>
		<div>
			{#if !page.data.session}
				<SignIn provider="coinbase">
					<span class="coinbase_login_button" slot="submitButton">Sign In with Coinbase</span>
				</SignIn>
			{:else}
				<SignOut>
					<span class="logout_button" slot="submitButton">Log Out</span>
				</SignOut>
			{/if}
		</div>
	</nav>
</div>
