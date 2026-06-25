export interface ProfileMedia {
	key: string;
	bucket?: string;
	url?: string;
}

export interface ProfileData {
	firstname?: string;
	lastname?: string;
	email?: string;
	phone?: string;
	role?: string;
	profileMediaImage?: ProfileMedia | null;
}

export interface ProfileFormState {
	firstname: string;
	lastname: string;
	email: string;
	phone: string;
	profileMediaImage: ProfileMedia | null;
	/** Pending upload key (not yet saved) */
	pendingImageKey: string | null;
	/** Preview URL for pending or existing image */
	avatarUrl: string | null;
}

export interface PasswordFormState {
	newPassword: string;
	confirmPassword: string;
}

export type ProfileTab = 'profile' | 'security';
