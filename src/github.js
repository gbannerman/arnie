const _sodium = require("libsodium-wrappers");
const { Octokit } = require("@octokit/core");

const SECRETS = [
  { secretName: "AWS_ACCESS_KEY_ID", awsAccessKeyProperty: "accessKeyId" },
  {
    secretName: "AWS_SECRET_ACCESS_KEY",
    awsAccessKeyProperty: "secretAccessKey",
  },
];

const ORGANISATION = "administrate";

let GITHUB_ORG_PUBLIC_KEY = null;

const octokit = new Octokit({
  auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
});

const getOrganisationPublicKey = async () => {
  if (GITHUB_ORG_PUBLIC_KEY) {
    return GITHUB_ORG_PUBLIC_KEY;
  }

  const result = await octokit.request(
    "GET /orgs/{org}/actions/secrets/public-key",
    {
      org: ORGANISATION,
    }
  );

  GITHUB_ORG_PUBLIC_KEY = result.data;

  console.info("Set GITHUB_ORG_PUBLIC_KEY in cache");

  return GITHUB_ORG_PUBLIC_KEY;
};

const createAwsSecretsForRepo = async (repoName, environment, awsAccessKey) => {
  const repoId = await getRepoIdFromName(repoName);

  console.info(`Creating Secrets for GitHub repository: ${repoId}`);

  SECRETS.forEach(async ({ secretName, awsAccessKeyProperty }) => {
    const formattedSecretName = getSecretName(
      repoName,
      environment,
      secretName
    );
    await createSecretInOrganisation(
      formattedSecretName,
      awsAccessKey[awsAccessKeyProperty],
      [repoId]
    );
    console.info(`✅ Created ${formattedSecretName} for ${repoName}`);
  });
};

const encryptSecretValue = async (secretValue) => {
  const { key } = await getOrganisationPublicKey();

  if (!key) throw new Error("No Organisation Public Key found!");

  await _sodium.ready;

  // Convert Secret & Base64 key to Uint8Array.
  const binkey = _sodium.from_base64(key, _sodium.base64_variants.ORIGINAL);
  const binsec = _sodium.from_string(secretValue);

  //Encrypt the secret using Lib_Sodium
  const encBytes = _sodium.crypto_box_seal(binsec, binkey);

  // Convert encrypted Uint8Array to Base64
  const output = _sodium.to_base64(encBytes, _sodium.base64_variants.ORIGINAL);

  return output;
};

const createSecretInOrganisation = async (
  secretName,
  secretValue,
  selectedRepoIds = []
) => {
  const encryptedSecretValue = await encryptSecretValue(secretValue);
  const { key_id } = await getOrganisationPublicKey();

  const result = await octokit.request(
    "PUT /orgs/{org}/actions/secrets/{secret_name}",
    {
      org: ORGANISATION,
      key_id,
      secret_name: secretName,
      encrypted_value: encryptedSecretValue,
      visibility: selectedRepoIds.length ? "selected" : "private",
      selected_repository_ids: selectedRepoIds.length
        ? selectedRepoIds
        : undefined,
    }
  );

  if (result.status !== 201) {
    throw new Error(JSON.stringify(result));
  }
};

const getRepoIdFromName = async (name) => {
  const { data } = await octokit.request("GET /repos/{owner}/{repo}", {
    owner: ORGANISATION,
    repo: name,
  });

  return data.id;
};

const getSecretName = (repoName, environment, secretName) => {
  const repo = repoName.replace("-", "_");
  return `${repo}_${environment}_${secretName}`.toUpperCase();
};

const createEnvironmentInRepo = async (repoName, environment) => {
  const result = await octokit.request(
    "PUT /repos/{owner}/{repo}/environments/{environment_name}",
    {
      owner: ORGANISATION,
      repo: repoName,
      environment_name: environment,
    }
  );

  if (result.status !== 200) {
    throw new Error(JSON.stringify(result));
  }
};

module.exports = {
  createAwsSecretsForRepo,
  getSecretName,
  getRepoIdFromName,
  createSecretInOrganisation,
  createEnvironmentInRepo,
  getOrganisationPublicKey,
};
