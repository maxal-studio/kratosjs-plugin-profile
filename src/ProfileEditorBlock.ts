import { Block, SerializedBlock } from '@maxal_studio/kratosjs';

export interface SerializedProfileEditorBlock extends SerializedBlock {
	type: 'profile-editor';
}

/**
 * Custom page block — dedicated profile settings UI.
 */
export class ProfileEditorBlock extends Block {
	protected blockType = 'profile-editor' as const;

	static make(): ProfileEditorBlock {
		return new ProfileEditorBlock();
	}

	toJSON(): SerializedProfileEditorBlock {
		return {
			type: 'profile-editor',
			...(this._title !== undefined && { title: this._title }),
			...(this._subtitle !== undefined && { subtitle: this._subtitle }),
			...(this._columns !== undefined && { columns: this._columns }),
		};
	}
}
