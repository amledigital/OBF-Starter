# 910 News Notes

1. most of the business logic is under features/rss/xml.js
2. you might need to hop into utils to fix some random customizations
3. If there are any issues with resizer v2, the original developer actually bypassed all of the resizer urls and just passed in the raw urls.  I added them back in because we were sending 4k images to the rss feed in the app and they were ingesting them that way.  
4. I was never able to get resizer V2 working locally, but deployed it seems to work and hydrate the auth token
5. I had to manually set the resizer url in blocks.json to the environment I am deploying to
    - for example, the default blocks.json config needs to be set to the environment you want to deploy to e.g. sandbox to sandox, then update to deploy to prod
6. I tried many different techniques to get automated push alerts to work.  I ended on using tags.  OBF doesn't correcty hydrate label.push_alert on the server side and I was never able to figure out how to resolve that issue.  I was able to create a work around using the canonical URL service and passing a query param flag `?allow_push=true` if that label was set to true.  But the canonical url service doesn't allow that functionality and only regards query params that are used to filter the content source.  
7. These notes are for anyone who comes along in the future. 


# Setup a new Outbound Feeds repo

This is a fusion themes based repository and is intended to be used as the starting point for using _Arc Outboundfeeds_. It doesn't matter if a client is currently using themes or not. This repo will be used to run Outbound feeds in its own dedicated environment.

## Setup

Pre-requisites:

- node / npm installed (node version > 12).
- docker

1. Create a local repo

Clone your Outbound Feeds repo to your local machine. In the arc-partners github account your repo will be named ORG-outboundfeeds, use your Arc organization name in place of ORG. For example, if your organization name is demo, your repo name would be demo-outboundfeeds.

```
git clone git@github.com:arc-partners/ORG-outboundfeeds.git
```

2. Create a read-only personal access token in github

To be able to run locally or deploy outboundfeed bundles you need to create a read-only token in [github](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token). This token needs to be added to your .npmrc file and will allow you to view and install outboundfeeds blocks. The .npmrc file must never be added to the repo or checked in. Please use the following format when setting up your .npmrc:

```
@wpmedia:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=<your personal access token>
```

3. Install the packages

```
npm install
```

4. Create .env

   Copy env.example to .env and edit the file to replace the placeholders with your correct values.

   - `CONTENT_BASE` - Set your org in `https://api.${ORG}.arcpublishing.com` [ALC](https://redirector.arcpublishing.com/alc/arc-products/pagebuilder/fusion/documentation/recipes/defining-arc-content-source.md#configuring-content_base-and-arc_access_token-for-local-development) This is used by content sources to get data from your prod or sandbox environment. Replace ORG with your org name, like demo or sandbox.demo. This should point to your prod or sandbox environments, not the OBF environments.
   - `ARC_ACCESS_TOKEN` - your readonly developer token. [ALC](https://redirector.arcpublishing.com/alc/arc-products/developer/user-documentation/accessing-the-arc-api/) This is used by content sources to get data from your prod or sandbox environment. This should be from your prod or sandbox environments, not the OBF environments.
   - resizerKey - your orgs resizerKey. If you don’t have it, please contact your Technical Delivery Manager (TDM)
   - `BLOCK_DIST_TAG` - To use production blocks, set this to 'stable', to use development blocks use 'beta'. Fusion defaults to stable if not set.

   The .env file is in .gitignore and should never be checked into github.

5. Update Mock websites

When running the editor locally the list of websites comes from a local file instead of your site service. To have your websites used, you must update the mock file `mocks/siteservice/api/v3/website` with your websites.

```
[
  {
    "_id": "website1",
    "display_name": "Website 1",
    "is_default_website": true
  },
  {
    "_id": "website2",
    "display_name": "Website 2",
    "is_default_website": false
  }
]
```

Run Fusion locally see [here](https://redirector.arcpublishing.com/alc/arc-products/pagebuilder/fusion/documentation/recipes/running-fusion-locally.md) for more details:

```
npx fusion start
```

Once fusion has finished starting you should be able to to get to the pagebuilder editor [pages](http://localhost/pagebuilder/pages) and [templates](http://localhost/pagebuilder/templates) to add and configure feeds locally. Once you have create your templates and resolvers you can use a tool like postman to see them at `http://localhost/arc/outboundfeeds/{FEED_NAME}?outputType=xml&_website={WEBSITE}`

Run tests with:

```
npm test
```

6. Once you are ready to deploy the bundle you will need to setup environment variables in the `environment/org-outboundfeeds.js` and or `environment/org-outboundfeeds-sandbox.js` files. Use the values from your local .env to set the `BLOCK_DIST_TAG` and `resizerKey`. Rename the files, replacing the clients org name with the `org` in the current names. Any values that should not be made public (resizerKey) need to be [encrypted](https://redirector.arcpublishing.com/alc/arc-products/pagebuilder/fusion/documentation/recipes/using-environment-secrets.md).

Once you are ready to [deploy](https://redirector.arcpublishing.com/alc/arc-products/pagebuilder/fusion/documentation/recipes/deploying-feature-pack.md) a bundle, run the npx fusion zip command.

```
npx fusion zip
```

Upload the new bundle that was created in the dist folder using the deployer screen and promote it to Live to run your new bundle.

For more information on developing outbound feeds:

- [intro](https://redirector.arcpublishing.com/alc/arc-products/arcio/user-docs/outbound-feeds-custom-block-development/)
- [blocks.json](https://redirector.arcpublishing.com/alc/arc-products/arcio/user-docs/blocksjson/)
- [Ejecting blocks](https://redirector.arcpublishing.com/alc/arc-products/arcio/user-docs/ejecting-a-block/)
- [Block Architecture](https://redirector.arcpublishing.com/alc/arc-products/arcio/user-docs/feature-blocks-architecture/)
- [Dependencies](https://redirector.arcpublishing.com/alc/arc-products/arcio/user-docs/dependencies/)
- [Utilities](https://redirector.arcpublishing.com/alc/arc-products/arcio/user-docs/outbound-feeds-development-utilities/)
- [Content Source](https://redirector.arcpublishing.com/alc/arc-products/arcio/user-docs/outbound-feeds-development-content-source/)
- [Output Types](https://redirector.arcpublishing.com/alc/arc-products/arcio/user-docs/outbound-feeds-development-output-types/)
