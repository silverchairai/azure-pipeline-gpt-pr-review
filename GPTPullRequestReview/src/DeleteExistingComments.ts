import axios from "axios";
import * as tl from "azure-pipelines-task-lib/task";
import { getCollectionName } from "./getCollectionName";

export async function DeleteExistingComments() {
  console.log("Start deleting existing comments added by the previous Job ...");

  const threadsUrl = `${tl.getVariable(
    "SYSTEM.TEAMFOUNDATIONCOLLECTIONURI"
  )}${tl.getVariable(
    "SYSTEM.TEAMPROJECTID"
  )}/_apis/git/repositories/${tl.getVariable(
    "Build.Repository.Name"
  )}/pullRequests/${tl.getVariable(
    "System.PullRequest.PullRequestId"
  )}/threads?api-version=5.1`;
  const threadsResponse = await axios.get(threadsUrl, {
    headers: {
      Authorization: `Bearer ${tl.getVariable("SYSTEM.ACCESSTOKEN")}`,
    },
  });

  const threads = threadsResponse.data as { value: [] };
  const threadsWithContext = threads.value.filter(
    (thread: any) => thread.threadContext !== null
  );

  const collectionUri = tl.getVariable(
    "SYSTEM.TEAMFOUNDATIONCOLLECTIONURI"
  ) as string;
  const collectionName = getCollectionName(collectionUri);
  const buildServiceName = `${tl.getVariable(
    "SYSTEM.TEAMPROJECT"
  )} Build Service (${collectionName})`;

  for (const thread of threadsWithContext as any[]) {
    const commentsUrl = `${tl.getVariable(
      "SYSTEM.TEAMFOUNDATIONCOLLECTIONURI"
    )}${tl.getVariable(
      "SYSTEM.TEAMPROJECTID"
    )}/_apis/git/repositories/${tl.getVariable(
      "Build.Repository.Name"
    )}/pullRequests/${tl.getVariable(
      "System.PullRequest.PullRequestId"
    )}/threads/${thread.id}/comments?api-version=5.1`;
    const commentsResponse = await axios.get(commentsUrl, {
      headers: {
        Authorization: `Bearer ${tl.getVariable("SYSTEM.ACCESSTOKEN")}`,
      },
    });

    const comments = commentsResponse.data as { value: [] };

    for (const comment of comments.value.filter(
      (comment: any) => comment.author.displayName === buildServiceName
    ) as any[]) {
      const removeCommentUrl = `${tl.getVariable(
        "SYSTEM.TEAMFOUNDATIONCOLLECTIONURI"
      )}${tl.getVariable(
        "SYSTEM.TEAMPROJECTID"
      )}/_apis/git/repositories/${tl.getVariable(
        "Build.Repository.Name"
      )}/pullRequests/${tl.getVariable(
        "System.PullRequest.PullRequestId"
      )}/threads/${thread.id}/comments/${comment.id}?api-version=5.1`;

      await axios.delete(removeCommentUrl, {
        headers: {
          Authorization: `Bearer ${tl.getVariable("SYSTEM.ACCESSTOKEN")}`,
        },
      });
    }
  }

  console.log("Existing comments deleted.");
}
