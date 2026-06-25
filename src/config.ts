import type { DriverKind } from '@maxal_studio/kratosjs';

export interface ProfilePluginOptions {
	/** Name of the user entity (default: 'User') */
	userEntity?: string;
}

interface ProfileConfig {
	userEntity: string;
	driver: DriverKind;
}

let config: ProfileConfig = { userEntity: 'User', driver: 'sql' };

export function setProfileConfig(next: ProfileConfig): void {
	config = next;
}

export function getProfileConfig(): ProfileConfig {
	return config;
}

/**
 * Convert the auth user id into the entity's primary key type.
 * SQL drivers use numeric autoincrement ids; MongoDB uses string ObjectIds.
 */
export function toUserId(id: string | number): string | number {
	return config.driver === 'sql' ? Number(id) : String(id);
}
