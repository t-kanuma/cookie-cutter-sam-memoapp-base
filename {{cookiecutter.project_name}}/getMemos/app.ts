import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const docClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.REGION })
);

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const userId = event.requestContext.authorizer?.claims["cognito:username"];
  if (!userId) {
    throw new Error("No userName Found");
  }

  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":archived": false,
      ":userId": userId,
    },
    FilterExpression: "archived = :archived",
  };
  try {
    const memos: QueryCommandOutput = await docClient.send(
      new QueryCommand(params)
    );
    const response: APIGatewayProxyResult = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
      },
      body: JSON.stringify({
        memos: memos.Items,
      }),
    };
    console.log(`memos: ${JSON.stringify(memos)}`);
    return response;
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(
        `error on retrieving data from db: ${JSON.stringify(err.message)}`
      );
    } else {
      throw err;
    }
  }
};
