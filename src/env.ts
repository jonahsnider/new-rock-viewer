import {str, cleanEnv} from 'envalid'

export const env = cleanEnv(process.env, {
  NEW_ROCK_COOKIE: str({desc: 'The cookie for the New Rock website'}),
})
