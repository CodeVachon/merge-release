import inquirer, { Question } from "inquirer";

export const askAQuestion = async (options: Question) => {
    const resultOfQuestion = await inquirer.prompt([
        {
            ...options,
            name: "answer"
        }
    ]);

    return resultOfQuestion.answer;
}; // close
