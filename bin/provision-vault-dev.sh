#!/bin/sh -x

# install jq
apk add jq

# =====================================
#  healthchecks branch
# =====================================
if [ "$1" = "--healthcheck" ]; then
   wget -qO /tmp/vault.health.json http://vault:8200/v1/sys/health
   [ $? != 0 ] && exit 1
   [ $(jq -e '.initialized' /tmp/vault.health.json) = "false" ] && exit 1
   [ $(jq -e '.sealed'      /tmp/vault.health.json) = "true"  ] && exit 1
   [ $(jq -e '.standby'     /tmp/vault.health.json) = "true"  ] && exit 1
   echo "Vault is ready and healthy"
   exit 0
fi

# =====================================
#  main
# =====================================
wait-for-command -c '/bin/provision-vault --healthcheck'
if [ $? -ne 0 ]; then
  echo "Healthchecks failed"
  exit 1
fi
  
# enable transit engine for users-signing-keys
wget \
  --quiet \
  --output-document /tmp/vault.provision.json \
  --header "X-Vault-Token: $VAULT_DEV_ROOT_TOKEN_ID" \
  --post-data '{"type":"transit"}' \
  $VAULT_URL/v1/sys/mounts/users-signing-keys

# validate mounts
wget \
  --quiet \
  --output-document /tmp/vault.mounts.json \
  --header "X-Vault-Token: $VAULT_DEV_ROOT_TOKEN_ID" \
  $VAULT_URL/v1/sys/mounts

[ $(jq -e '.["users-signing-keys/"].type' /tmp/vault.mounts.json) = 'transit' ] && \
  echo "Missing transit engine mounted in 'users-signing-keys'" && \
  exit 1

exit 0