import {
  DynamoDBDocumentClient,
  UpdateCommand,
  UpdateCommandInput,
  UpdateCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  APIGatewayProxyEventPathParameters,
} from "aws-lambda";

const docClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.REGION })
);

type Memo = {
  id: string;
  userId: string;
  archived: boolean;
  done: boolean;
  favorite: boolean;
  title: string;
  text: string;
};

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const pathParams: APIGatewayProxyEventPathParameters | null =
    event.pathParameters;

  // validate path params
  if (!pathParams) {
    return createResponse(400, "path parames are null or empty.");
  }

  const { id } = pathParams;
  console.log(`Memo Id: ${id}`);
  if (!id) {
    return createResponse(400, "Memo Id is undefined or empty.");
  }

  // validate payload
  if (!event.body) {
    return createResponse(400, "payload is null or empty.");
  }

  const payload = JSON.parse(event.body);
  console.log(`payload: ${JSON.stringify(payload)}`);

  if (!isMemoType({ ...payload })) {
    return createResponse(400, "payload is not Memo type.");
  }

  if (!isValidMemo({ ...payload })) {
    return createResponse(400, "payload is not valid.");
  }

  const userId = event.requestContext.authorizer?.claims["cognito:username"];
  if (!userId) {
    throw new Error("No userName Found");
  }

  const { title, text, archived, done, favorite } = payload;
  const params: UpdateCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      userId: userId,
      id: id,
    },
    ExpressionAttributeNames: {
      "#te": "text",
    },
    UpdateExpression:
      "set title= :ti, #te= :te, archived = :a, done = :d, favorite = :f",
    ExpressionAttributeValues: {
      ":ti": title,
      ":te": text,
      ":a": archived,
      ":d": done,
      ":f": favorite,
    },
  };
  try {
    const updateResp: UpdateCommandOutput = await docClient.send(
      new UpdateCommand(params)
    );
    console.log(`updateResp: ${JSON.stringify(updateResp)} `);

    return createResponse(200, "update memo successfully.");
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(
        `error on updating memo on db: ${JSON.stringify(err.message)}`
      );
    } else {
      throw err;
    }
  }
};

const isMemoType = (memo: Memo): memo is Memo => {
  const { title, text, archived, favorite, done } = memo;
  return (
    archived !== undefined &&
    done !== undefined &&
    favorite !== undefined &&
    title !== undefined &&
    text !== undefined &&
    typeof title === "string" &&
    typeof text === "string" &&
    typeof archived === "boolean" &&
    typeof favorite === "boolean" &&
    typeof done === "boolean"
  );
};

const isValidMemo = (memo: Memo): boolean => {
  return !(!memo.title || !memo.text);
};

const createResponse = (
  statusCode: number,
  message: string
): APIGatewayProxyResult => {
  return {
    statusCode: statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "PUT",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    },
    body: JSON.stringify({ message: message }),
  };
};
