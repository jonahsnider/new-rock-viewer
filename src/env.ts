import { cleanEnv, str } from 'envalid';

export const env = cleanEnv(process.env, {
	NEW_ROCK_USERNAME: str({ desc: 'The username for the New Rock website' }),
	NEW_ROCK_PASSWORD: str({ desc: 'The password for the New Rock website' }),
	SANITY_AUTH_TOKEN: str({ desc: 'Sanity API token with write permissions' }),
});
