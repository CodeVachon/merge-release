import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

export const readJSONFile = (filePath: string) => {
    try {
        const packageJsonContent = readFileSync(filePath, "utf8");

        return packageJsonContent;
    } catch (error) {
        if ((error as Error & { code: string }).code === "ENOENT") {
            return "{}";
        } else {
            throw error;
        }
    }
};

export const writeJSONFile = (filePath: string, content: string) => {
    writeFileSync(filePath, content, {
        flag: "w"
    });
};

export const readPackageJson = (cwd: string) => {
    const packageJsonContent = readJSONFile(resolve(cwd, "package.json"));

    return packageJsonContent;
};

export const writePackageJson = (cwd: string, content: string) => {
    writeJSONFile(resolve(cwd, "package.json"), content);
};
