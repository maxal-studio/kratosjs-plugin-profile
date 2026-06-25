import { definePluginClient } from '@maxal_studio/kratosjs-react';
import ProfileEditorBlock from './ProfileEditorBlock';
import en from './lang/en';
import sq from './lang/sq';

export default definePluginClient({
	name: 'profile',
	blocks: {
		'profile-editor': ProfileEditorBlock,
	},
	translations: { en, sq },
});
