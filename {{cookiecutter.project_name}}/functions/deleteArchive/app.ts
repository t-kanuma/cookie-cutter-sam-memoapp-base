import {
  DynamoDBDocumentClient,
  DeleteCommand,
  DeleteCommandInput,
  DeleteCommandOutput,
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
export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const pathParams: APIGatewayProxyEventPathParameters | null =
    event.pathParameters;
  if (!pathParams) {
    return createResponse(400, "path parames are null, undefined or empty.");
  }

  const { id } = pathParams;
  console.log(`Memo Id: ${id}`);

  if (!id) {
    return createResponse(400, "Memo Id is null, undefined or empty.");
  }

  const userId = event.requestContext.authorizer?.claims["cognito:username"];

  if (!userId) {
    throw new Error("No userName Found");
  }

  const params: DeleteCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      userId: userId,
      id: id,
    },
  };
  try {
    const putResp: DeleteCommandOutput = await docClient.send(
      new DeleteCommand(params)
    );
    console.log(`deleteResp: ${JSON.stringify(putResp)} `);
    return createResponse(200, "deleted archive successfully.");
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(
        `error on deleting memo to db: ${JSON.stringify(err.message)}`
      );
    } else {
      throw err;
    }
  }
};

const createResponse = (
  statusCode: number,
  message: string
): APIGatewayProxyResult => {
  return {
    statusCode: statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "DELETE",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    },
    body: JSON.stringify({ message: message }),
  };
};
