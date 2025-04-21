#/bin/bash
# 8080是默认的http端口，web访问使用。
## http://localhost:8080
## 默认用户名为 admin，密码为 admin
## 默认realm 账号密码为 "" ""

PROJECT_NAME=keycloak
CURRENT_PATH=$(cd "$(dirname "$0")" && pwd)
DATA_PATH="${CURRENT_PATH}/data"

SYSTEM="$(uname -o)"
if [ "$SYSTEM" == "Msys" ]; then
    export MSYS2_ARG_CONV_EXCL="*"
    DATA_PATH="$(cygpath -w "$DATA_PATH")"
    echo "Msys"
else
    echo "GNU/Linux"
fi

echo "DATA_PATH: $DATA_PATH"

docker rm -f ${PROJECT_NAME}
docker run -it \
--name ${PROJECT_NAME} \
-p 8080:8080 \
-e KEYCLOAK_ADMIN=admin \
-e KEYCLOAK_ADMIN_PASSWORD=admin \
-v "${DATA_PATH}:/opt/keycloak/data" \
quay.io/keycloak/keycloak:26.2.0 --spi-login-protocol-openid-connect-legacy-logout-redirect-uri=true start-dev
