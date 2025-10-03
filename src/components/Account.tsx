import { useState, useEffect, FC } from 'react';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Avatar } from './Avatar';

export const Account: FC<{
	session: Session;
	setSession: React.Dispatch<React.SetStateAction<Session | null>>;
}> = ({ session, setSession }) => {
	const [loading, setLoading] = useState<boolean>(true);
	const [username, setUsername] = useState<string | null>(null);
	const [website, setWebsite] = useState<string | null>(null);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

	useEffect(() => {
		let ignore = false;
		async function getProfile() {
			setLoading(true);
			const { user } = session;

			const { data, error } = await supabase
				.from('profiles')
				.select(`username, website, avatar_url`)
				.eq('id', user.id)
				.single();

			if (!ignore) {
				if (error) {
					console.warn(error);
				} else if (data) {
					setUsername(data.username);
					setWebsite(data.website);
					setAvatarUrl(data.avatar_url);
				}
			}

			setLoading(false);
		}

		getProfile();

		return () => {
			ignore = true;
		};
	}, [session]);

	const updateProfile = async (
		event: React.FormEvent,
		avatarUrl: string | null
	) => {
		event.preventDefault();

		setLoading(true);
		const { user } = session;

		const updates = {
			id: user.id,
			username,
			website,
			avatar_url: avatarUrl,
			updated_at: new Date(),
		};

		const { error } = await supabase.from('profiles').upsert(updates);

		if (error) {
			alert(error.message);
		} else {
			setAvatarUrl(avatarUrl);
		}
		setLoading(false);
	};

	const removeAccount = async () => {
		const res = await supabase
			.from('profiles')
			.delete()
			.eq('id', session.user.id);

		if (res.error) {
			alert(res.error.message);
		}

		setSession(null);
	};

	return (
		<form onSubmit={(e) => updateProfile(e, avatarUrl)} className='form-widget'>
			<Avatar
				userId={session.user.id}
				url={avatarUrl}
				size={150}
				onUpload={(event, url) => {
					updateProfile(event, url);
				}}
			/>

			<div>
				<label htmlFor='email'>Email</label>
				<input id='email' type='text' value={session.user.email} disabled />
			</div>
			<div>
				<label htmlFor='username'>Name</label>
				<input
					id='username'
					type='text'
					required
					value={username || ''}
					onChange={(e) => setUsername(e.target.value)}
				/>
			</div>
			<div>
				<label htmlFor='website'>Website</label>
				<input
					id='website'
					type='url'
					value={website || ''}
					onChange={(e) => setWebsite(e.target.value)}
				/>
			</div>

			<div>
				<button
					className='button block primary'
					type='submit'
					disabled={loading}
				>
					{loading ? 'Loading ...' : 'Update'}
				</button>
			</div>

			<div>
				<button
					className='button block'
					type='button'
					onClick={() => supabase.auth.signOut()}
				>
					Sign Out
				</button>
			</div>

			<div>
				<button className='button block' type='button' onClick={removeAccount}>
					Remove Account
				</button>
			</div>

			<div>
				<button
					className='button block'
					type='button'
					onClick={async () => {
						const res = await supabase.functions.invoke('remove-unused-images');

						console.log(res);
					}}
				>
					Remove Unused Images
				</button>
			</div>
		</form>
	);
};
