
Deploying this app is stupid. Add the following to `app.yaml` post deploy and don't commit it:

```
env_variables:
  DISCORD_TOKEN: <token>
```