import execa from 'execa';
import { logger, series, task } from 'just-task';
import readPackage from 'read-pkg';

// option('env', { default: { env: 'develop' } });

function splitArgs(args: string): string[] {
  return args
    .split(' ')
    .map((line) => line.trim())
    .filter((line) => line != null && line !== '');
}

task('clean', async () => {
  const cmd = 'rimraf';
  const option = 'dist artifact';

  logger.info(cmd, option);

  await execa(cmd, splitArgs(option), {
    stderr: process.stderr,
    stdout: process.stdout,
  });
});

task('clean:dts', async () => {
  const cmd = 'rimraf';
  const option = 'dist/cjs/src dist/esm/src';

  logger.info(cmd, option);

  await execa(cmd, splitArgs(option), {
    stderr: process.stderr,
    stdout: process.stdout,
  });
});

task('ctix:single', async () => {
  const cmd = 'ctix';
  const option =
    'single -p ./tsconfig.prod.json --config ./.configs/.ctirc -g ./.configs/.ctiignore';

  logger.info('Create index file : ', cmd, option);

  await execa(cmd, splitArgs(option), {
    stderr: process.stderr,
    stdout: process.stdout,
  });
});

task('ctix:remove', async () => {
  const cmd = 'ctix';
  const option = 'remove -p ./tsconfig.json --config ./.configs/.ctirc -g ./.configs/.ctiignore';

  logger.info('Remove index file : ', cmd, option);

  await execa(cmd, splitArgs(option), {
    stderr: process.stderr,
    stdout: process.stdout,
  });
});

task('+rollup:dev', async () => {
  const cmd = 'rollup';
  const option = '--config ./.configs/rollup.config.dev.ts --configPlugin typescript';

  await execa(cmd, splitArgs(option), {
    env: {
      NODE_ENV: 'production',
    },
    stderr: process.stderr,
    stdout: process.stdout,
  });
});

task('+rollup:prod', async () => {
  const cmd = 'rollup';
  const option = '--config ./.configs/rollup.config.prod.ts --configPlugin typescript';

  await execa(cmd, splitArgs(option), {
    env: {
      NODE_ENV: 'production',
    },
    stderr: process.stderr,
    stdout: process.stdout,
  });
});

task('lint', async () => {
  const cmd = 'eslint';
  const option = '--cache .';

  await execa(cmd, splitArgs(option), {
    stderr: process.stderr,
    stdout: process.stdout,
  });
});

task('+build', async () => {
  const cmd = 'tsc';
  const option = '--incremental --project tsconfig.prod.json';
  // const option = '--incremental --project tsconfig.json --tsBuildInfoFile .tsbuildinfo';

  await execa(cmd, splitArgs(option), {
    env: {
      NODE_ENV: 'production',
    },
    stderr: process.stderr,
    stdout: process.stdout,
  });
});

task('+pub', async () => {
  const cmd = 'npm';
  const option = 'publish';

  await execa(cmd, splitArgs(option), {
    env: {
      NODE_ENV: 'production',
      RELEASE_MODE: 'true',
    },
    stderr: process.stderr,
    stdout: process.stdout,
  });
});

task('+pub:prod', async () => {
  const cmd = 'npm';
  const option = 'publish --access=public';

  await execa(cmd, splitArgs(option), {
    env: {
      NODE_ENV: 'production',
      RELEASE_MODE: 'true',
    },
    stderr: process.stderr,
    stdout: process.stdout,
  });
});

task('+unpub', async () => {
  const pkg = readPackage.sync();
  const cmd = 'npm';
  const option = `unpublish ${pkg.name}@${pkg.version} --registry http://localhost:8901 --force`;

  logger.info('Unpublish: ', cmd, option);

  await execa(cmd, splitArgs(option), {
    env: {
      NODE_ENV: 'production',
      RELEASE_MODE: 'true',
    },
    stderr: process.stderr,
    stdout: process.stdout,
  });
});

task('rollup:prod', series('clean', 'ctix:single', '+rollup:prod', 'ctix:remove', 'clean:dts'));
task('rollup:dev', series('clean', 'ctix:single', '+rollup:dev', 'ctix:remove', 'clean:dts'));
task('build', series('clean', '+build'));
task('pub', series('rollup:prod', '+pub'));
task('unpub', series('clean', '+unpub'));
task('pub:prod', series('rollup:prod', '+pub:prod'));
