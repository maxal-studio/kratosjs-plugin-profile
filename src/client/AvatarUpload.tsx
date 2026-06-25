import { useRef, useState } from 'react';
import { Camera, Loader2, Trash2, User } from 'lucide-react';
import { authenticatedFetch, cn, useTranslation } from '@maxal_studio/kratosjs-react';

interface AvatarUploadProps {
	value: string | null;
	previewUrl: string | null;
	onChange: (key: string | null, previewUrl: string | null) => void;
	apiBaseUrl?: string;
	disabled?: boolean;
}

const fileToBase64 = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve((reader.result as string).split(',')[1]);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});

export function AvatarUpload({ value, previewUrl, onChange, apiBaseUrl, disabled }: AvatarUploadProps) {
	const { t } = useTranslation();
	const inputRef = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleFile = async (file: File) => {
		if (!apiBaseUrl || !file.type.startsWith('image/')) {
			setError(t('profile:validation.image_required'));
			return;
		}

		setUploading(true);
		setError(null);
		const blobUrl = URL.createObjectURL(file);

		try {
			const base64 = await fileToBase64(file);
			const response = await authenticatedFetch(
				`${apiBaseUrl}/media/upload`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						file: base64,
						filename: file.name,
						contentType: file.type,
						fieldName: 'profileMediaImage',
						isArray: false,
					}),
				},
				apiBaseUrl,
			);

			if (!response.ok) {
				const err = await response.json().catch(() => ({}));
				throw new Error(err.message || err.error || t('profile:validation.image_required'));
			}

			const result = await response.json();
			const key = result.data?.key;
			const url = result.data?.url || blobUrl;
			if (!key) throw new Error(t('profile:validation.upload_failed'));

			onChange(key, url);
		} catch (err: any) {
			URL.revokeObjectURL(blobUrl);
			setError(err.message || t('profile:validation.upload_failed'));
		} finally {
			setUploading(false);
		}
	};

	const handleRemove = () => {
		onChange(null, null);
		setError(null);
		if (inputRef.current) inputRef.current.value = '';
	};

	return (
		<div className="flex flex-col sm:flex-row sm:items-center gap-4">
			<div className="relative shrink-0">
				<div
					className={cn(
						'h-24 w-24 rounded-full border-2 border-border overflow-hidden bg-muted flex items-center justify-center',
						disabled && 'opacity-60',
					)}>
					{uploading ? (
						<Loader2 className="h-8 w-8 animate-spin text-fg-muted" />
					) : previewUrl ? (
						<img src={previewUrl} alt="" className="h-full w-full object-cover" />
					) : (
						<User className="h-10 w-10 text-fg-muted" />
					)}
				</div>
				{!disabled && !uploading && (
					<button
						type="button"
						onClick={() => inputRef.current?.click()}
						className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-accent text-accent-fg shadow-soft-sm hover:bg-accent-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						aria-label={t('profile:form.update_profile.upload.profile_photo.upload')}>
						<Camera className="h-4 w-4" />
					</button>
				)}
				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					className="sr-only"
					disabled={disabled || uploading}
					onChange={e => {
						const file = e.target.files?.[0];
						if (file) handleFile(file);
					}}
				/>
			</div>

			<div className="min-w-0 flex-1 space-y-2">
				<div>
					<p className="text-sm font-medium text-fg">
						{t('profile:form.update_profile.upload.profile_photo.title')}
					</p>
					<p className="text-xs text-fg-secondary mt-0.5">
						{t('profile:form.update_profile.upload.profile_photo.description')}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						disabled={disabled || uploading}
						onClick={() => inputRef.current?.click()}
						className="text-sm font-medium text-accent hover:text-accent-hover disabled:opacity-60">
						{t('profile:form.update_profile.upload.profile_photo.upload')}
					</button>
					{(previewUrl || value) && (
						<button
							type="button"
							disabled={disabled || uploading}
							onClick={handleRemove}
							className="inline-flex items-center gap-1 text-sm font-medium text-fg-secondary hover:text-danger disabled:opacity-60">
							<Trash2 className="h-3.5 w-3.5" />
							{t('profile:form.update_profile.upload.profile_photo.remove')}
						</button>
					)}
				</div>
				{error && <p className="text-xs text-danger">{error}</p>}
			</div>
		</div>
	);
}
