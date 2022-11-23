import inquirer from 'inquirer';
import { promisify } from 'util';
import { exec } from 'child_process';
const run = promisify(exec);
import ora, { Ora } from 'ora';
import { plugins } from './plugin.js';
const ui = new inquirer.ui.BottomBar();
// @ts-ignore
import shelljs from 'shelljs';
import chalk from 'chalk';

export async function installAppiumServer() {
  newLine();
  const spinner = ora('Installing Appium Server').start();
  try {
    await run('npm install -g appium@next');
    const { stdout } = await run('appium -v');
    spinner.succeed(`💥 💥 💥 Successfully installed server version ${stdout}`);
  } catch (err: any) {
    spinner.fail(err);
    throw new Error(err);
  } finally {
    spinner.stop();
  }
}

function newLine() {
  ui.log.write('\n');
}

export async function getDriver() {
  newLine();
  let drivers: { name: string }[] = [];
  const spinner = ora('Fetching available official drivers').start();

  try {
    const { stdout } = await shelljs.exec('appium driver list --json', { silent: true });
    Object.keys(JSON.parse(stdout)).forEach((value) => drivers.push({ name: value }));
    spinner.succeed();
    return drivers;
  } catch (err: any) {
    spinner.fail(err);
    spinner.stop();
  } finally {
    spinner.stop();
  }
}

export async function installDrivers(value: any) {
  await Promise.all(
    value.map(async (driverName: string) => {
      await shelljs.exec(`appium driver install ${driverName}`);
    })
  );
}

export async function installPlugin() {
  const requiredPlugins = await inquirer.prompt([
    {
      type: 'checkbox',
      message: 'Select Plugins to install',
      name: 'plugins',
      choices: plugins,
    },
  ]);
  const { source } = await inquirer.prompt([
    {
      type: 'list',
      message: 'Source ',
      name: 'source',
      choices: ['npm', 'github', 'git', 'local'],
    }
  ]);
  const { pluginPath } = await inquirer
      .prompt([
        {
          name: 'pluginPath',
          message: 'Source of plugin',
        },
      ])
  const installedPlugins = await shelljs.exec('appium plugin list --installed --json', { silent: true });
  const pluginNamesInstalled: any = Object.values(JSON.parse(installedPlugins.stdout)).map((p: any) => p.pkgName);
  await Promise.all(
      requiredPlugins.plugins.map(async (pluginName: string) => {
        ui.log.write('Checking if plugin is already installed');
        if(pluginNamesInstalled.includes(pluginName)) {
            ui.log.write(chalk.yellow(`💾 💾 Plugin ${pluginName} already installed`));
            return;
          } else {
          if (pluginPath === 'npm') {
            await shelljs.exec(`appium plugin install --source ${source} ${pluginName}`);
          } else {
            await shelljs.exec(`appium plugin install --source ${source} --package ${pluginPath} plugin`);
          }
        }
      })
  );

}
