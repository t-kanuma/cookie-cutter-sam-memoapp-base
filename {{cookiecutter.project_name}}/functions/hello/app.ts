import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
// import fetch from "node-fetch";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log(JSON.stringify(event));

  return {
    statusCode: 200,
    body: "",
  };

  // const response = await fetch(`${process.env.ENDPOINT}/status`, {
  //   method: "GET",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  // });

  // if (response.ok) {
  //   const responseJson = await response.json();
  //   console.log(JSON.stringify(responseJson));
  // } else {
  //   throw new Error();
  // }
};
