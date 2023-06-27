import * as tl from "azure-pipelines-task-lib/task";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { AddCommentToPR } from "./AddCommentToPR";
import { chatPrompt } from "./prompt";
import { ConversationalRetrievalQAChain } from "langchain/chains";

import { git } from "./utils/git";
import { LoadProjectContext } from "./LoadProjectContext";

export async function reviewFile(fileName: string, targetBranch: string) {
  console.log(`Start reviewing ${fileName} ...`);

  const patch = await git.diff([targetBranch, "--", fileName]);

  try {
    const openAIApiKey = tl.getInput("apiKey", true) as string;

    const chat = new ChatOpenAI({
      openAIApiKey,
      modelName: "gpt-3.5-turbo",
    });

    // const prompt = await chatPrompt.formatPromptValue({ patch });

    // const { text: answer } = await chat.call(prompt.toChatMessages());

    // if (answer) await AddCommentToPR(fileName, answer);

    const retriever = await LoadProjectContext(
      tl.getVariable("System.DefaultWorkingDirectory") as string
    );

    const qa = ConversationalRetrievalQAChain.fromLLM(chat, retriever);

    const prompt = await chatPrompt.formatPromptValue({ patch });

    const { text: answer } = await qa.call(prompt.toChatMessages());

    if (answer) await AddCommentToPR(fileName, answer);

    console.log(`Review of ${fileName} completed.`);
  } catch (error: any) {
    if (error.isAxiosError) {
      console.log({
        status: error.status,
        message: error.message,
      });
    } else {
      console.log(error.message);
    }
  }
}
