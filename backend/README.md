# BackEndApi Azure Function

This directory is the deployable Azure Functions application for the
`BackEndApi` Function App. It uses the Node.js v4 programming model.

## Layout

- `host.json` contains the Azure Functions host configuration.
- `src/index.js` initializes the Functions runtime.
- `src/functions/BackEndApi.js` registers the `BackEndApi` HTTP function.
- `local.settings.json` is local-only and is intentionally ignored by Git.

The function is available at:

```text
https://<function-app-host>/api/BackEndApi
```

It accepts `GET` and `POST` requests without a function key. The current
handler returns the supplied `name` query parameter or request body as a
simple health response.

## Local development

From this directory:

```sh
npm install
npm start
```

The Azure Functions Core Tools must be installed for `npm start`.

## Azure target

The deployment target is the existing Function App named `BackEndApi`:

```text
/subscriptions/2a7e407e-2367-4738-879a-80d05e5601ee/resourceGroups/BackEndApi_group/providers/Microsoft.Web/sites/BackEndApi
```

Deploy from the repository root with:

```sh
az functionapp deployment source config-zip \
  --resource-group BackEndApi_group \
  --name BackEndApi \
  --src <package.zip>
```

The zip/package root must contain this directory's `host.json`,
`package.json`, `package-lock.json`, and `src/` contents.

## GitHub Actions authentication

The deployment workflow uses Azure federated credentials (OIDC). Add these
three **Actions secrets** to the GitHub repository before running the workflow:

| Secret | Value |
| --- | --- |
| `AZURE_CLIENT_ID` | Application/client ID of the Azure app registration or service principal |
| `AZURE_TENANT_ID` | Microsoft Entra tenant/directory ID |
| `AZURE_SUBSCRIPTION_ID` | `2a7e407e-2367-4738-879a-80d05e5601ee` |

The Azure app registration must also have a federated credential for this
repository and the `main` branch (and any branch used for manual workflow
runs). It needs permission to deploy the `BackEndApi` Function App, normally
through the **Website Contributor** role on the Function App or its resource
group.
