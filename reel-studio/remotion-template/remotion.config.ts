import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
// each render worker is a browser: 4 is fine on 8 GB, use REMOTION_CONCURRENCY=2 on a small machine
Config.setConcurrency(Number(process.env.REMOTION_CONCURRENCY || 4));
// GPU when present, software (SwiftShader) otherwise; needed for the 3D shots
Config.setChromiumOpenGlRenderer((process.env.REMOTION_GL || 'angle') as 'angle'); // no GPU (CI, sandbox): REMOTION_GL=swangle
