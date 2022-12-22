require("dotenv").config();

const { ENVIRONMENT, createAwsCredentialsForRepo } = require("./aws");
const {
  createEnvironmentInRepo,
  createAwsSecretsForRepo,
  getOrganisationPublicKey,
} = require("./github");

const run = async () => {
  const [githubRepoName, awsStackName] = process.argv.slice(2);

  if (!(githubRepoName && awsStackName)) {
    console.error(
      "❗️ You must provide the names of the GitHub repository and the AWS stack"
    );
  }

  // Do this once before any actions so that it's cached.
  await getOrganisationPublicKey();

  [ENVIRONMENT.STAGING, ENVIRONMENT.PRODUCTION].forEach(async (environment) => {
    const awsAccessKey = await createAwsAccessKey(environment, awsStackName);
    await createGithubSecrets(environment, githubRepoName, awsAccessKey);
    await createGithubEnvironment(environment, githubRepoName);
  });
};

const createAwsAccessKey = async (environment, awsStackName) => {
  console.info(`Creating AWS Access Key for ${awsStackName} in ${environment}`);

  const awsAccessKey = await createAwsCredentialsForRepo(
    awsStackName,
    environment
  );
  console.info("✅ AWS Access Key created successfully!");
  console.info(awsAccessKey);

  return awsAccessKey;
};

const createGithubSecrets = async (
  environment,
  githubRepoName,
  awsAccessKey
) => {
  console.info(`Creating ${environment} GitHub Secrets for ${githubRepoName}`);

  await createAwsSecretsForRepo(githubRepoName, environment, awsAccessKey);
  console.info("✅ GitHub Secrets created successfully!");
};

const createGithubEnvironment = async (environment, githubRepoName) => {
  console.info(
    `Creating ${environment} GitHub Environment for ${githubRepoName}`
  );

  await createEnvironmentInRepo(githubRepoName, environment);
  console.info("✅ GitHub Environment created successfully!");
};

run();
