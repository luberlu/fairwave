<!-- UserInfos.svelte -->
<script lang="ts">
    import { address } from '../lib/user/UserStore';
</script>

<div>
    <p>Connecté en tant que : {$address}</p>
</div>
