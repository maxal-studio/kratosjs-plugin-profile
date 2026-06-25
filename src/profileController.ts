import bcrypt from 'bcrypt';
import { KratosJsRequest, KratosJsResponse, t } from '@maxal_studio/kratosjs';
import { getProfileConfig, toUserId } from './config';

export async function viewProfile(req: KratosJsRequest, res: KratosJsResponse): Promise<void> {
	try {
		const userId = req.authUser?.id;
		if (!userId) {
			res.status(401).json({ error: t('profile:unauthorized') });
			return;
		}

		const { userEntity } = getProfileConfig();
		const em = req.panel!.getEm();
		// MikroORM 7 no longer accepts string entity names; resolve the configured
		// name to its entity reference via the metadata store (keyed by name).
		const userEntityRef = em.getMetadata().get(userEntity as any).class;
		const user: any = await em.findOne(userEntityRef, toUserId(userId) as any);
		if (!user) {
			res.status(404).json({ error: t('profile:view_profile.user_not_found') });
			return;
		}

		const data: any = { ...user };
		if (user.profileMediaImage && req.resolveMediaUrl) {
			data.profileMediaImage = {
				...user.profileMediaImage,
				url: await req.resolveMediaUrl(user.profileMediaImage),
			};
		}

		res.json({ success: true, data });
	} catch (error: any) {
		console.error('Error viewing profile:', error);
		res.status(500).json({ error: error.message || t('profile:view_profile.failed_to_view_profile') });
	}
}

export async function updateProfile(req: KratosJsRequest, res: KratosJsResponse): Promise<void> {
	try {
		const userId = req.authUser?.id;
		if (!userId) {
			res.status(401).json({ error: t('profile:unauthorized') });
			return;
		}

		const { firstname, lastname, email, phone, profileMediaImage } = req.body;
		const formatMediaKey = req.formatMediaKey;
		if (!formatMediaKey) {
			res.status(500).json({ error: t('profile:update_profile.media_format_unavailable') });
			return;
		}

		const updateData: any = { firstname, lastname, email, phone };
		if (profileMediaImage === null) {
			updateData.profileMediaImage = null;
		} else if (profileMediaImage) {
			updateData.profileMediaImage = await formatMediaKey(profileMediaImage);
		}

		const { userEntity } = getProfileConfig();
		const em = req.panel!.getEm();
		// MikroORM 7 no longer accepts string entity names; resolve the configured
		// name to its entity reference via the metadata store (keyed by name).
		const userEntityRef = em.getMetadata().get(userEntity as any).class;
		const user: any = await em.findOne(userEntityRef, toUserId(userId) as any);
		if (!user) {
			res.status(404).json({ error: t('profile:update_profile.user_not_found') });
			return;
		}

		em.assign(user, updateData);
		await em.flush();

		res.json({
			success: true,
			message: t('profile:update_profile.profile_updated_successfully'),
			data: user,
		});
	} catch (error: any) {
		console.error('Error updating profile:', error);
		res.status(500).json({ error: error.message || t('profile:update_profile.failed_to_update_profile') });
	}
}

export async function changePassword(req: KratosJsRequest, res: KratosJsResponse): Promise<void> {
	try {
		const userId = req.authUser?.id;
		if (!userId) {
			res.status(401).json({ error: t('profile:unauthorized') });
			return;
		}

		const { newPassword, confirmPassword } = req.body;
		if (!newPassword || !confirmPassword) {
			res.status(400).json({ error: t('profile:change_password.all_fields_required') });
			return;
		}
		if (newPassword !== confirmPassword) {
			res.status(400).json({ error: t('profile:change_password.password_mismatch') });
			return;
		}
		if (newPassword.length < 8) {
			res.status(400).json({ error: t('profile:change_password.password_too_short') });
			return;
		}

		const { userEntity } = getProfileConfig();
		const em = req.panel!.getEm();
		// MikroORM 7 no longer accepts string entity names; resolve the configured
		// name to its entity reference via the metadata store (keyed by name).
		const userEntityRef = em.getMetadata().get(userEntity as any).class;
		const user: any = await em.findOne(userEntityRef, toUserId(userId) as any);
		if (!user) {
			res.status(404).json({ error: 'User not found' });
			return;
		}

		user.password = await bcrypt.hash(newPassword, 10);
		await em.flush();

		res.json({ success: true, message: t('profile:change_password.password_updated_successfully') });
	} catch (error: any) {
		console.error('Error changing password:', error);
		res.status(500).json({ error: error.message || t('profile:change_password.failed_to_change_password') });
	}
}
