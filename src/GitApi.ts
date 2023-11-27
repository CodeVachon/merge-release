import execa, { ExecaError } from "execa";
import { logCmd } from "./log";

interface IGitAPIOptions {
    cwd: string;
    verbose: boolean;
}

export class GitAPI {
    private cwd: string = process.cwd();
    private verbose = false;

    constructor(options: Partial<IGitAPIOptions>) {
        if (options.cwd !== undefined) {
            this.cwd = options.cwd.trim();
        }
        if (options.verbose !== undefined) {
            this.verbose = options.verbose;
        }
    }

    public async call(command: string | string[]) {
        const { stdout, escapedCommand } = await execa(
            "git",
            command instanceof Array
                ? command
                : command
                      .split(new RegExp("\\s{1,}", "g"))
                      .map((v) => v.trim())
                      .filter((v) => v.length > 0),
            { cwd: this.cwd }
        );

        if (this.verbose) {
            logCmd(escapedCommand);
        }

        return stdout;
    }

    public async branchList() {
        const list = await this.call("branch");

        return list
            .split(new RegExp("[\n\r]{1,}", "g"))
            .map((v) => v.replace(new RegExp("^\\*"), "").trim())
            .filter((v) => v.length > 0 && v !== "*");
    }

    public currentBranch() {
        return this.call("rev-parse --abbrev-ref HEAD");
    }

    public async checkout(branch: string, createNew = false) {
        if (createNew) {
            const currentList = await this.branchList();

            if (currentList.some((v) => v === branch)) {
                throw new Error(`A branch name "${branch}" already exists`);
            }

            return this.call(`checkout -b ${branch}`);
        } else {
            return this.call(`checkout ${branch}`);
        }
    }

    public status() {
        return this.call("status -s");
    }

    public async isDirty() {
        const state = await this.call("diff --stat");
        return state !== "";
    }

    public pull() {
        return this.call("pull");
    }

    public add(fileName: string | string[]) {
        return this.call(["add", ...(fileName instanceof Array ? fileName : [fileName])]);
    }

    public commit(message: string) {
        return this.call(["commit", "--no-verify", "-m", message]);
    }

    public merge(source: string, target: string) {
        return this.call(["merge", source, target, "--no-verify"]);
    }

    public async getRemotes() {
        const remotesRaw = await this.call(["remote", "-v"]);
        const remotes = remotesRaw
            .split(new RegExp("[\n\r]{1,}"))
            .map((v) => v.trim())
            .filter((v) => v.length > 0)
            .map((v) => v.split(new RegExp("\\s{1,}"))[0]);

        return remotes.filter((elem, index, self) => index === self.indexOf(elem));
    }

    public async branchHasRemote() {
        try {
            const result = await this.call([
                "rev-parse",
                "--abbrev-ref",
                "--symbolic-full-name",
                "@{u}"
            ]);

            if (String(result).length > 0) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            if (
                new RegExp("no upstream configured", "gi").test(
                    (error as ExecaError).stderr || (error as Error).message
                )
            ) {
                return false;
            }

            throw error;
        }
    }

    public async push(toUpStream?: string) {
        if (toUpStream) {
            return this.call(["push", "-u", toUpStream, await this.currentBranch(), "--no-verify"]);
        } else {
            return this.call(["push", "--no-verify"]);
        }
    }

    public async getConflictedPaths() {
        const conflictedPaths = new Set<string>();
        const paths = await this.call(["ls-files", "--unmerged"]);

        for (const unformattedPath of paths.split("\n")) {
            const path = unformattedPath.split(new RegExp("\\s{1,}", "g"))[3];
            conflictedPaths.add(path);
        }

        return Array.from(conflictedPaths);
    }

    public async gitAdd(path: string) {
        return this.call(["add", path]);
    }

    public async commitMerge() {
        return this.call(["commit", "--no-edit"]);
    }
}
