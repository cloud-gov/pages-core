#!/bin/bash

set -e

sed -i'.bak' "s/((api-domain))/${API_DOMAIN}/" admin-client/nginx/conf/includes/headers.conf
rm admin-client/nginx/conf/includes/headers.conf.bak