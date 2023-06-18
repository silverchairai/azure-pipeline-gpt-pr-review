import { AxiosError } from "axios";
import tl from "azure-pipelines-task-lib/task";
import { DeleteExistingComments } from "./DeleteExistingComments";
import { GetChangedFiles } from "./GetChangedFiles";
import { reviewFile } from "./reviewFile";

async function run() {
  try {
    if (tl.getVariable("Build.Reason") !== "PullRequest") {
      tl.setResult(
        tl.TaskResult.Skipped,
        "This task should be run only when the build is triggered from a Pull Request."
      );
      return;
    }

    // tl.setResult(tl.TaskResult.Failed, "No Api Key provided!");

    const targetBranch = `origin/${tl.getVariable(
      "System.PullRequest.TargetBranchName"
    )}`;

    const filesNames = await GetChangedFiles(targetBranch);

    try {
      await DeleteExistingComments();
    } catch (error: any) {
      if (error instanceof AxiosError) {
        console.log({
          status: error.status,
          message: error.message,
        });
      } else {
        console.log(error.message);
      }
    }

    for await (const fileName of filesNames) {
      await reviewFile(fileName, targetBranch);
    }

    tl.setResult(tl.TaskResult.Succeeded, "Pull Request reviewed.");
  } catch (err: any) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

export function getFileExtension(fileName: string) {
  return fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2);
}

run();
