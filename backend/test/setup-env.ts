import { validEnv } from './env.fixture';

Object.assign(process.env, validEnv);
if (process.env.TEST_MONGODB_URI) process.env.MONGODB_URI = process.env.TEST_MONGODB_URI;
