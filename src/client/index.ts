import { definePluginClient } from '@maxal_studio/kratosjs-react';
import ProfileEditorBlock from './ProfileEditorBlock';
export default definePluginClient({
	name: 'profile',
	blocks: {
		'profile-editor': ProfileEditorBlock,
	},
});
