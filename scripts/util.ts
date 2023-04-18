import { existsSync, mkdirSync, readdirSync } from 'fs';
import inquirer from 'inquirer';

/**
 * @param message the prompt to display
 * @param prefix the prefix for the default option
 * @param readonly if the file only reads from the given file or directory
 * @returns the entered file path
 */
export async function getFilePath(message: string, prefix: string, readonly = false): Promise<string> {
  const question: Record<string, string> = {
    name: 'filePath',
    type: 'input',
    message,
  };
  if (prefix) {
    question.default = `${prefix}-${new Date().toISOString().slice(0, 10)}`;
  }
  const { filePath } = await inquirer.prompt([question]);

  // if readonly and the file does not exist, throw error
  // if not readonly and the file exists, show overwrite warning
  // if not readonly and the file does not exist, create it
  if (readonly) {
    if (!existsSync(filePath)) {
      throw new Error('No such file or directory exists');
    }
    // if we're writing and there are files in the given directory
  } else if (
    existsSync(filePath) && readdirSync(filePath).length > 0
  ) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message:
          'That directory already exists. Continue? This may overwrite existing files!',
      },
    ]);
    if (!confirm) throw new Error('That directory already exists');
  } else {
    mkdirSync(filePath, { recursive: true });
  }

  return filePath.replace(/\/$/, ''); // remove trailing
}

export function assertEnvVar(varName: string) {
  const varValue = process.env[varName];
  if (!varValue) {
    throw new Error(`must set "${varName}" env variable`);
  }
  return varValue;
}
