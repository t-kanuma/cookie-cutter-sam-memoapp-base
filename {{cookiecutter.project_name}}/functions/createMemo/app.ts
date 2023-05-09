import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandInput,
  PutCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { InitMemo, Memo } from "./types";

const docClient: DynamoDBDocumentClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.REGION })
);

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    throw new Error("payload is null or empty.");
  }
  const payload = JSON.parse(event.body) as InitMemo;
  console.log(`payload: ${JSON.stringify(payload)}`);

  if (!isInitMemoType(payload)) {
    return createResponse(400, "payload is not InitMemo type.");
  }

  const { title, text } = payload;
  if (!title || !text) {
    return createResponse(400, "payload is not valid.");
  }

  const userId = event.requestContext.authorizer?.claims["cognito:username"];
  if (!userId) {
    throw new Error("No userName Found");
  }

  const newMemo: Memo = {
    userId: userId,
    id: uuidv4(),
    archived: false,
    done: false,
    favorite: false,
    title: title,
    text: text,
  };

  const params: PutCommandInput = {
    TableName: process.env.TABLE_NAME,
    Item: {
      ...newMemo,
    },
  };
  try {
    const createResp: PutCommandOutput = await docClient.send(
      new PutCommand(params)
    );
    console.log(`createResp: ${JSON.stringify(createResp)} `);
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(
        `error on creating memo to db: ${JSON.stringify(err.message)}`
      );
    } else {
      throw err;
    }
  }

  // Notify that the memo is created
  const sqsClient: SQSClient = new SQSClient({ region: process.env.REGION });
  const sqsParams = {
    QueueUrl: process.env.QUEUE_URL,
    MessageBody: JSON.stringify(newMemo),
  };
  try {
    const sqsResp = await sqsClient.send(new SendMessageCommand(sqsParams));
    console.log(`sqsResp: ${JSON.stringify(sqsResp)}`);
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(
        `error on sending message to sqs: ${JSON.stringify(err.message)}`
      );
    } else {
      throw err;
    }
  }

  return createResponse(200, "created memo successfully.");
};
const isInitMemoType = (initMemo: InitMemo): initMemo is InitMemo => {
  const { title, text } = initMemo;

  return (
    title !== undefined &&
    text !== undefined &&
    typeof title === "string" &&
    typeof text === "string"
  );
};

const createResponse = (
  statusCode: number,
  message: string
): APIGatewayProxyResult => {
  return {
    statusCode: statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    },
    body: JSON.stringify({ message: message }),
  };
};
