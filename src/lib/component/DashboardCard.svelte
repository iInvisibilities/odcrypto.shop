<script lang="ts">
	import type { RelationshipType } from '$lib/types/product';

	export let relation: {
		product_id: string;
		relationship_type: RelationshipType;
		established_at: Date;
	};
</script>

<div>
	<h1>{relation.product_id} @ {relation.established_at}</h1>
</div>
