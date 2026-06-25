import { Page, t } from '@maxal_studio/kratosjs';
import { ProfileEditorBlock } from './ProfileEditorBlock';

export class ProfilePage extends Page {
	static slug = 'profile';
	static icon = 'User';
	static navigationSort = 10;

	static get label() {
		return t('profile:label');
	}

	static get navigationGroup() {
		return t('profile:navGroup');
	}

	static async blocks() {
		return [ProfileEditorBlock.make().columns(12)];
	}
}
