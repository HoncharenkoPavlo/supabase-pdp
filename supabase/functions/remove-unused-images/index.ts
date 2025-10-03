// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { createClient } from "https://esm.sh/@supabase/supabase-js";
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const supabase = createClient(
	Deno.env.get('SUPABASE_URL')!,
	Deno.env.get('SUPABASE_ANON_KEY')!
);

Deno.serve(async (req) => {
	const { data: storageObjects, error: storageError } = await supabase.storage
		.from('avatars')
		.list(''); // List all objects in the bucket

	if (storageError) {
		req.respond({ status: 500, body: JSON.stringify(storageError) });
		return;
	}

	const { data: profiles, error: profilesError } = await supabase
		.from('profiles')
		.select('avatar_url');

	if (profilesError) {
		req.respond({ status: 500, body: JSON.stringify(profilesError) });
		return;
	}

	const usedImages = new Set<string>();
	profiles?.forEach((profile) => {
		if (profile.avatar_url) {
			usedImages.add(profile.avatar_url);
		}
	});

	const unusedImages = storageObjects?.filter(
		(object) => !usedImages.has(object.name)
	);

	if (unusedImages?.length) {
		const { error: deleteError } = await supabase.storage
			.from('avatars')
			.remove(unusedImages.map((image) => image.name));

		if (deleteError) {
			req.respond({ status: 500, body: JSON.stringify(deleteError) });
			return;
		}
	}
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/remove-unused-images' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
