import React, { useCallback, useEffect, useState } from 'react';
import { Lock, User } from 'lucide-react';
import {
	authenticatedFetch,
	Button,
	Card,
	cn,
	CustomBlockComponentProps,
	ErrorAlert,
	Input,
	Label,
	Spinner,
	useToast,
	useTranslation,
} from '@maxal_studio/kratosjs-react';
import { AvatarUpload } from './AvatarUpload';
import type { PasswordFormState, ProfileData, ProfileFormState, ProfileTab } from './types';

function profileToFormState(data: ProfileData): ProfileFormState {
	const media = data.profileMediaImage ?? null;
	return {
		firstname: data.firstname ?? '',
		lastname: data.lastname ?? '',
		email: data.email ?? '',
		phone: data.phone ?? '',
		profileMediaImage: media,
		pendingImageKey: null,
		avatarUrl: media?.url ?? null,
	};
}

function emptyPasswordState(): PasswordFormState {
	return { newPassword: '', confirmPassword: '' };
}

export default function ProfileEditorBlock({ apiBaseUrl }: CustomBlockComponentProps) {
	const toast = useToast();
	const { t } = useTranslation();
	const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
	const [loading, setLoading] = useState(true);
	const [savingProfile, setSavingProfile] = useState(false);
	const [savingPassword, setSavingPassword] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [profileForm, setProfileForm] = useState<ProfileFormState | null>(null);
	const [savedProfileSnapshot, setSavedProfileSnapshot] = useState('');
	const [passwordForm, setPasswordForm] = useState<PasswordFormState>(emptyPasswordState);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	const isProfileDirty = profileForm ? JSON.stringify(profileForm) !== savedProfileSnapshot : false;

	const loadProfile = useCallback(async () => {
		if (!apiBaseUrl) return;
		setLoading(true);
		setError(null);
		try {
			const response = await authenticatedFetch(`${apiBaseUrl}/profile`, {}, apiBaseUrl);
			const result = await response.json();
			if (!response.ok) {
				throw new Error(result.error || result.message || 'Failed to load profile');
			}
			const data = result.data as ProfileData;
			const form = profileToFormState(data);
			setProfileForm(form);
			setSavedProfileSnapshot(JSON.stringify(form));
		} catch (err: any) {
			setError(err.message || 'Failed to load profile');
		} finally {
			setLoading(false);
		}
	}, [apiBaseUrl]);

	useEffect(() => {
		loadProfile();
	}, [loadProfile]);

	const updateProfileField = <K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) => {
		setProfileForm(prev => (prev ? { ...prev, [key]: value } : prev));
		setFieldErrors(prev => {
			const next = { ...prev };
			delete next[key as string];
			return next;
		});
	};

	const validateProfile = (): boolean => {
		if (!profileForm) return false;
		const errors: Record<string, string> = {};
		if (!profileForm.firstname.trim()) errors.firstname = t('profile:profile:validation.firstname_required');
		if (!profileForm.email.trim()) errors.email = t('profile:profile:validation.email_required');
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
			errors.email = t('profile:profile:validation.email_invalid');
		}
		setFieldErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSaveProfile = async () => {
		if (!apiBaseUrl || !profileForm || !validateProfile()) return;
		setSavingProfile(true);
		setError(null);
		try {
			const body: Record<string, unknown> = {
				firstname: profileForm.firstname.trim(),
				lastname: profileForm.lastname.trim() || undefined,
				email: profileForm.email.trim(),
				phone: profileForm.phone.trim() || undefined,
			};

			if (profileForm.pendingImageKey) {
				body.profileMediaImage = profileForm.pendingImageKey;
			} else if (!profileForm.avatarUrl && !profileForm.profileMediaImage) {
				body.profileMediaImage = null;
			} else if (profileForm.profileMediaImage?.key && !profileForm.pendingImageKey) {
				body.profileMediaImage = profileForm.profileMediaImage.key;
			}

			const response = await authenticatedFetch(
				`${apiBaseUrl}/profile/update`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body),
				},
				apiBaseUrl,
			);
			const result = await response.json();
			if (!response.ok) {
				throw new Error(result.error || result.message || 'Failed to update profile');
			}

			await loadProfile();
			toast.success(t('profile:profile_update_success'));
		} catch (err: any) {
			setError(err.message || 'Failed to update profile');
		} finally {
			setSavingProfile(false);
		}
	};

	const validatePassword = (): boolean => {
		const errors: Record<string, string> = {};
		if (!passwordForm.newPassword) errors.newPassword = t('profile:validation.password_required');
		else if (passwordForm.newPassword.length < 8) {
			errors.newPassword = t('profile:validation.password_length');
		}
		if (!passwordForm.confirmPassword) errors.confirmPassword = t('profile:validation.confirm_password_required');
		else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			errors.confirmPassword = t('profile:validation.password_mismatch');
		}
		setFieldErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSavePassword = async () => {
		if (!apiBaseUrl || !validatePassword()) return;
		setSavingPassword(true);
		setError(null);
		try {
			const response = await authenticatedFetch(
				`${apiBaseUrl}/profile/change-password`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						newPassword: passwordForm.newPassword,
						confirmPassword: passwordForm.confirmPassword,
					}),
				},
				apiBaseUrl,
			);
			const result = await response.json();
			if (!response.ok) {
				throw new Error(result.error || result.message || 'Failed to change password');
			}
			setPasswordForm(emptyPasswordState());
			setFieldErrors({});
			toast.success(t('profile:password_update_success'));
		} catch (err: any) {
			toast.error(err.message || t('profile:password_update_failed'));
		} finally {
			setSavingPassword(false);
		}
	};

	const handleAvatarChange = (key: string | null, previewUrl: string | null) => {
		setProfileForm(prev => {
			if (!prev) return prev;
			return {
				...prev,
				pendingImageKey: key,
				avatarUrl: previewUrl,
				profileMediaImage: key ? { key, url: previewUrl ?? undefined } : null,
			};
		});
	};

	if (loading || !profileForm) {
		return (
			<div className="flex items-center justify-center min-h-[320px]">
				<Spinner size="lg" />
			</div>
		);
	}

	const tabs: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
		{ id: 'profile', label: t('profile:tab.profile'), icon: <User className="h-4 w-4" /> },
		{ id: 'security', label: t('profile:tab.security'), icon: <Lock className="h-4 w-4" /> },
	];

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			{error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

			{/* Tab navigation */}
			<div className="inline-flex rounded-lg border border-border bg-input p-0.5">
				{tabs.map(tab => (
					<button
						key={tab.id}
						type="button"
						onClick={() => {
							setActiveTab(tab.id);
							setFieldErrors({});
							setError(null);
						}}
						className={cn(
							'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
							activeTab === tab.id
								? 'bg-accent text-accent-fg shadow-soft-sm'
								: 'text-fg-secondary hover:text-fg hover:bg-hover',
						)}>
						{tab.icon}
						{tab.label}
					</button>
				))}
			</div>

			{/* Profile tab */}
			{activeTab === 'profile' && (
				<Card>
					<div className="space-y-8">
						<section>
							<h2 className="text-base font-semibold text-fg mb-4">
								{t('profile:form.update_profile.photo.label')}
							</h2>
							<AvatarUpload
								value={profileForm.pendingImageKey ?? profileForm.profileMediaImage?.key ?? null}
								previewUrl={profileForm.avatarUrl}
								onChange={handleAvatarChange}
								apiBaseUrl={apiBaseUrl}
							/>
						</section>

						<section className="space-y-4">
							<h2 className="text-base font-semibold text-fg">
								{t('profile:form.update_profile.title')}
							</h2>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<Label htmlFor="profile-firstname" required>
										{t('profile:form.update_profile.firstname.label')}
									</Label>
									<Input
										id="profile-firstname"
										value={profileForm.firstname}
										onChange={e => updateProfileField('firstname', e.target.value)}
										invalid={Boolean(fieldErrors.firstname)}
										className="mt-1.5"
										autoComplete="given-name"
									/>
									{fieldErrors.firstname && (
										<p className="mt-1 text-xs text-danger">{fieldErrors.firstname}</p>
									)}
								</div>
								<div>
									<Label htmlFor="profile-lastname">
										{t('profile:form.update_profile.lastname.label')}
									</Label>
									<Input
										id="profile-lastname"
										value={profileForm.lastname}
										onChange={e => updateProfileField('lastname', e.target.value)}
										className="mt-1.5"
										autoComplete="family-name"
									/>
								</div>
							</div>
							<div>
								<Label htmlFor="profile-email" required>
									{t('profile:form.update_profile.email.label')}
								</Label>
								<Input
									id="profile-email"
									type="email"
									value={profileForm.email}
									onChange={e => updateProfileField('email', e.target.value)}
									invalid={Boolean(fieldErrors.email)}
									className="mt-1.5"
									autoComplete="email"
								/>
								{fieldErrors.email && <p className="mt-1 text-xs text-danger">{fieldErrors.email}</p>}
							</div>
							<div>
								<Label htmlFor="profile-phone">{t('profile:form.update_profile.phone.label')}</Label>
								<Input
									id="profile-phone"
									type="tel"
									value={profileForm.phone}
									onChange={e => updateProfileField('phone', e.target.value)}
									className="mt-1.5"
									autoComplete="tel"
									placeholder="Optional"
								/>
							</div>
						</section>

						<div className="flex justify-end">
							<Button
								variant="primary"
								loading={savingProfile}
								disabled={!isProfileDirty || savingProfile}
								onClick={handleSaveProfile}>
								{t('profile:form.update_profile.button')}
							</Button>
						</div>
					</div>
				</Card>
			)}

			{/* Security tab */}
			{activeTab === 'security' && (
				<Card>
					<div className="space-y-6">
						<div>
							<h2 className="text-base font-semibold text-fg">
								{t('profile:form.update_password.title')}
							</h2>
							<p className="text-sm text-fg-secondary mt-1">
								{t('profile:form.update_password.description')}
							</p>
						</div>

						<div className="space-y-4 max-w-md">
							<div>
								<Label htmlFor="new-password" required>
									{t('profile:form.update_password.new_password.label')}
								</Label>
								<Input
									id="new-password"
									type="password"
									value={passwordForm.newPassword}
									onChange={e =>
										setPasswordForm(prev => ({
											...prev,
											newPassword: e.target.value,
										}))
									}
									invalid={Boolean(fieldErrors.newPassword)}
									className="mt-1.5"
									autoComplete="new-password"
								/>
								{fieldErrors.newPassword && (
									<p className="mt-1 text-xs text-danger">{fieldErrors.newPassword}</p>
								)}
							</div>
							<div>
								<Label htmlFor="confirm-password" required>
									{t('profile:form.update_password.confirm_password.label')}
								</Label>
								<Input
									id="confirm-password"
									type="password"
									value={passwordForm.confirmPassword}
									onChange={e =>
										setPasswordForm(prev => ({
											...prev,
											confirmPassword: e.target.value,
										}))
									}
									invalid={Boolean(fieldErrors.confirmPassword)}
									className="mt-1.5"
									autoComplete="new-password"
								/>
								{fieldErrors.confirmPassword && (
									<p className="mt-1 text-xs text-danger">{fieldErrors.confirmPassword}</p>
								)}
							</div>
						</div>

						<div className="flex justify-end">
							<Button
								variant="primary"
								loading={savingPassword}
								disabled={
									savingPassword || (!passwordForm.newPassword && !passwordForm.confirmPassword)
								}
								onClick={handleSavePassword}>
								{t('profile:form.update_password.button')}
							</Button>
						</div>
					</div>
				</Card>
			)}
		</div>
	);
}
