import { url } from 'inspector';
import { FC, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

type Props = {
	userId: string;
	url?: string | null;
	size: number;
	onUpload: (event: React.FormEvent, filePath: string) => void;
};

export const Avatar: FC<Props> = ({ url, size, onUpload, userId }) => {
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [uploading, setUploading] = useState<boolean>(false);

	useEffect(() => {
		if (url) downloadImage(url);
	}, [url]);

	const downloadImage = async (path: string) => {
		try {
			const { data, error } = await supabase.storage
				.from('avatars')
				.download(path);
			if (error) {
				throw error;
			}
			const url = URL.createObjectURL(data);
			setAvatarUrl(url);
		} catch (error) {
			console.log('Error downloading image: ', error);
		}
	};

	const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
		try {
			setUploading(true);

			if (!event.target.files || event.target.files.length === 0) {
				throw new Error('You must select an image to upload.');
			}

			const file = event.target.files[0];
			const fileExt = file.name.split('.').pop();
			const fileName = `${Math.random()}.${fileExt}`;
			const filePath = fileName;

			const { error: uploadError } = await supabase.storage
				.from('avatars')
				.upload(filePath, file);

			if (uploadError) {
				throw uploadError;
			}

			onUpload(event, filePath);
		} catch (error) {
			alert((error as Error).message);
		} finally {
			setUploading(false);
		}
	};

	const resetAvatar = async () => {
		if (!avatarUrl) {
			return;
		}

		try {
			setUploading(true);
			const { error: deleteError } = await supabase
				.from('profiles')
				.update({
					avatar_url: null,
				})
				.eq('id', userId);

			if (deleteError) {
				throw deleteError;
			}

			setAvatarUrl(null);
		} catch (error) {
			alert((error as Error).message);
		} finally {
			setUploading(false);
		}
	};

	return (
		<div
			style={{
				width: 150,
				alignSelf: 'center',
				flexDirection: 'column',
				alignItems: 'center',
			}}
		>
			{avatarUrl ? (
				<img
					src={avatarUrl}
					alt='Avatar'
					className='avatar image'
					style={{ height: size, width: size }}
				/>
			) : (
				<div
					className='avatar no-image'
					style={{ height: size, width: size }}
				/>
			)}
			<div style={{ width: size }}>
				<label className='button primary block' htmlFor='single'>
					{uploading ? 'Uploading ...' : 'Upload'}
				</label>
				<input
					style={{
						visibility: 'hidden',
						position: 'absolute',
					}}
					type='file'
					id='single'
					accept='image/*'
					onChange={uploadAvatar}
					disabled={uploading}
				/>
			</div>
			<div style={{ width: size }}>
				<button
					className='button secondary block'
					onClick={resetAvatar}
					disabled={uploading}
				>
					{uploading ? 'Resetting ...' : 'Reset'}
				</button>
			</div>
		</div>
	);
};
