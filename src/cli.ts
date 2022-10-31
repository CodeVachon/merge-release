import chalk from "chalk";
import figlet from "figlet";
import inquirer from "inquirer";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { COLOR } from "./color";
import { GitAPI } from "./GitApi";
import { log } from "./log";
const yargsOptions: Record<string, yargs.Options> = {
    cwd: {
        type: "string",
        alias: "c",
        describe: "Working Directory"
    },
    source: {
        type: "string",
        alias: "s",
        describe: "The Working Branch"
    },
    target: {
        type: "string",
        alias: "t",
        describe: "value to increment"
    }
};

const preRun = (): Promise<Readonly<ISettings>> =>
    new Promise(async (resolve, reject) => {
        const args: ISettings = (await yargs(hideBin(process.argv)).options(yargsOptions)
            .argv) as unknown as ISettings;

        console.info();
        console.info();
        console.info(
            chalk.hex(COLOR.ORANGE)(
                figlet.textSync("MERGE", {
                    font: "Colossal"
                })
            )
        );
        console.info();

        const settings: ISettings = (await inquirer.prompt(
            [
                {
                    name: "cwd",
                    type: "text",
                    message: "What is the Directory Path to the project?",
                    default: process.cwd()
                },
                {
                    name: "source",
                    type: "list",
                    message: "What is the Source Branch",
                    choices: async ({ cwd }: { cwd: string }) => {
                        const git = new GitAPI({ cwd });
                        const branches = await git.branchList();

                        return branches;
                    }
                },
                {
                    name: "target",
                    type: "list",
                    message: "What is the Target Branch",
                    choices: async ({ cwd, source }: { cwd: string; source: string }) => {
                        const git = new GitAPI({ cwd });
                        const branches = await git.branchList();

                        const filterList = branches.filter((v) => v !== source);

                        filterList.sort((a) => {
                            if (new RegExp("(main|master|production|staging)").test(a)) {
                                return -1;
                            } else {
                                return 0;
                            }
                        });

                        return filterList;
                    }
                }
            ],
            args
        )) as ISettings;

        const logKeys = ["cwd", "source", "target"];
        const maxLength = logKeys.reduce((v, current) => {
            if (current.length > v) {
                return current.length;
            } else {
                return v;
            }
        }, 0);
        console.info();
        logKeys.forEach((key) => {
            log(
                `${key.padEnd(maxLength)}   ${chalk.hex(COLOR.CYAN)(
                    settings[key as keyof typeof settings]
                )}`
            );
        });

        resolve(Object.freeze(settings));
    });

const main = (settings: ISettings): Promise<string> =>
    new Promise(async (resolve, reject) => {
        const git = new GitAPI({ cwd: settings.cwd, verbose: true });

        if (await git.isDirty()) {
            reject(new Error("Can not work on Dirty Repository"));
        }

        // Change to Source Branch
        console.info();
        log(
            `Checkout ${chalk.hex(COLOR.ORANGE)("source")} branch ${chalk.hex(COLOR.CYAN)(
                settings.source
            )}`
        );
        const sourceBranch = await git.currentBranch();
        if (sourceBranch !== settings.source) {
            await git.checkout(settings.source);
        }
        if (await git.branchHasRemote()) {
            await git.pull();
        }

        // Change to Target Branch
        console.info();
        log(
            `Checkout ${chalk.hex(COLOR.ORANGE)("target")} branch ${chalk.hex(COLOR.CYAN)(
                settings.target
            )}`
        );
        const targetBranch = await git.currentBranch();
        if (targetBranch !== settings.target) {
            await git.checkout(settings.target);
        }
        if (await git.branchHasRemote()) {
            await git.pull();
        }

        // Merge Source into Target
        console.info();
        log(
            `Merge branch ${chalk.hex(COLOR.ORANGE)(settings.source)} into ${chalk.hex(COLOR.CYAN)(
                settings.target
            )}`
        );
        await git.merge(settings.source, settings.target);

        resolve("Work Complete!");
    });

/**
 * Execute the Application
 */
preRun()
    .then(main)
    .then((result = "Work Complete!") => {
        console.info();
        log(result);
        console.info();
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
