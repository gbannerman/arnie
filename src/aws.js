const { IAMClient, CreateAccessKeyCommand } = require("@aws-sdk/client-iam");
const { fromIni } = require("@aws-sdk/credential-providers");

const ENVIRONMENT = {
  STAGING: "staging",
  PRODUCTION: "production",
};

const createAwsCredentialsForRepo = async (repoName, environment) => {
  const iamUserName = `ci-${repoName}`;
  const response = await createNewAccessKeyForIamUser(iamUserName, environment);

  const { $metadata, AccessKey } = response;

  if ($metadata.httpStatusCode !== 200) {
    throw new Error(JSON.stringify(response));
  }

  return {
    username: AccessKey.UserName,
    accessKeyId: AccessKey.AccessKeyId,
    secretAccessKey: AccessKey.SecretAccessKey,
  };
};

const createNewAccessKeyForIamUser = async (iamUserName, environment) => {
  const client = new IAMClient({
    credentials: fromIni({
      profile: environment,
    }),
  });
  const input = {
    UserName: iamUserName,
  };
  const command = new CreateAccessKeyCommand(input);
  const response = await client.send(command);

  return response;
};

module.exports = {
  createAwsCredentialsForRepo,
  ENVIRONMENT,
};
