# Arnie

_A real action hero! 💪_

## Requirements

- Node v18 (or install [nvm](https://github.com/nvm-sh/nvm#install--update-script) and run `nvm use` from the repository root)
- A [GitHub Personal Access Token](https://github.com/settings/tokens) with `repo` and `admin:org` scopes.
- A `~/.aws/config` file with profiles for `staging` and `production`

## Setup

- Copy the example file and fill it with the GitHub Personal Access Token: `cp example.env .env`
- Install dependencies: `npm i`

## Usage

Run the following command:

```
npm start -- {AWS_STACK} {GITHUB_REPOSITORY}
```

where:

- `{AWS_STACK}` is the name of the stack in AWS
- `{GITHUB_REPOSITORY}` is the name of the GitHub repository

Examples:

```
npm start -- ui_testing ui-test-runner
npm start -- portal-auth portal-auth
```

The script will:

- Create an AWS access key for the CI user for the stack (assuming one exists)
- Create `ACCESS_KEY_ID` and `SECRET_ACCESS_KEY` secrets in the GitHub Organisation
- Allow the GitHub repository to access these secrets
- Create `staging` and `production` environments for the Github repository
