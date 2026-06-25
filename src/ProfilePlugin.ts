import { Plugin, Panel, KratosJsRequest, KratosJsResponse } from '@maxal_studio/kratosjs';
import { ProfilePage } from './ProfilePage';
import { updateProfile, changePassword, viewProfile } from './profileController';
import { setProfileConfig, ProfilePluginOptions } from './config';
import en from './lang/en';
import sq from './lang/sq';

/**
 * Profile Plugin — a profile page where the logged-in user can edit their
 * details and change their password. Works against the host app's user
 * entity (configurable, defaults to 'User') on both MongoDB and SQL drivers.
 */
export class ProfilePlugin extends Plugin {
	constructor(private readonly options: ProfilePluginOptions = {}) {
		super();
	}

	getName(): string {
		return 'profile';
	}

	register(panel: Panel): void {
		setProfileConfig({
			userEntity: this.options.userEntity ?? 'User',
			driver: panel.getDriverKind(),
		});

		panel.registerTranslations('profile', { en, sq });

		panel.registerPage(ProfilePage);
		panel.registerCustomBlock('profile-editor');

		const attachPanel = (handler: (req: KratosJsRequest, res: KratosJsResponse) => Promise<void>) => {
			return async (req: KratosJsRequest, res: KratosJsResponse) => {
				req.panel = panel;
				await handler(req, res);
			};
		};

		panel.registerRoute('get', '/profile', attachPanel(viewProfile));
		panel.registerRoute('post', '/profile/update', attachPanel(updateProfile));
		panel.registerRoute('post', '/profile/change-password', attachPanel(changePassword));
	}
}
