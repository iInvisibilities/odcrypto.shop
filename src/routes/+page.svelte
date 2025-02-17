<script lang="ts">
	import { page } from '$app/state';
	import { SignIn, SignOut } from '@auth/sveltekit/components';
</script>

<div>
	<nav>
		<div>
			{#if !page.data.session}
				<SignIn provider="coinbase" signInPage="user/signin">
					<span class="coinbase_login_button" slot="submitButton">Sign In with Coinbase</span>
				</SignIn>
				<SignIn provider="twitter" signInPage="user/signin">
					<span class="twitter_login_button" slot="submitButton">Sign In with X</span>
				</SignIn>
			{:else}
				<SignOut signOutPage="user/signout">
					<span class="logout_button" slot="submitButton">Log Out</span>
				</SignOut>
			{/if}
		</div>
	</nav>
</div>
