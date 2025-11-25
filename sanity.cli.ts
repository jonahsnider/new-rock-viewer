import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
	api: {
		projectId: '5zgry73m',
		dataset: 'production',
	},
	deployment: {
		/**
		 * Enable auto-updates for studios.
		 * Learn more at https://www.sanity.io/docs/cli#auto-updates
		 */
		autoUpdates: true,

		appId: 's5jromb699st3uetjt6seuw7',
	},
});
