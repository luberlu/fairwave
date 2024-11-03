<!-- UserInfos.svelte -->
<script lang="ts">
    import { address } from '../lib/authStore';
</script>

<div>
    <p>Connecté en tant que : {$address}</p>
</div>